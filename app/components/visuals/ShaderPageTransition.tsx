"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { SPACESHIP_TRANSITIONS_ENABLED } from "../../lib/featureFlags";
import {
  SHADER_WARP_CLOSE_MS,
  SHADER_WARP_OPEN_MS,
} from "../../lib/pageTransitionTiming";
import {
  loadShaderTransitionModule,
  onShaderTransitionIntent,
} from "../../lib/shaderTransitionLoader";
import { useTransitionStore } from "../../lib/store";

type ShaderWarpHandle = {
  playClose(durationMs: number): void;
  playOpen(durationMs: number): void;
  playReveal(durationMs: number): void;
  hide(): void;
  dispose(): void;
};

/**
 * 宇宙船の遷移はフラグが true のときだけ動的 import する。false なら null のままで、
 * 宇宙船のコンポーネント・シーン・モデル・動画は初期 JS に入らず、取得も実行もされない
 * （初期 JS に残るのは遅延チャンクの名前だけ）。
 */
const SpaceshipPageTransition = SPACESHIP_TRANSITIONS_ENABLED
  ? dynamic(() => import("./SpaceshipPageTransition"), { ssr: false })
  : null;

/**
 * 先読み（低優先）は load のあと、この時間だけ待ってから空き時間で始める。
 * ラボ計測（Lighthouse）の操作可能までの静かな時間帯に three の評価を割り込ませない。
 * 実際の利用者はそれより先にポインター・スクロール・キー・リンクへの接近で前倒しされる。
 */
const IDLE_PRELOAD_AFTER_LOAD_MS = 6000;

export default function ShaderPageTransition() {
  if (SpaceshipPageTransition) return <SpaceshipPageTransition />;
  return <WarpPageTransition />;
}

/**
 * 全画面シェーダー（ハイパースペース・ワープ）遷移の薄いラッパー。three 本体は
 * 動的 import でのみ読み込み、使えない（読み込み前・WebGL 不可・コンテキスト喪失・
 * 動きを減らす設定）ときは shaderReady=false のままにして普通の切り替えに任せる。
 *
 * 戻る/進む（popstate）ではワープしない。Next のルート差し替えは popstate と同時に
 * 起きるため、覆う前に新しいページが一瞬見えてしまう。履歴移動は普通に切り替える
 * （ホーム内のセクションは HomeSections が覆ってから差し替えるのでワープする）。
 */
function WarpPageTransition() {
  const hostRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<ShaderWarpHandle | null>(null);
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const phase = useTransitionStore((s) => s.phase);
  const overlayKind = useTransitionStore((s) => s.overlay);

  // 遅延読み込みと初期化・破棄
  useEffect(() => {
    const { setShaderReady } = useTransitionStore.getState();
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false;
    let loading = false;
    let lost = false;
    let idleHandle: number | null = null;

    const teardown = () => {
      overlayRef.current?.dispose();
      overlayRef.current = null;
      setShaderReady(false);
      // 再生途中なら覆いを外し、普通の切り替えに引き継ぐ（phase はそのまま）
      const state = useTransitionStore.getState();
      if (state.overlay === "shader") {
        state.setOverlay("none");
      }
    };

    const handleContextLost = () => {
      lost = true;
      teardown();
    };

    const init = () => {
      if (
        cancelled ||
        loading ||
        lost ||
        overlayRef.current ||
        motionQuery.matches
      ) {
        return;
      }
      loading = true;
      loadShaderTransitionModule()
        .then((mod) => {
          loading = false;
          const host = hostRef.current;
          if (cancelled || motionQuery.matches || !host || overlayRef.current) {
            return;
          }
          const overlay = mod.createShaderWarpOverlay(host, handleContextLost);
          if (!overlay) {
            return;
          }
          overlayRef.current = overlay;
          setShaderReady(true);
        })
        .catch(() => {
          // 読み込み失敗時は普通の切り替えのまま（次の意図で再試行）
          loading = false;
        });
    };

    // 低優先の先読み：load → 一定時間 → 空き時間
    let delayTimer: number | null = null;
    const scheduleIdle = () => {
      delayTimer = window.setTimeout(() => {
        delayTimer = null;
        if (typeof window.requestIdleCallback === "function") {
          idleHandle = window.requestIdleCallback(() => {
            idleHandle = null;
            init();
          });
        } else {
          init();
        }
      }, IDLE_PRELOAD_AFTER_LOAD_MS);
    };
    if (document.readyState === "complete") scheduleIdle();
    else window.addEventListener("load", scheduleIdle, { once: true });

    // ポインタやキーの最初の操作でも先読みする（初回クリックに間に合わせる）
    const onFirstInput = () => init();
    window.addEventListener("pointermove", onFirstInput, {
      once: true,
      passive: true,
    });
    window.addEventListener("pointerdown", onFirstInput, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onFirstInput, { once: true });
    window.addEventListener("scroll", onFirstInput, {
      once: true,
      passive: true,
    });
    window.addEventListener("touchstart", onFirstInput, {
      once: true,
      passive: true,
    });

    const unsubscribeIntent = onShaderTransitionIntent(init);

    const handleMotionChange = () => {
      if (motionQuery.matches) {
        teardown();
      }
    };
    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      cancelled = true;
      if (delayTimer !== null) window.clearTimeout(delayTimer);
      if (idleHandle !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
      window.removeEventListener("load", scheduleIdle);
      unsubscribeIntent();
      window.removeEventListener("pointermove", onFirstInput);
      window.removeEventListener("pointerdown", onFirstInput);
      window.removeEventListener("keydown", onFirstInput);
      window.removeEventListener("scroll", onFirstInput);
      window.removeEventListener("touchstart", onFirstInput);
      motionQuery.removeEventListener("change", handleMotionChange);
      teardown();
    };
  }, []);

  // ストアの phase に合わせてワープを再生する
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || overlayKind !== "shader") {
      return;
    }
    if (phase === "closing") {
      overlay.playClose(SHADER_WARP_CLOSE_MS);
    } else if (phase === "opening") {
      overlay.playOpen(SHADER_WARP_OPEN_MS);
    }
  }, [phase, overlayKind]);

  // 戻る/進む：ワープせず普通に切り替える。こちらから始めた遷移が
  // 開いている途中に履歴移動が割り込んだら、覆いを外して終わらせる。
  useEffect(() => {
    if (prevPathname.current === pathname) {
      return;
    }
    prevPathname.current = pathname;
    const currentPhase = useTransitionStore.getState().phase;
    if (currentPhase === "opening") {
      overlayRef.current?.hide();
      useTransitionStore.getState().setPhase("idle");
    }
  }, [pathname]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[101]"
    />
  );
}

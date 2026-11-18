"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  SHADER_WARP_CLOSE_MS,
  SHADER_WARP_OPEN_MS,
  SHADER_WARP_REVEAL_MS,
  prefersReducedMotion,
} from "../../lib/pageTransitionTiming";
import {
  loadShaderTransitionModule,
  onShaderTransitionIntent,
} from "../../lib/shaderTransitionLoader";
import { useTransitionStore } from "../../lib/store";

type ShaderWarpHandle = {
  playClose(durationMs: number): void;
  playOpen(durationMs: number): void;
  hide(): void;
  dispose(): void;
};

/** マウント後、この時間 + アイドル待ちでシェーダーを読み込む */
const IDLE_LOAD_DELAY_MS = 8000;

/**
 * 全画面シェーダー遷移の薄いラッパー。three 本体は動的 import でのみ読み込み、
 * 使えない（読み込み前・WebGL 不可・コンテキスト喪失・動きを減らす設定）ときは
 * shaderReady=false のままにしてハンガー扉に任せる。
 */
export default function ShaderPageTransition() {
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
      // 再生途中ならハンガー扉に引き継ぐ（phase はそのまま）
      const state = useTransitionStore.getState();
      if (state.overlay === "shader") {
        state.setOverlay("hangar");
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
          // 読み込み失敗時はハンガー扉のまま（次の意図で再試行）
          loading = false;
        });
    };

    const idleTimer = window.setTimeout(() => {
      if ("requestIdleCallback" in window) {
        idleHandle = window.requestIdleCallback(init, { timeout: 2000 });
      } else {
        init();
      }
    }, IDLE_LOAD_DELAY_MS);

    const unsubscribeIntent = onShaderTransitionIntent(init);

    const handleMotionChange = () => {
      if (motionQuery.matches) {
        teardown();
      }
    };
    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      cancelled = true;
      window.clearTimeout(idleTimer);
      if (idleHandle !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
      unsubscribeIntent();
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

  // 戻る/進むなど想定外の経路変更：履歴は遅らせず、開く演出だけ短く見せる
  useEffect(() => {
    if (prevPathname.current === pathname) {
      return;
    }
    prevPathname.current = pathname;
    const overlay = overlayRef.current;
    if (
      !overlay ||
      useTransitionStore.getState().phase !== "idle" ||
      prefersReducedMotion()
    ) {
      return;
    }
    overlay.playOpen(SHADER_WARP_REVEAL_MS);
  }, [pathname]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[101]"
    />
  );
}

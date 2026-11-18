"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  SHADER_FLY_CLOSE_MS,
  SHADER_FLY_OPEN_MS,
  SHADER_WARP_CLOSE_MS,
  SHADER_WARP_OPEN_MS,
  SHADER_WARP_REVEAL_MS,
  prefersReducedMotion,
} from "../../lib/pageTransitionTiming";
import { sectionFromLocation } from "../../lib/homeSections";
import {
  isHomePath,
  planetById,
  planetForView,
  rgbVec,
  type WarpJourney,
} from "../../lib/planets";
import {
  loadShaderTransitionModule,
  onShaderTransitionIntent,
} from "../../lib/shaderTransitionLoader";
import { useTransitionStore } from "../../lib/store";

type ShaderWarpHandle = {
  playClose(durationMs: number): void;
  playOpen(durationMs: number): void;
  playReveal(durationMs: number): void;
  setJourney(
    journey: WarpJourney,
    atmo: [number, number, number],
    horizon: [number, number, number],
    fromAtmo?: [number, number, number],
    fromHorizon?: [number, number, number],
  ): void;
  hide(): void;
  dispose(): void;
};

function applyWarpLook(
  overlay: ShaderWarpHandle,
  journey: WarpJourney,
  planetId: string | null,
  fromPlanetId: string | null = null,
) {
  const planet = planetById(planetId);
  const from = planetById(fromPlanetId ?? planetId);
  overlay.setJourney(
    journey,
    rgbVec(planet.haze),
    rgbVec(planet.accent),
    rgbVec(from.haze),
    rgbVec(from.accent),
  );
}

function closeMsFor(journey: WarpJourney): number {
  return journey === "fly-between" ? SHADER_FLY_CLOSE_MS : SHADER_WARP_CLOSE_MS;
}

function openMsFor(journey: WarpJourney): number {
  return journey === "fly-between" ? SHADER_FLY_OPEN_MS : SHADER_WARP_OPEN_MS;
}

/** 初回描画のあと、この時間以内の空き時間で宇宙船演出を読み込む（8秒は待たない） */
const IDLE_LOAD_TIMEOUT_MS = 1500;

/**
 * 全画面の宇宙船遷移の薄いラッパー。three 本体は動的 import でのみ読み込み、
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

  // 遅延読み込みと初期化・破棄（宇宙船シーン）
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

    let idleTimer: number | null = null;
    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(init, {
        timeout: IDLE_LOAD_TIMEOUT_MS,
      });
    } else {
      idleTimer = window.setTimeout(init, 0);
    }

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
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      if (idleHandle !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
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

  const warpJourney = useTransitionStore((s) => s.warpJourney);
  const warpPlanetId = useTransitionStore((s) => s.warpPlanetId);
  const warpFromPlanetId = useTransitionStore((s) => s.warpFromPlanetId);

  // ストアの phase に合わせて宇宙船の飛行を再生する
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || overlayKind !== "shader") {
      return;
    }
    applyWarpLook(overlay, warpJourney, warpPlanetId, warpFromPlanetId);
  }, [overlayKind, warpJourney, warpPlanetId, warpFromPlanetId]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || overlayKind !== "shader") {
      return;
    }
    if (phase === "closing") {
      overlay.playClose(closeMsFor(warpJourney));
    } else if (phase === "opening") {
      overlay.playOpen(openMsFor(warpJourney));
    }
  }, [phase, overlayKind, warpJourney]);

  // 戻る/進む：履歴は遅らせず、覆った最高潮から開く演出を見せる
  useEffect(() => {
    if (prevPathname.current === pathname) {
      return;
    }
    const prevPath = prevPathname.current;
    prevPathname.current = pathname;
    const overlay = overlayRef.current;
    const currentPhase = useTransitionStore.getState().phase;
    // closing/closed はこちらから始めた離脱。履歴戻りの割り込みは
    // idle だけでなく opening 中でも最高潮から開く演出を出す。
    if (
      !overlay ||
      currentPhase === "closing" ||
      currentPhase === "closed" ||
      prefersReducedMotion()
    ) {
      return;
    }
    const toSection = isHomePath(pathname)
      ? (sectionFromLocation(window.location.hash, window.location.search) ??
        "home")
      : null;
    const fromPlanet = planetForView(
      prevPath,
      prevPath.startsWith("/projects/") ? "projects" : "home",
    );
    const toPlanet = planetForView(pathname, toSection);
    let journey: WarpJourney = "neutral";
    if (!fromPlanet && toPlanet) journey = "enter-planet";
    else if (fromPlanet && !toPlanet) journey = "leave-space";
    else if (fromPlanet && toPlanet) journey = "fly-between";
    const planet = journey === "leave-space" ? fromPlanet : toPlanet;
    applyWarpLook(overlay, journey, planet?.id ?? null, fromPlanet?.id ?? null);
    overlay.playReveal(SHADER_WARP_REVEAL_MS);
    if (currentPhase !== "idle") {
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

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
import {
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
import { FrameSlicer } from "./frameSlicer";

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

/**
 * 先読み（低優先）は load のあと、この時間だけ待ってから空き時間で始める。
 * ラボ計測（Lighthouse）の操作可能までの静かな時間帯に重い評価を割り込ませない。
 * 実際の利用者はそれより先にポインター・スクロール・フォーカスで前倒しされる。
 */
const IDLE_PRELOAD_AFTER_LOAD_MS = 6000;
/** ポインターがメニュー（ナビ）にこの距離まで近づいたら急ぎの準備に切り替える */
const NEAR_NAV_PX = 160;
const INTENT_SELECTOR =
  'a[href], button, [role="tab"], [data-transition-intent]';

/**
 * 全画面の宇宙船遷移の薄いラッパー。three 本体は動的 import でのみ読み込み、
 * 使えない（読み込み前・WebGL 不可・コンテキスト喪失・動きを減らす設定）ときは
 * shaderReady=false のままにしてハンガー扉に任せる。
 *
 * 準備は FrameSlicer で数 ms ずつ進める（低優先は requestIdleCallback の空き時間だけ、
 * 操作の意図が来たら MessageChannel で急ぐ）。どちらも 50ms を超える長いタスクを作らない。
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
    let lost = false;
    let slicer: FrameSlicer | null = null;
    let idleHandle = 0;
    let delayTimer = 0;

    const teardown = () => {
      slicer?.cancel();
      slicer = null;
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

    const init = (urgent: boolean) => {
      if (cancelled || lost || overlayRef.current || motionQuery.matches) {
        return;
      }
      if (slicer) {
        // 準備中に操作の意図が来たら急ぐ
        if (urgent) slicer.setUrgent();
        return;
      }
      const current = new FrameSlicer({ urgent });
      slicer = current;
      document.documentElement.dataset.shipPrep = urgent ? "urgent" : "idle";
      loadShaderTransitionModule()
        .then(async (mod) => {
          const host = hostRef.current;
          if (current.isCancelled || !host) return;
          // モジュール評価のあとは必ず一度譲る
          await current.pause();
          const overlay = await mod.createShaderWarpOverlayAsync(
            host,
            handleContextLost,
            current,
          );
          if (current.isCancelled || cancelled || motionQuery.matches) {
            overlay?.dispose();
            return;
          }
          if (slicer === current) slicer = null;
          if (!overlay) return;
          overlayRef.current = overlay;
          document.documentElement.dataset.shipPrep = "ready";
          setShaderReady(true);
        })
        .catch(() => {
          // 打ち切り・読み込み失敗時はハンガー扉のまま（次の意図で再試行）
          if (slicer === current) slicer = null;
        });
    };

    // 低優先の先読み：load → 一定時間 → 空き時間
    const scheduleIdle = () => {
      delayTimer = window.setTimeout(() => {
        delayTimer = 0;
        if (typeof window.requestIdleCallback === "function") {
          idleHandle = window.requestIdleCallback(() => {
            idleHandle = 0;
            init(false);
          });
        } else {
          init(false);
        }
      }, IDLE_PRELOAD_AFTER_LOAD_MS);
    };
    if (document.readyState === "complete") scheduleIdle();
    else window.addEventListener("load", scheduleIdle, { once: true });

    // 意図の弱い操作（動かす・スクロール・触れる）は低優先で開始
    const onSoftIntent = () => init(false);
    // 意図の強い操作（押す・キー・リンクに乗る・フォーカス）は急ぎ
    const onHardIntent = () => init(true);
    const onPointerOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target?.closest?.(INTENT_SELECTOR)) init(true);
    };
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as Element | null;
      if (target?.closest?.(INTENT_SELECTOR)) init(true);
    };
    // ポインターがナビに近づいた（まだ乗っていない）段階で急ぐ
    let nearRaf = 0;
    let lastPointer: { x: number; y: number } | null = null;
    const checkNear = () => {
      nearRaf = 0;
      if (!lastPointer || overlayRef.current || slicer?.isUrgent) return;
      const navs = document.querySelectorAll("nav, [data-transition-intent]");
      for (const nav of navs) {
        const r = nav.getBoundingClientRect();
        const dx = Math.max(r.left - lastPointer.x, 0, lastPointer.x - r.right);
        const dy = Math.max(r.top - lastPointer.y, 0, lastPointer.y - r.bottom);
        if (Math.hypot(dx, dy) <= NEAR_NAV_PX) {
          init(true);
          return;
        }
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      init(false);
      lastPointer = { x: e.clientX, y: e.clientY };
      if (!nearRaf) nearRaf = requestAnimationFrame(checkNear);
    };

    const passive = { passive: true } as const;
    window.addEventListener("pointermove", onPointerMove, passive);
    window.addEventListener("scroll", onSoftIntent, passive);
    window.addEventListener("touchstart", onSoftIntent, passive);
    window.addEventListener("pointerdown", onHardIntent, passive);
    window.addEventListener("keydown", onHardIntent);
    document.addEventListener("pointerover", onPointerOver, passive);
    document.addEventListener("focusin", onFocusIn);

    const unsubscribeIntent = onShaderTransitionIntent(init);

    const handleMotionChange = () => {
      if (motionQuery.matches) {
        teardown();
      }
    };
    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      cancelled = true;
      if (delayTimer) window.clearTimeout(delayTimer);
      if (idleHandle && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (nearRaf) cancelAnimationFrame(nearRaf);
      window.removeEventListener("load", scheduleIdle);
      unsubscribeIntent();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onSoftIntent);
      window.removeEventListener("touchstart", onSoftIntent);
      window.removeEventListener("pointerdown", onHardIntent);
      window.removeEventListener("keydown", onHardIntent);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("focusin", onFocusIn);
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
    const fromPlanet = planetForView(prevPath);
    const toPlanet = planetForView(pathname);
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

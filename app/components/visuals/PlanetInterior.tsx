"use client";

import { useEffect, useRef } from "react";
import { rgbCss, type PlanetTheme } from "../../lib/planets";
import { prefersReducedMotion } from "../../lib/pageTransitionTiming";
import type { PlanetSceneHandle } from "./planetScene";

type Props = {
  theme: PlanetTheme;
};

/**
 * 惑星ページの背景。three のシーン本体（planetScene）は動的 import で
 * 後から読み込み、それまで / WebGL が使えないときは CSS のグラデーションを見せる。
 * - 動きを減らす設定：低品質で 1 フレームだけ描いて止める（ループなし）
 * - タブ非表示・画面外：ループを止める
 * - ポインター / 傾き（許可ダイアログなし）で視差
 */
export default function PlanetInterior({ theme }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PlanetSceneHandle | null>(null);
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
    sceneRef.current?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduce = prefersReducedMotion();
    let cancelled = false;
    let onScreen = true;
    let visible = !document.hidden;
    let idleHandle = 0;
    let idleTimer = 0;
    let resizeRaf = 0;

    const sync = () => {
      const s = sceneRef.current;
      if (!s) return;
      if (s.animate && visible && onScreen) s.start();
      else s.stop();
    };

    const init = async () => {
      let mod: typeof import("./planetScene");
      try {
        mod = await import("./planetScene");
      } catch {
        return;
      }
      if (cancelled) return;
      const scene = mod.createPlanetScene(host, {
        reduce,
        onContextLost: () => {
          // CSS のグラデーションに戻る
          sceneRef.current?.dispose();
          sceneRef.current = null;
        },
      });
      if (!scene) return;
      sceneRef.current = scene;
      scene.setTheme(themeRef.current);
      sync();
    };

    // 初回描画を邪魔しないよう空き時間に組み立てる
    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(() => void init(), {
        timeout: 600,
      });
    } else {
      idleTimer = window.setTimeout(() => void init(), 0);
    }

    const onResize = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        sceneRef.current?.resize();
      });
    };
    window.addEventListener("resize", onResize);

    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const onPointer = (e: PointerEvent) => {
      if (reduce) return;
      sceneRef.current?.setLook(
        clamp((e.clientX / window.innerWidth - 0.5) * 2),
        clamp((e.clientY / window.innerHeight - 0.5) * 2),
      );
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    // 許可ダイアログは出さない。イベントが届く端末だけで傾きを使う。
    const onOrient = (e: DeviceOrientationEvent) => {
      if (reduce || e.gamma == null || e.beta == null) return;
      sceneRef.current?.setLook(clamp(e.gamma / 25), clamp((e.beta - 40) / 35));
    };
    window.addEventListener("deviceorientation", onOrient);

    const onVis = () => {
      visible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVis);

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          onScreen = entries.some((entry) => entry.isIntersecting);
          sync();
        },
        { threshold: 0 },
      );
      io.observe(host);
    }

    return () => {
      cancelled = true;
      if (idleHandle && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (idleTimer) window.clearTimeout(idleTimer);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onOrient);
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-50 h-full w-full overflow-hidden"
      style={{
        backgroundColor: rgbCss(theme.skyTop),
        // 3D が読み込まれるまで / 使えないときの空と地平
        backgroundImage: `linear-gradient(to bottom, ${rgbCss(theme.skyTop)} 0%, ${rgbCss(theme.skyHorizon)} 58%, ${rgbCss(theme.groundHi)} 62%, ${rgbCss(theme.ground)} 100%)`,
      }}
    >
      {/* 本文のコントラストを保つ上部の暗幕 */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${rgbCss(theme.skyTop, 0.72)} 0%, ${rgbCss(theme.skyTop, 0.28)} 28%, transparent 58%)`,
        }}
      />
    </div>
  );
}

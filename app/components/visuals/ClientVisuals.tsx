"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// クライアントコンポーネント内でssr:falseのdynamic importを使う
const StarBackground = dynamic(
  () => import("./StarBackground"),
  { ssr: false }
);
const MouseTrail = dynamic(
  () => import("./MouseTrail"),
  { ssr: false }
);
const CustomCursor = dynamic(
  () => import("./CustomCursor"),
  { ssr: false }
);

export default function ClientVisuals() {
  const [config, setConfig] = useState<{
    ready: boolean;
    showStars: boolean;
    showPointerFx: boolean;
  }>({
    ready: false,
    showStars: false,
    showPointerFx: false,
  });

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const saveData = connection?.saveData ?? false;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const cpuCores = navigator.hardwareConcurrency ?? 8;
    const isLowSpec = deviceMemory <= 4 || cpuCores <= 4;
    const shouldSkipVisuals = reducedMotion || saveData;
    const allowStars = !isMobile && !shouldSkipVisuals && !isLowSpec;

    const handlePointerMove = () => {
      setConfig((prev) => ({ ...prev, showPointerFx: true }));
      window.removeEventListener("pointermove", handlePointerMove);
    };

    const waitInitialInteraction = (callback: () => void) => {
      const done = () => {
        window.removeEventListener("pointerdown", done);
        window.removeEventListener("scroll", done);
        window.removeEventListener("keydown", done);
        callback();
      };

      window.addEventListener("pointerdown", done, { once: true, passive: true });
      window.addEventListener("scroll", done, { once: true, passive: true });
      window.addEventListener("keydown", done, { once: true });

      return () => {
        window.removeEventListener("pointerdown", done);
        window.removeEventListener("scroll", done);
        window.removeEventListener("keydown", done);
      };
    };

    let cleanupInitialInteraction: (() => void) | null = null;

    const activate = () => {
      setConfig({
        ready: true,
        showStars: false,
        showPointerFx: false,
      });
      if (allowStars) {
        cleanupInitialInteraction = waitInitialInteraction(() => {
          setConfig((prev) => ({ ...prev, showStars: true }));
        });
      }
      if (canHover && !shouldSkipVisuals) {
        window.addEventListener("pointermove", handlePointerMove, { once: true });
      }
    };

    // 初回描画とLCP計測を優先して、装飾ビジュアルはアイドル時に起動
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(activate, { timeout: 1500 });
      return () => {
        window.cancelIdleCallback(id);
        window.removeEventListener("pointermove", handlePointerMove);
        cleanupInitialInteraction?.();
      };
    }

    const timer = setTimeout(activate, 1200);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", handlePointerMove);
      cleanupInitialInteraction?.();
    };
  }, []);

  if (!config.ready) return null;

  return (
    <>
      {config.showStars && <StarBackground />}
      {config.showPointerFx && (
        <>
          <MouseTrail />
          <CustomCursor />
        </>
      )}
    </>
  );
}

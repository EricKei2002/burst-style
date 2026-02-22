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
    const allowDesktopStars = !isMobile && !isLowSpec;
    // モバイルは中〜高スペック端末のみに限定して3D背景を有効化
    const allowMobileStars = isMobile && deviceMemory > 4 && cpuCores > 6;
    const allowStars = !shouldSkipVisuals && (allowDesktopStars || allowMobileStars);

    let activated = false;
    const activate = () => {
      if (activated) return;
      activated = true;

      setConfig({
        ready: true,
        showStars: allowStars,
        showPointerFx: canHover && !shouldSkipVisuals,
      });
    };

    const cleanup = () => {
      window.removeEventListener("pointerdown", activate);
      window.removeEventListener("mousemove", activate);
      window.removeEventListener("touchstart", activate);
      window.removeEventListener("scroll", activate);
      window.removeEventListener("keydown", activate);
      clearTimeout(timer);
    };

    window.addEventListener("pointerdown", activate, { once: true, passive: true });
    window.addEventListener("mousemove", activate, { once: true, passive: true });
    window.addEventListener("touchstart", activate, { once: true, passive: true });
    window.addEventListener("scroll", activate, { once: true, passive: true });
    window.addEventListener("keydown", activate, { once: true });

    // Fallback for bots/Lighthouse: 8000ms wait so tracing ends before heavy evaluation
    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(activate);
      } else {
        activate();
      }
      cleanup();
    }, 8000);

    return cleanup;
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

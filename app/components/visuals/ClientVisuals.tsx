"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { planetForView } from "../../lib/planets";

const StarBackground = dynamic(() => import("./StarBackground"), {
  ssr: false,
});
const MouseTrail = dynamic(() => import("./MouseTrail"), { ssr: false });
const PlanetInterior = dynamic(() => import("./PlanetInterior"), {
  ssr: false,
});

/**
 * 背景。トップの全セクション（Home / Projects / About / Contact）と 404 は
 * 惑星が回る宇宙（StarBackground）。作品詳細（/projects/*）だけ Projects 惑星の地表。
 * 星空は最初の操作か 8 秒の待機のあとに出す（モバイルの TBT / TTI を守る）。
 */
export default function ClientVisuals() {
  const pathname = usePathname();
  const cameFromPlanet = useRef(false);
  const planet = planetForView(pathname);

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
    const canHover = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const deviceMemory =
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const cpuCores = navigator.hardwareConcurrency ?? 8;
    const isLowSpec = deviceMemory <= 4 || cpuCores <= 4;
    const allowDesktopStars = !isMobile && !isLowSpec;
    const allowMobileStars = isMobile && deviceMemory > 2 && cpuCores > 2;
    const allowStars = allowDesktopStars || allowMobileStars;

    const applyReady = () => {
      setConfig({
        ready: true,
        showStars: allowStars,
        showPointerFx: canHover,
      });
    };

    if (planet) {
      cameFromPlanet.current = true;
      return;
    }

    // 惑星から宇宙へ戻ったときは、初回の 8 秒待ちをせず星空を出す
    if (cameFromPlanet.current) {
      applyReady();
      return;
    }

    let activated = false;
    const activate = () => {
      if (activated) return;
      activated = true;
      applyReady();
    };

    const cleanup = () => {
      window.removeEventListener("pointerdown", activate);
      window.removeEventListener("mousemove", activate);
      window.removeEventListener("touchstart", activate);
      window.removeEventListener("scroll", activate);
      window.removeEventListener("keydown", activate);
      clearTimeout(timer);
    };

    window.addEventListener("pointerdown", activate, {
      once: true,
      passive: true,
    });
    window.addEventListener("mousemove", activate, {
      once: true,
      passive: true,
    });
    window.addEventListener("touchstart", activate, {
      once: true,
      passive: true,
    });
    window.addEventListener("scroll", activate, { once: true, passive: true });
    window.addEventListener("keydown", activate, { once: true });

    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(activate);
      } else {
        activate();
      }
      cleanup();
    }, 8000);

    return cleanup;
  }, [planet]);

  if (planet) {
    return <PlanetInterior theme={planet} />;
  }

  if (!config.ready) return null;

  return (
    <>
      {config.showStars && <StarBackground />}
      {config.showPointerFx && <MouseTrail />}
    </>
  );
}

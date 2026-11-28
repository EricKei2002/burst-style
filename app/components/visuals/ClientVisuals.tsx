"use client";

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  HOME_SECTION_EVENT,
  isHomeSection,
  type HomeSection,
} from "../../lib/homeSections";
import { backdropForView, isHomePath, planetForView } from "../../lib/planets";

const StarBackground = dynamic(() => import("./StarBackground"), {
  ssr: false,
});
const MouseTrail = dynamic(() => import("./MouseTrail"), { ssr: false });
const PlanetInterior = dynamic(() => import("./PlanetInterior"), {
  ssr: false,
});

function readHomeSection(): HomeSection {
  if (typeof document === "undefined") return "home";
  const value = document.documentElement.dataset.homeSection ?? null;
  return isHomeSection(value) ? value : "home";
}

export default function ClientVisuals() {
  const pathname = usePathname();
  // サーバー描画と同じ "home" から始め、描画前（useLayoutEffect）に URL の状態へ合わせる。
  // 初回から <html data-home-section> を読むと、#projects などの直リンクで水和が食い違う
  const [homeSection, setHomeSection] = useState<HomeSection>("home");
  const cameFromPlanet = useRef(false);

  useLayoutEffect(() => {
    if (!isHomePath(pathname)) {
      return;
    }
    const sync = () => setHomeSection(readHomeSection());
    sync();
    window.addEventListener(HOME_SECTION_EVENT, sync);
    return () => window.removeEventListener(HOME_SECTION_EVENT, sync);
  }, [pathname]);

  const planet = planetForView(
    pathname,
    isHomePath(pathname) ? homeSection : null,
  );

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
    return (
      <PlanetInterior
        theme={planet}
        backdrop={backdropForView(pathname, planet)}
      />
    );
  }

  if (!config.ready) return null;

  return (
    <>
      {config.showStars && <StarBackground />}
      {config.showPointerFx && <MouseTrail />}
    </>
  );
}

"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import StarfieldGravity from "./StarfieldGravity";

// Canvas 内（R3F の独自 reconciler）では next/dynamic を使わない。
// Next 16.4 の next/dynamic は ReactDOM 専用の use(browser()) でバイアウトするため、
// R3F の reconciler 上では React error #438 になりページ全体が落ちる。
// React.lazy + Suspense なら R3F でも動き、このファイル自体が ssr:false で読まれるため SSR も発生しない。
const TheSun = lazy(() => import("./TheSun"));
const Moon = lazy(() => import("./Moon"));
const Earth = lazy(() => import("./Earth"));
const ShootingStars = lazy(() => import("./ShootingStars"));

export default function StarBackground() {
  const observerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [showCelestialsNow, setShowCelestialsNow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // モバイルでも条件付きで描画する（低負荷設定）
  const [isMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  // パーティクル数をデバイスに応じて調整
  const [starCount] = useState(() => {
    if (typeof window === "undefined") return 1200;

    const deviceMemory =
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const cpuCores = navigator.hardwareConcurrency ?? 8;

    if (deviceMemory <= 2 || cpuCores <= 2) return 0;
    if (window.innerWidth < 768) {
      // ユーザーの要望により、モバイルでも星の数を大幅に増やす（パフォーマンスとのバランスを取って700程度に）
      if (deviceMemory <= 4 || cpuCores <= 6) return 300;
      return 700;
    }
    if (window.innerWidth < 1280 || deviceMemory <= 4 || cpuCores <= 4)
      return 650;
    return 1000;
  });
  const [showCelestialBodies] = useState(() => {
    if (typeof window === "undefined") return false;
    const deviceMemory =
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const cpuCores = navigator.hardwareConcurrency ?? 8;
    // モバイルでも天体（惑星や月など）を描画するように条件を緩和（極端な低スペックのみ除外）
    return deviceMemory > 2 && cpuCores > 2;
  });

  useEffect(() => {
    const target = observerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.01 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || starCount === 0) return;

    const activate = () => setIsReady(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(activate, { timeout: 900 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(activate, 500);
    return () => clearTimeout(timer);
  }, [isVisible, starCount]);

  useEffect(() => {
    if (!isReady || !showCelestialBodies) return;

    const activate = () => setShowCelestialsNow(true);
    const isMobile = window.innerWidth < 768;
    // モバイルはLCP保護のために遅延させるが、デスクトップはすぐ表示して「再読み込み」に見えるカクつきを防ぐ
    const delay = isMobile ? 2500 : 100;
    const timeout = isMobile ? 3500 : 200;

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(activate, { timeout });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(activate, delay);
    return () => clearTimeout(timer);
  }, [isReady, showCelestialBodies]);

  if (starCount === 0) {
    return (
      <div
        className="fixed inset-0 -z-50 h-full w-full bg-[#050505]"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={observerRef}
      className="fixed inset-0 -z-50 h-full w-full bg-[#050505]"
      aria-hidden="true"
    >
      {isReady && (
        <Canvas
          camera={{ position: [0, 0, 1] }}
          gl={{
            alpha: false,
            antialias: false,
            powerPreference: "high-performance",
          }}
          dpr={isMobile ? [0.75, 1] : [1, 1.1]}
        >
          <ambientLight intensity={0.1} />
          <Suspense fallback={null}>
            {showCelestialBodies && showCelestialsNow && <TheSun />}
            {showCelestialBodies && showCelestialsNow && <Moon />}
            {showCelestialBodies && showCelestialsNow && <Earth />}
          </Suspense>

          <StarfieldGravity
            count={starCount}
            strength={isMobile ? 0.38 : 0.68}
          />
          <Suspense fallback={null}>
            {showCelestialsNow && <ShootingStars />}
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ReactLenis = dynamic(
  () => import("@studio-freight/react-lenis").then((mod) => mod.ReactLenis),
  { ssr: false }
);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [shouldUseLenis, setShouldUseLenis] = useState(false);

  useEffect(() => {
    const initLenis = () => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
      setShouldUseLenis(!reducedMotion && !isCoarsePointer);
    };

    // モバイルの重いLCP要素の描画が完了するのを待つため、厳密な遅延を設ける。
    // requestIdleCallbackのtimeoutを使うとTTI計測期間中に強制実行されTBT/LCP悪化につながるため、setTimeoutを基本とする。
    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(initLenis);
      } else {
        initLenis();
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  if (!shouldUseLenis) {
    return <>{children}</>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>{children as any}</ReactLenis>;
}

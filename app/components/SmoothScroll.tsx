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

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(initLenis, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    } else {
      const timer = setTimeout(initLenis, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!shouldUseLenis) {
    return <>{children}</>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>{children as any}</ReactLenis>;
}

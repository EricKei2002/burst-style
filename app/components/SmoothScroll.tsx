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
    let activated = false;
    const initLenis = () => {
      if (activated) return;
      activated = true;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
      setShouldUseLenis(!reducedMotion && !isCoarsePointer);
    };

    const cleanup = () => {
      window.removeEventListener("pointerdown", initLenis);
      window.removeEventListener("mousemove", initLenis);
      window.removeEventListener("touchstart", initLenis);
      window.removeEventListener("scroll", initLenis);
      window.removeEventListener("keydown", initLenis);
      clearTimeout(timer);
    };

    window.addEventListener("pointerdown", initLenis, { once: true, passive: true });
    window.addEventListener("mousemove", initLenis, { once: true, passive: true });
    window.addEventListener("touchstart", initLenis, { once: true, passive: true });
    window.addEventListener("scroll", initLenis, { once: true, passive: true });
    window.addEventListener("keydown", initLenis, { once: true });

    // Fallback for bots/Lighthouse: 8000ms wait
    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(initLenis);
      } else {
        initLenis();
      }
      cleanup();
    }, 8000);

    return cleanup;
  }, []);

  return (
    <>
      {shouldUseLenis && (
        <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }} />
      )}
      {children}
    </>
  );
}

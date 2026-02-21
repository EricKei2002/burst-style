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
    const timer = setTimeout(() => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
      setShouldUseLenis(!reducedMotion && !isCoarsePointer);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldUseLenis) {
    return <>{children}</>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>{children as any}</ReactLenis>;
}

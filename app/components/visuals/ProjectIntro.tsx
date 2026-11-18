"use client";

import { useEffect, useState } from "react";

export default function ProjectIntro() {
  const [phase, setPhase] = useState<"intro" | "fading" | "done">("intro");

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("fading");
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleTransitionEnd = () => {
    if (phase === "fading") {
      setPhase("done");
    }
  };

  if (phase === "done") return null;

  return (
    <div
      role="presentation"
      aria-hidden="true"
      onTransitionEnd={handleTransitionEnd}
      style={{
        transition: "opacity 0.8s ease-out",
        opacity: phase === "fading" ? 0 : 1,
        // 演出は見た目だけ。下のコンテンツへの最初のクリックを奪わない
        pointerEvents: "none",
      }}
      className="fixed inset-0 z-9999 cursor-pointer overflow-hidden bg-transparent"
    >
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
    </div>
  );
}

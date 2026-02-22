"use client";

import { Canvas } from "@react-three/fiber";
import WarpStars from "../visuals/WarpStars";

interface HeroStarsCanvasProps {
  isWarping: boolean;
  starCount: number;
  qualityTier: "high" | "mid" | "low";
}

export default function HeroStarsCanvas({
  isWarping,
  starCount,
  qualityTier,
}: HeroStarsCanvasProps) {
  const dpr: [number, number] =
    qualityTier === "high" ? [1, 1.5] : qualityTier === "mid" ? [0.9, 1.2] : [0.75, 1];

  return (
    <Canvas
      camera={{ position: [0, 0, 50], fov: 75 }}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      dpr={dpr}
    >
      <WarpStars isWarping={isWarping} count={starCount} />
    </Canvas>
  );
}

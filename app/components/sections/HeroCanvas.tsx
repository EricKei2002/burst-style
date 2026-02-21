"use client";

import { Canvas } from "@react-three/fiber";
import WarpStars from "../visuals/WarpStars";

interface HeroCanvasProps {
  isWarping: boolean;
  starCount: number;
  qualityTier: "high" | "mid" | "low";
}

// Hero用のThree.jsキャンバスを分離コンポーネントとして定義
// dynamic importによりThree.jsバンドルは必要な時だけロードされる
export default function HeroCanvas({ isWarping, starCount, qualityTier }: HeroCanvasProps) {
  const dpr: [number, number] = qualityTier === "high" ? [1, 1.5] : [1, 1.25];

  return (
    <Canvas
      camera={{ position: [0, 0, 50], fov: 75 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      dpr={dpr}
    >
      <fog attach="fog" args={['#000', 0, 100]} />
      <WarpStars isWarping={isWarping} count={starCount} />
    </Canvas>
  );
}

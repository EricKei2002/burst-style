"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function RotatingStars() {
  const starsRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      starsRef.current.rotation.x = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <group ref={starsRef}>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </group>
  );
}

export default function StarBackground() {
  return (
    <div className="fixed inset-0 -z-50 h-full w-full bg-[#050505]">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        gl={{ alpha: false, antialias: false }}
      >
        <RotatingStars />
      </Canvas>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { TextureLoader } from "three";

export default function Moon() {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useLoader(TextureLoader, "/moon.jpg");

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime * 0.2 + Math.PI; // 太陽と反対位相 (π)
      const radius = 18;

      meshRef.current.position.x = Math.sin(t) * radius;
      meshRef.current.position.y = Math.cos(t * 0.5) * 15 + 10;
      meshRef.current.position.z = Math.cos(t) * radius - 35;

      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef} position={[-25, -5, -20]}>
      <sphereGeometry args={[2.5, 32, 32]} />
      <meshStandardMaterial
        map={texture}
        emissiveMap={texture}
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={0.4}
        roughness={0.8}
        metalness={0.1}
      />
      <pointLight intensity={2.0} distance={60} color="#ffffff" decay={2} />
    </mesh>
  );
}

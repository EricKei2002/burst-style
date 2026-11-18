"use client";

import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { TextureLoader } from "three";

export default function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useLoader(TextureLoader, "/earth.jpg");

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime * 0.2 + Math.PI * 1.5; // 位相: 太陽=0, 月=180, 地球=270
      const radius = 18;

      meshRef.current.position.x = Math.sin(t) * radius;
      meshRef.current.position.y = Math.cos(t * 0.5) * 15 - 5;
      meshRef.current.position.z = Math.cos(t) * radius - 35;

      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef} position={[40, -10, -40]}>
      <sphereGeometry args={[3, 32, 32]} />
      <meshStandardMaterial
        map={texture}
        emissiveMap={texture}
        color="#ffffff"
        roughness={0.5}
        metalness={0.6}
        emissive="#eeeeff"
        emissiveIntensity={1.2}
      />
      <pointLight intensity={0.8} distance={40} color="#ccddff" decay={2} />
    </mesh>
  );
}

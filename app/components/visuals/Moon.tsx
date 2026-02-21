"use client";

import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { TextureLoader } from "three";

export default function Moon() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // 信頼性のためにローカルテクスチャを使用
  const texture = useLoader(TextureLoader, '/moon.jpg');

  useFrame((state) => {
    if (meshRef.current) {
      // 軌道ロジック: 太陽と反対 (PIの位相シフト)
      const t = state.clock.elapsedTime * 0.2 + Math.PI; // 同じ速度、反対の位相
      const radius = 35; // 同じ半径
      
      meshRef.current.position.x = Math.sin(t) * radius;
      meshRef.current.position.y = Math.cos(t * 0.5) * 15 + 10; // 同じ垂直波
      meshRef.current.position.z = Math.cos(t) * radius - 20;

      meshRef.current.rotation.y += 0.005; // 目に見える回転
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

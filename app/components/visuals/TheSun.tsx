"use client";

import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { TextureLoader } from "three";

export default function TheSun() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // 信頼性のためにローカルテクスチャを使用
  const texture = useLoader(TextureLoader, '/sun.jpg');

  useFrame((state) => {
    if (meshRef.current) {
      // 軌道ロジック: 同期のために標準化された速度
      const t = state.clock.elapsedTime * 0.2; // 速度
      const radius = 35; // 軌道半径
      
      meshRef.current.position.x = Math.sin(t) * radius;
      meshRef.current.position.y = Math.cos(t * 0.5) * 15 + 10; // 垂直波
      meshRef.current.position.z = Math.cos(t) * radius - 20;
      
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={meshRef} position={[25, 10, -30]}>
      <sphereGeometry args={[4, 32, 32]} />
      <meshStandardMaterial 
        map={texture}
        emissiveMap={texture}
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={2} 
        roughness={0.4}
      />
      <pointLight intensity={3} distance={100} color="#ff8800" decay={2} />
    </mesh>
  );
}

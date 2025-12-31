"use client";

import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { TextureLoader } from "three";

export default function Moon() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Using local texture for reliability
  const texture = useLoader(TextureLoader, '/moon.jpg');

  useFrame((state) => {
    if (meshRef.current) {
      // Orbit logic: Opposite to Sun (Phase shift of PI)
      const t = state.clock.elapsedTime * 0.2 + Math.PI; // Same speed, opposite phase
      const radius = 35; // Same radius
      
      meshRef.current.position.x = Math.sin(t) * radius;
      meshRef.current.position.y = Math.cos(t * 0.5) * 15 + 10; // Same vertical wave
      meshRef.current.position.z = Math.cos(t) * radius - 20;

      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={meshRef} position={[-25, -5, -20]}>
      <sphereGeometry args={[2.5, 64, 64]} />
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

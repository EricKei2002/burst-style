"use client";

import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { TextureLoader } from "three";

export default function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Using local texture for reliability
  const texture = useLoader(TextureLoader, '/sun.jpg');

  useFrame((state) => {
    if (meshRef.current) {
      // Orbit logic: Standardized speed for synchronization
      const t = state.clock.elapsedTime * 0.2; // Speed
      const radius = 35; // Orbital radius
      
      meshRef.current.position.x = Math.sin(t) * radius;
      meshRef.current.position.y = Math.cos(t * 0.5) * 15 + 10; // Vertical wave
      meshRef.current.position.z = Math.cos(t) * radius - 20;
      
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={meshRef} position={[25, 10, -30]}>
      <sphereGeometry args={[4, 64, 64]} />
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

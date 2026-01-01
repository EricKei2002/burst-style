"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

// Individual shooting star
const ShootingStar = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [active, setActive] = useState(false);
  const startPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());
  const [delay] = useState(() => Math.random() * 10); // Initial random delay
  const delayRef = useRef(delay);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (!active) {
      delayRef.current -= delta;
      if (delayRef.current <= 0) {
        // Spawn
        setActive(true);
        // Random start position (top hemisphere)
        const x = (Math.random() - 0.5) * 200;
        const y = Math.random() * 50 + 50; 
        const z = (Math.random() - 0.5) * 100; // Background depth
        startPos.current.set(x, y, z);
        meshRef.current.position.copy(startPos.current);

        // Velocity: downward and sideways
        velocity.current.set(
            (Math.random() - 0.5) * 50, // drift x
            -Math.random() * 50 - 50,  // fall fast
            0
        );
        
        // Orient mesh to velocity (simple approach: lookAt target)
        const target = startPos.current.clone().add(velocity.current);
        meshRef.current.lookAt(target);
        
        // Random next delay
        delayRef.current = Math.random() * 10 + 2; 
      }
    } else {
      // Move
      meshRef.current.position.addScaledVector(velocity.current, delta);
      
      // Check if out of bounds (too low)
      if (meshRef.current.position.y < -100) {
          setActive(false);
          meshRef.current.position.set(0, -1000, 0); // Hide
      }
    }
  });

  return (
    <mesh ref={meshRef} visible={active}>
      {/* Long thin box for streak */}
      <boxGeometry args={[0.5, 0.5, 30]} /> 
      <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
    </mesh>
  );
};

export default function ShootingStars() {
  // Create a few instances
  return (
    <group>
      {Array.from({ length: 5 }).map((_, i) => (
        <ShootingStar key={i} />
      ))}
    </group>
  );
}

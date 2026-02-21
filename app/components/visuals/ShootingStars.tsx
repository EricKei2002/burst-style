"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

// useRefのみ使用し、setStateを完全排除してReactの再レンダリングを防ぐ
const ShootingStar = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const activeRef = useRef(false);
  const startPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());
  const delayRef = useRef(Math.random() * 10);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (!activeRef.current) {
      delayRef.current -= delta;
      if (delayRef.current <= 0) {
        activeRef.current = true;
        meshRef.current.visible = true;

        const x = (Math.random() - 0.5) * 200;
        const y = Math.random() * 50 + 50;
        const z = (Math.random() - 0.5) * 100;
        startPos.current.set(x, y, z);
        meshRef.current.position.copy(startPos.current);

        velocity.current.set(
          (Math.random() - 0.5) * 50,
          -Math.random() * 50 - 50,
          0
        );

        const target = startPos.current.clone().add(velocity.current);
        meshRef.current.lookAt(target);

        delayRef.current = Math.random() * 10 + 2;
      }
    } else {
      meshRef.current.position.addScaledVector(velocity.current, delta);

      if (meshRef.current.position.y < -100) {
        activeRef.current = false;
        meshRef.current.visible = false;
        meshRef.current.position.set(0, -1000, 0);
      }
    }
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <boxGeometry args={[0.5, 0.5, 30]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
    </mesh>
  );
};

export default function ShootingStars() {
  return (
    <group>
      {Array.from({ length: 5 }).map((_, i) => (
        <ShootingStar key={i} />
      ))}
    </group>
  );
}

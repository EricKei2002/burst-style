"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { getShootingStarDelayFactor } from "../../lib/localSky";

const reducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 初期遅延をコンポーネント外で生成（lintルール準拠）
let nextDelay = 0;
function getInitialDelay() {
  return ++nextDelay * 2; // 各インスタンスが時間差でスポーン
}

// useRefのみ使用し、setStateを完全排除してReactの再レンダリングを防ぐ
const ShootingStar = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const activeRef = useRef(false);
  const startPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());
  const delayRef = useRef(getInitialDelay());

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (!activeRef.current) {
      // 動きを減らす設定のときは流れ星を出さない
      if (reducedMotion) return;
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
          0,
        );

        const target = startPos.current.clone().add(velocity.current);
        meshRef.current.lookAt(target);

        // 現地の時間帯と天気で出現頻度を少しだけ変える（夜は多め、昼や雨は少なめ）
        delayRef.current =
          (Math.random() * 10 + 2) * getShootingStarDelayFactor();
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

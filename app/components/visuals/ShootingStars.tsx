"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

// 個々の流れ星
const ShootingStar = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [active, setActive] = useState(false);
  const startPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());
  const [delay] = useState(() => Math.random() * 10); // 初期のランダムな遅延
  const delayRef = useRef(delay);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (!active) {
      delayRef.current -= delta;
      if (delayRef.current <= 0) {
        // スポーン
        setActive(true);
        // ランダムな開始位置 (上半球)
        const x = (Math.random() - 0.5) * 200;
        const y = Math.random() * 50 + 50; 
        const z = (Math.random() - 0.5) * 100; // 背景の深度
        startPos.current.set(x, y, z);
        meshRef.current.position.copy(startPos.current);

        // 速度: 下方向と横方向
        velocity.current.set(
            (Math.random() - 0.5) * 50, // 横漂流
            -Math.random() * 50 - 50,  // 高速落下
            0
        );
        
        // メッシュを速度に向ける (単純なアプローチ: lookAt target)
        const target = startPos.current.clone().add(velocity.current);
        meshRef.current.lookAt(target);
        
        // 次のランダムな遅延
        delayRef.current = Math.random() * 10 + 2; 
      }
    } else {
      // 移動
      meshRef.current.position.addScaledVector(velocity.current, delta);
      
      // 範囲外チェック (低すぎる場合)
      if (meshRef.current.position.y < -100) {
          setActive(false);
          meshRef.current.position.set(0, -1000, 0); // 非表示
      }
    }
  });

  return (
    <mesh ref={meshRef} visible={active}>
      {/* 筋のための長くて細いボックス */}
      <boxGeometry args={[0.5, 0.5, 30]} /> 
      <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
    </mesh>
  );
};

export default function ShootingStars() {
  // いくつかのインスタンスを作成
  return (
    <group>
      {Array.from({ length: 5 }).map((_, i) => (
        <ShootingStar key={i} />
      ))}
    </group>
  );
}

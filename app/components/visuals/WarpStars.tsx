"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface WarpStarsProps {
  isWarping: boolean;
  count?: number;
}

export default function WarpStars({ isWarping, count = 2000 }: WarpStarsProps) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  // 星の初期位置をランダムに作成
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  
  // レンダリング中の再生成（不純性警告の原因）を防ぐため、パーティクルをrefに格納
  const particlesRef = useRef<{speed: number, x: number, y: number, z: number}[]>([]);

  useEffect(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const speed = Math.random() * 0.15 + 0.01; // 速度に変化をつける
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;

      temp.push({ speed, x, y, z });
    }
    particlesRef.current = temp;
  }, [count]);

  // アニメーション用の値
  const currentSpeed = useRef(0);
  const targetSpeed = useRef(0);

  useFrame((state, delta) => {
    // ワープ状態に基づいて目標速度を更新
    targetSpeed.current = isWarping ? 8.0 : 0.05;
    
    // 現在の速度を滑らかに補間
    currentSpeed.current = THREE.MathUtils.lerp(
      currentSpeed.current,
      targetSpeed.current,
      delta * 2 // 加速係数
    );
    
    // 各パーティクルを更新
    const particles = particlesRef.current;
    if (particles.length === 0) return;

    particles.forEach((particle, i) => {
      const { speed, x, y } = particle;
      let { z } = particle;

      // パーティクルをカメラに向かって移動（Z軸）
      // 基本移動速度 + ワープブースト
      const moveSpeed = speed + currentSpeed.current;
      
      z += moveSpeed;
      if (z > 100) z = -200; // カメラを通り過ぎたらリセット
      
      particle.z = z;

      // ワープ時にストレッチ効果を追加
      const stretch = isWarping ? Math.max(1, moveSpeed * 5) : 1;
      
      dummy.position.set(x, y, z);
      
      // ストリーク効果のためにZ軸をスケール
      dummy.scale.set(1, 1, stretch);
      
      dummy.updateMatrix();
      
      if (mesh.current) {
         mesh.current.setMatrixAt(i, dummy.matrix);
      }
    });
    
    if (mesh.current) {
        mesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.1, 8, 8]} />{/* 星用の小さな球体 */}
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </instancedMesh>
    </>
  );
}

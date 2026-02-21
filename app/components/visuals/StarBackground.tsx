"use client";

import { useState, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

import * as THREE from "three";
import { usePathname } from "next/navigation";

// Components
import TheSun from "./TheSun";
import Moon from "./Moon";
import Earth from "./Earth";
import ShootingStars from "./ShootingStars";
import SpaceshipInterior from "./SpaceshipInterior";

function WarpStars({ count = 4000 }: { count?: number }) {
  const starsRef = useRef<THREE.Points>(null);
  
  // 星の数は外部から変更可能
  const starsCount = count;
  
  // Z軸に沿ってトンネル/シリンダー状に星を初期化
  const [positions] = useState(() => {
    const pos = new Float32Array(starsCount * 3);
    for(let i = 0; i < starsCount; i++) {
        const i3 = i * 3;
        // 没入感を高めるためにXとYを広げる
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 200; 
        // 前方にスポーン [0, -200]
        const z = (Math.random() - 0.5) * 200;
        
        pos[i3] = x;
        pos[i3 + 1] = y;
        pos[i3 + 2] = z;
    }
    return pos;
  });

  // スムーズなアニメーション値のためのRefs
  const currentSpeed = useRef(0.05);
  const currentStretch = useRef(1);
  
  useFrame((state, delta) => {
    if (!starsRef.current) return;
    
    const positions = starsRef.current.geometry.attributes.position.array as Float32Array;
    
    // 標準的な動き
    const targetSpeed = 0.05; 
    const targetStretch = 1; 
    
    // スムーズな補間 (Lerp)
    // 加速速度のための調整係数 (例: 3 * delta)
    currentSpeed.current += (targetSpeed - currentSpeed.current) * Math.min(delta * 2, 1);
    currentStretch.current += (targetStretch - currentStretch.current) * Math.min(delta * 2, 1);

    const speed = currentSpeed.current;
    
    for(let i = 0; i < starsCount; i++) {
         const i3 = i * 3;
         positions[i3 + 2] += speed;
         
         // カメラを通過したら星をリセット (z > 20)
         if (positions[i3 + 2] > 50) {
           positions[i3 + 2] = -150; // 遠く後方にリセット
           
           // 明確なパターンが形成されるのを防ぐためにX/Yをシャッフル
           positions[i3] = (Math.random() - 0.5) * 200;
           positions[i3 + 1] = (Math.random() - 0.5) * 200;
         }
    }
    starsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // ストレッチ効果を適用
    starsRef.current.scale.z = currentStretch.current;
    
    // オプション: ワープに基づいて不透明度をフェードさせる？
    // 白い筋が見栄え良ければ不要。
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starsCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]} 
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#ffffff"
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
      />
    </points>
  );
}



export default function StarBackground() {
  const pathname = usePathname();
  const isProjectPage = pathname.startsWith('/projects/');

  // モバイル時は星の数を減らしてパフォーマンスを確保（useStateで初期レンダリング時に判定）
  const [starCount] = useState(() => {
    if (typeof window === 'undefined') return 4000;
    if (window.innerWidth < 768) return 800;
    if (window.innerWidth < 1024) return 2000;
    return 4000;
  });

  if (isProjectPage) {
    return <SpaceshipInterior />;
  }

  return (
    <div className="fixed inset-0 -z-50 h-full w-full bg-[#050505]" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        gl={{ alpha: false, antialias: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.1} />
        <Suspense fallback={null}>
          <TheSun />
          <Moon />
          <Earth />
        </Suspense>

        <WarpStars count={starCount} />
        <ShootingStars />
      </Canvas>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePathname } from "next/navigation";
import { useState, Suspense } from "react";

// Components
import TheSun from "./TheSun";
import Moon from "./Moon";
import Earth from "./Earth";
import ShootingStars from "./ShootingStars";
import SpaceshipInterior from "./SpaceshipInterior";

// コンポーネント外（モジュールスコープ）でデータ生成 — lintルール準拠
function createStarData(count: number) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    // 元コードの速度: (random*0.15 + 0.01 + base0.05) * 60fps = units/sec
    speeds[i] = (Math.random() * 0.15 + 0.06) * 60;
  }
  return { positions, speeds };
}

// JSループを廃止し、GLSLシェーダーでGPU側でパーティクル位置を計算
// これにより4000パーティクル分のメインスレッド負荷をほぼゼロにする
function WarpStars({ count = 4000 }: { count?: number }) {
  // geometry と material を useRef で管理してuseFrame内書き換えのlintを回避
  const geoRef = useRef<THREE.BufferGeometry | null>(null);
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const pointsRef = useRef<THREE.Points>(null);

  if (!geoRef.current) {
    const { positions, speeds } = createStarData(count);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSpeed",   new THREE.BufferAttribute(speeds, 1));
    geoRef.current = geo;
  }

  if (!matRef.current) {
    matRef.current = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      // GPU側で全パーティクルのZ位置を計算（JSループ不要）
      vertexShader: `
        attribute float aSpeed;
        uniform float uTime;
        void main() {
          vec3 pos = position;
          // Z軸方向に移動してループ（-150 〜 50 の範囲、200単位）
          pos.z = mod(position.z + 150.0 + aSpeed * uTime, 200.0) - 150.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = 1.5;
        }
      `,
      fragmentShader: `
        void main() {
          gl_FragColor = vec4(1.0, 1.0, 1.0, 0.8);
        }
      `,
      transparent: true,
    });
  }

  // 毎フレームuTime（累積秒数）をインクリメントするだけ — O(1)
  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <points
      ref={pointsRef}
      geometry={geoRef.current}
      material={matRef.current}
    />
  );
}


export default function StarBackground() {
  const pathname = usePathname();
  const isProjectPage = pathname.startsWith("/projects/");

  // モバイルは非表示: Heroセクションに独自のCanvasがあるため二重稼働を防ぐ
  const [isMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  // パーティクル数をデバイスに応じて調整
  const [starCount] = useState(() => {
    if (typeof window === "undefined") return 4000;
    if (window.innerWidth < 1024) return 2000;
    return 4000;
  });

  if (isProjectPage) {
    return <SpaceshipInterior />;
  }

  // モバイルは背景Canvasを描画しない（パフォーマンス向上）
  if (isMobile) {
    return <div className="fixed inset-0 -z-50 h-full w-full bg-[#050505]" aria-hidden="true" />;
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

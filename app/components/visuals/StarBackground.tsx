"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePathname } from "next/navigation";

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
  const geometry = useMemo(() => {
    const { positions, speeds } = createStarData(count);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    return geo;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
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
    }),
    []
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // 毎フレームuTime（累積秒数）をインクリメントするだけ — O(1)
  useFrame((_, delta) => {
    // eslint-disable-next-line react-hooks/immutability
    material.uniforms.uTime.value += delta;
  });

  return <points geometry={geometry} material={material} />;
}


export default function StarBackground() {
  const pathname = usePathname();
  const isProjectPage = pathname.startsWith("/projects/");
  const observerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // モバイルは非表示: Heroセクションに独自のCanvasがあるため二重稼働を防ぐ
  const [isMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  // パーティクル数をデバイスに応じて調整
  const [starCount] = useState(() => {
    if (typeof window === "undefined") return 1200;

    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const cpuCores = navigator.hardwareConcurrency ?? 8;

    if (deviceMemory <= 2 || cpuCores <= 2) return 0;
    if (window.innerWidth < 1280 || deviceMemory <= 4 || cpuCores <= 4) return 1200;
    return 2000;
  });
  const [showCelestialBodies] = useState(() => {
    if (typeof window === "undefined") return false;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const cpuCores = navigator.hardwareConcurrency ?? 8;
    return window.innerWidth >= 1280 && deviceMemory > 4 && cpuCores > 4;
  });

  useEffect(() => {
    const target = observerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.01 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || isMobile || starCount === 0) return;

    const activate = () => setIsReady(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(activate, { timeout: 900 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(activate, 500);
    return () => clearTimeout(timer);
  }, [isMobile, isVisible, starCount]);

  useEffect(() => {
    if (!isReady) return;
    window.dispatchEvent(new CustomEvent("burst:stars-ready"));
  }, [isReady]);

  if (isProjectPage) {
    return <SpaceshipInterior />;
  }

  // モバイルは背景Canvasを描画しない（パフォーマンス向上）
  if (isMobile || starCount === 0) {
    return <div className="fixed inset-0 -z-50 h-full w-full bg-[#050505]" aria-hidden="true" />;
  }

  return (
    <div ref={observerRef} className="fixed inset-0 -z-50 h-full w-full bg-[#050505]" aria-hidden="true">
      {isReady && (
        <Canvas
          camera={{ position: [0, 0, 1] }}
          gl={{ alpha: false, antialias: false, powerPreference: "high-performance" }}
          dpr={[1, 1.4]}
        >
          <ambientLight intensity={0.1} />
          {showCelestialBodies && (
            <Suspense fallback={null}>
              <TheSun />
              <Moon />
              <Earth />
            </Suspense>
          )}

          <WarpStars count={starCount} />
          <ShootingStars />
        </Canvas>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// Components
const TheSun = dynamic(() => import("./TheSun"), { ssr: false });
const Moon = dynamic(() => import("./Moon"), { ssr: false });
const Earth = dynamic(() => import("./Earth"), { ssr: false });
const ShootingStars = dynamic(() => import("./ShootingStars"), { ssr: false });
const SpaceshipInterior = dynamic(() => import("./SpaceshipInterior"), { ssr: false });

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
  const [showCelestialsNow, setShowCelestialsNow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // モバイルでも条件付きで描画する（低負荷設定）
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
    if (window.innerWidth < 768) {
      // ユーザーの要望により、モバイルでも星の数を大幅に増やす（パフォーマンスとのバランスを取って700程度に）
      if (deviceMemory <= 4 || cpuCores <= 6) return 300;
      return 700;
    }
    if (window.innerWidth < 1280 || deviceMemory <= 4 || cpuCores <= 4) return 650;
    return 1000;
  });
  const [showCelestialBodies] = useState(() => {
    if (typeof window === "undefined") return false;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const cpuCores = navigator.hardwareConcurrency ?? 8;
    // モバイルでも天体（惑星や月など）を描画するように条件を緩和（極端な低スペックのみ除外）
    return deviceMemory > 2 && cpuCores > 2;
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
    if (!isVisible || starCount === 0) return;

    const activate = () => setIsReady(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(activate, { timeout: 900 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(activate, 500);
    return () => clearTimeout(timer);
  }, [isVisible, starCount]);

  useEffect(() => {
    if (!isReady) return;
    window.dispatchEvent(new CustomEvent("burst:stars-ready"));
  }, [isReady]);

  useEffect(() => {
    if (!isReady || !showCelestialBodies) return;

    const activate = () => setShowCelestialsNow(true);
    const isMobile = window.innerWidth < 768;
    // モバイルはLCP保護のために遅延させるが、デスクトップはすぐ表示して「再読み込み」に見えるカクつきを防ぐ
    const delay = isMobile ? 2500 : 100;
    const timeout = isMobile ? 3500 : 200;

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(activate, { timeout });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(activate, delay);
    return () => clearTimeout(timer);
  }, [isReady, showCelestialBodies]);

  if (isProjectPage) {
    return <SpaceshipInterior />;
  }

  if (starCount === 0) {
    return <div className="fixed inset-0 -z-50 h-full w-full bg-[#050505]" aria-hidden="true" />;
  }

  return (
    <div ref={observerRef} className="fixed inset-0 -z-50 h-full w-full bg-[#050505]" aria-hidden="true">
      {isReady && (
        <Canvas
          camera={{ position: [0, 0, 1] }}
          gl={{ alpha: false, antialias: false, powerPreference: "high-performance" }}
          dpr={isMobile ? [0.75, 1] : [1, 1.1]}
        >
          <ambientLight intensity={0.1} />
          {showCelestialBodies && showCelestialsNow && <TheSun />}
          {showCelestialBodies && showCelestialsNow && <Moon />}
          {showCelestialBodies && showCelestialsNow && <Earth />}

          <WarpStars count={starCount} />
          {showCelestialsNow && <ShootingStars />}
        </Canvas>
      )}
    </div>
  );
}

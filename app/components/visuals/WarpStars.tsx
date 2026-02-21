"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface WarpStarsProps {
  isWarping: boolean;
  count?: number;
}

// セクション背景（StarBackground）と同じ星データ生成に統一
function createStarData(count: number) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    // StarBackgroundと同一スケール（units/sec）
    speeds[i] = (Math.random() * 0.15 + 0.06) * 60;
  }
  return { positions, speeds };
}

// Hero背景の星もセクション背景と同じシェーダーに統一
// isWarping時のみuTimeの進み方を加速してワープ感を維持
export default function WarpStars({ isWarping, count = 2000 }: WarpStarsProps) {
  const speedFactorRef = useRef(1);

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
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float aSpeed;
        uniform float uTime;
        void main() {
          vec3 pos = position;
          // StarBackgroundと同一の移動式
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

  // ワープ時だけ時間進行を加速
  useFrame((_, delta) => {
    const targetFactor = isWarping ? 24 : 1;
    speedFactorRef.current = THREE.MathUtils.lerp(
      speedFactorRef.current,
      targetFactor,
      delta * 2
    );

    // eslint-disable-next-line react-hooks/immutability
    material.uniforms.uTime.value += delta * speedFactorRef.current;
  });

  return <points geometry={geometry} material={material} />;
}

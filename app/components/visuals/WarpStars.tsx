"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface WarpStarsProps {
  isWarping: boolean;
  count?: number;
}

// コンポーネント外（モジュールスコープ）でデータ生成 — lintルール準拠
function createStarData(count: number) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    // 元コードの個別速度そのまま（0.01〜0.16）
    speeds[i] = Math.random() * 0.15 + 0.01;
  }
  return { positions, speeds };
}

// Hero背景の星もGLSLシェーダーに移行してJSループを廃止
// ワープ時の速度変化は uOffset/uFrames の2つのuniformで表現
export default function WarpStars({ isWarping, count = 2000 }: WarpStarsProps) {
  // 速度補間用のRef（これだけJSで管理）
  const currentSpeed = useRef(0.05);
  const targetSpeed = useRef(0.05);

  // geometry と material を useRef で管理してuseFrame内書き換えのlintを回避
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
        uOffset:  { value: 0 },   // 累積ベース移動距離（currentSpeedの積分）
        uFrames:  { value: 0 },   // 累積フレーム数（per-particle speedの積分）
        uStretch: { value: 1 },   // ワープ時のポイントサイズ拡大
      },
      vertexShader: `
        attribute float aSpeed;
        uniform float uOffset;
        uniform float uFrames;
        uniform float uStretch;
        void main() {
          vec3 pos = position;
          // ベース移動 + 個別速度 × フレーム数 = 合計移動距離
          float totalZ = position.z + 100.0 + uOffset + aSpeed * uFrames;
          // 範囲 [-200, 100] (300単位) でループ
          pos.z = mod(totalZ, 300.0) - 200.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          // ワープ時にポイントサイズを大きくしてストリーク感を演出
          gl_PointSize = max(1.0, uStretch);
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

  // 毎フレーム更新するのは3つのuniformと速度補間のみ（O(1)）
  useFrame((_, delta) => {
    targetSpeed.current = isWarping ? 8.0 : 0.05;
    currentSpeed.current = THREE.MathUtils.lerp(
      currentSpeed.current,
      targetSpeed.current,
      delta * 2
    );

    const mat = material;
    // 累積ベース移動距離（フレーム単位換算）
    // eslint-disable-next-line react-hooks/immutability
    mat.uniforms.uOffset.value  += currentSpeed.current;
    // 累積フレーム数（per-particle speed計算用）
    mat.uniforms.uFrames.value  += 1;
    // ストレッチ量をスムーズに補間
    mat.uniforms.uStretch.value = THREE.MathUtils.lerp(
      mat.uniforms.uStretch.value,
      isWarping ? Math.max(1, currentSpeed.current * 3) : 1,
      delta * 3
    );
  });

  return <points geometry={geometry} material={material} />;
}

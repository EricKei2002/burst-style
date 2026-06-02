"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { useGravityPointer } from "./useGravityPointer";

type GravityPointer = ReturnType<typeof useGravityPointer>;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  uniform vec2 uMouse;
  uniform float uGravity;
  uniform float uTime;
  varying vec2 vUv;

  vec2 lensWarp(vec2 uv) {
    vec2 p = uv * 2.0 - 1.0;
    vec2 d = uMouse - p;
    float r = length(d);
    vec2 dir = d / max(r, 0.0008);
    vec2 tan = vec2(-dir.y, dir.x);

    float falloff = exp(-r * r * 0.85);
    float lens = uGravity * falloff / (r + 0.18);

    p += dir * lens * 0.16;
    p += tan * lens * r * 0.42;
    p += tan * lens * sin(uTime * 1.1 + r * 9.0) * 0.025;

    return p * 0.5 + 0.5;
  }

  float grid(vec2 uv, float scale) {
    vec2 gv = uv * scale;
    vec2 g = abs(fract(gv - 0.5) - 0.5);
    vec2 fw = fwidth(gv);
    vec2 line = 1.0 - smoothstep(fw * 1.4, fw * 0.15, g);
    return max(line.x, line.y);
  }

  void main() {
    vec2 warped = lensWarp(vUv);
    vec2 ndc = vUv * 2.0 - 1.0;

    float fine = grid(warped, 32.0);
    float coarse = grid(warped, 8.0) * 0.4;

    vec3 col = vec3(0.018, 0.018, 0.028);
    col += vec3(0.12, 0.1, 0.2) * fine * 0.42;
    col += vec3(0.06, 0.08, 0.14) * coarse * 0.3;

    float vig = 1.0 - dot(ndc, ndc) * 0.35;
    gl_FragColor = vec4(col * vig, 1.0);
  }
`;

export default function SpaceWarpField({
  pointer,
}: {
  pointer: GravityPointer;
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uMouse: { value: new THREE.Vector2(0, 0) },
          uGravity: { value: 0 },
          uTime: { value: 0 },
        },
        vertexShader,
        fragmentShader,
        depthWrite: false,
        depthTest: false,
      }),
    [],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    material.uniforms.uMouse.value.copy(pointer.smoothPointer.current);
    material.uniforms.uGravity.value = pointer.gravity.current;
    material.uniforms.uTime.value = pointer.time.current;
  });

  return (
    <mesh frustumCulled={false} renderOrder={-20}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

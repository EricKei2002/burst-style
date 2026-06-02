"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { useGravityPointer } from "./useGravityPointer";

type GravityPointer = ReturnType<typeof useGravityPointer>;

function createStarData(count: number) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    speeds[i] = (Math.random() * 0.15 + 0.06) * 60;
  }
  return { positions, speeds };
}

export default function WarpStars({
  count = 4000,
  pointer,
}: {
  count?: number;
  pointer: GravityPointer;
}) {
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
          uMouse: { value: new THREE.Vector2(0, 0) },
          uGravity: { value: 0 },
        },
        vertexShader: `
        attribute float aSpeed;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uGravity;

        varying float vLens;
        varying float vDist;

        void main() {
          vec3 pos = position;
          pos.z = mod(position.z + 150.0 + aSpeed * uTime, 200.0) - 150.0;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vec4 clip = projectionMatrix * mvPosition;
          vec2 ndc = clip.xy / max(clip.w, 0.001);

          vec2 delta = uMouse - ndc;
          float dist = length(delta);
          vec2 dir = delta / max(dist, 0.0008);
          vec2 tangent = vec2(-dir.y, dir.x);

          float falloff = exp(-dist * dist * 1.0);
          float lens = uGravity * falloff / (dist + 0.14);

          mvPosition.xy += dir * lens * 7.5;
          mvPosition.xy += tangent * lens * dist * 3.5;
          mvPosition.xy += tangent * lens * sin(dist * 11.0 - uTime * 2.0) * 1.8;
          mvPosition.z -= lens * 11.0 * (1.0 + dist * 0.35);

          vLens = lens;
          vDist = dist;

          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = 1.0 + lens * 5.0 + dist * lens * 1.2;
        }
      `,
        fragmentShader: `
        varying float vLens;
        varying float vDist;

        void main() {
          vec2 c = gl_PointCoord - vec2(0.5);
          float d = length(c);
          if (d > 0.5) discard;

          vec3 cool = vec3(0.68, 0.86, 1.0);
          vec3 warm = vec3(1.0, 0.92, 0.82);
          vec3 color = mix(vec3(1.0), mix(cool, warm, clamp(vDist * 0.5, 0.0, 1.0)), clamp(vLens * 1.4, 0.0, 1.0));

          float stretch = 1.0 + vLens * 0.35;
          float along = abs(c.x) * stretch + abs(c.y) / stretch;
          if (along > 0.48) discard;

          float alpha = (1.0 - smoothstep(0.3, 0.48, along)) * 0.88;
          gl_FragColor = vec4(color, alpha);
        }
      `,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(() => {
    material.uniforms.uMouse.value.copy(pointer.smoothPointer.current);
    material.uniforms.uGravity.value = pointer.gravity.current;
    material.uniforms.uTime.value = pointer.time.current;
  });

  return <points geometry={geometry} material={material} renderOrder={0} />;
}

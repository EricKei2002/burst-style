import {
  BackSide,
  Color,
  FrontSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  type ShaderMaterial,
} from "three";
import { NOISE_GLSL } from "./proceduralNoise";
import { createGlowShellMaterial } from "./spaceshipFx";

/**
 * 高ポリゴンの惑星 / 衛星。表面の模様と起伏はフラグメントシェーダーで
 * 物体空間の 3D ノイズから作るので、継ぎ目がなく、近づいても破綻しない。
 * MeshStandardMaterial を拡張しているので、太陽光で昼夜境界・陰影が付く。
 */

export type BodyKind = "planet" | "moon";
export type BodyQuality = "high" | "medium" | "low";

export type PlanetBody = {
  group: Group;
  /** 低地（海・平原）と高地の色、大気の色（すべて線形 RGB） */
  setColors(low: Color, high: Color, atmo: Color): void;
  /** 雲の流れ（秒） */
  update(seconds: number): void;
  setAtmosphere(opacity: number): void;
  dispose(): void;
};

type Disposable = { dispose(): void };

const SEGMENTS: Record<BodyQuality, [number, number]> = {
  high: [128, 96],
  medium: [72, 48],
  low: [40, 28],
};

const OCTAVES: Record<BodyQuality, number> = {
  high: 6,
  medium: 5,
  low: 3,
};

const WHITE = new Color(1, 1, 1);

function objPosVertex(vertexShader: string): string {
  return vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;")
    .replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvObjPos = normalize(position);",
    );
}

function surfaceMaterial(
  kind: BodyKind,
  quality: BodyQuality,
  seed: number,
  disposables: Disposable[],
): {
  mat: MeshStandardMaterial;
  low: { value: Color };
  high: { value: Color };
} {
  const mat = new MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.02,
  });
  disposables.push(mat);
  const low = { value: new Color(0.05, 0.08, 0.14) };
  const high = { value: new Color(0.4, 0.3, 0.2) };
  const uSeed = { value: seed };
  mat.defines = { FBM_OCTAVES: OCTAVES[quality] };
  const surface =
    kind === "moon"
      ? /* glsl */ `
        vec3 sp = vObjPos * 2.6 + uSeed;
        float base = pnFbm(sp * 1.4);
        float c1 = pnCell(sp * 1.6);
        float c2 = pnCell(sp * 4.1 + 7.0);
        // 皿状の底と盛り上がった縁
        float crater = smoothstep(0.0, 0.32, c1)
          + 0.35 * smoothstep(0.26, 0.34, c1) * (1.0 - smoothstep(0.34, 0.5, c1));
        float crater2 = smoothstep(0.0, 0.3, c2)
          + 0.3 * smoothstep(0.24, 0.31, c2) * (1.0 - smoothstep(0.31, 0.44, c2));
        pnH = base * 0.6 + crater * 0.3 + crater2 * 0.14;
        float maria = smoothstep(0.42, 0.62, pnFbm(sp * 0.7 + 3.0));
        pnLand = 1.0 - maria * 0.7;
        diffuseColor.rgb *= mix(uLow, uHigh, clamp(pnLand * (0.55 + base * 0.7), 0.0, 1.0));
        pnLand = 1.0;
      `
      : /* glsl */ `
        vec3 sp = vObjPos * 1.9 + uSeed;
        // 大陸の形をドメインワープでうねらせる
        vec3 warp = vec3(pnFbm(sp + 1.3), pnFbm(sp + 5.7), pnFbm(sp + 9.1));
        float cont = pnFbm(sp + warp * 1.6);
        pnLand = smoothstep(0.47, 0.53, cont);
        float mount = pnRidged(sp * 3.2 + warp);
        pnH = cont + pnLand * mount * 0.35;
        float lat = abs(vObjPos.y);
        float ice = smoothstep(0.78, 0.9, lat + (cont - 0.5) * 0.25);
        vec3 shallow = mix(uLow, uHigh, 0.18);
        vec3 sea = mix(uLow * 0.7, shallow, smoothstep(0.38, 0.5, cont));
        vec3 land = mix(uHigh * 0.55, uHigh, mount) * (0.8 + 0.4 * pnFbm(sp * 9.0));
        vec3 surf = mix(sea, land, pnLand);
        surf = mix(surf, vec3(0.85, 0.9, 0.95), ice);
        diffuseColor.rgb *= surf;
        pnLand = max(pnLand, ice);
      `;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uLow = low;
    shader.uniforms.uHigh = high;
    shader.uniforms.uSeed = uSeed;
    shader.vertexShader = objPosVertex(shader.vertexShader);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform vec3 uLow;
        uniform vec3 uHigh;
        uniform float uSeed;
        varying vec3 vObjPos;
        ${NOISE_GLSL}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float pnH = 0.0;
        float pnLand = 1.0;
        ${surface}`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        // 海は滑らかに光を返し、陸はざらつく
        roughnessFactor = mix(${kind === "moon" ? "0.92" : "0.32"}, 0.95, pnLand);`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        normal = pnPerturb(-vViewPosition, normal, pnH * ${kind === "moon" ? "0.055" : "0.03"} * pnLand, faceDirection);`,
      );
  };
  mat.customProgramCacheKey = () => `pbody-${kind}-${quality}`;
  return { mat, low, high };
}

/** 雲の殻：ノイズで抜いた半透明の球。太陽で陰り、下の殻とずれて厚みが出る */
function cloudMaterial(
  quality: BodyQuality,
  seed: number,
  layer: number,
  time: { value: number },
  disposables: Disposable[],
): MeshStandardMaterial {
  const mat = new MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
    transparent: true,
    depthWrite: false,
  });
  disposables.push(mat);
  mat.defines = { FBM_OCTAVES: Math.max(3, OCTAVES[quality] - 1) };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.vertexShader = objPosVertex(shader.vertexShader);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uTime;
        varying vec3 vObjPos;
        ${NOISE_GLSL}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float ang = uTime * ${(0.012 + layer * 0.006).toFixed(4)};
        float cs = cos(ang);
        float sn = sin(ang);
        vec3 cp = vec3(cs * vObjPos.x - sn * vObjPos.z, vObjPos.y, sn * vObjPos.x + cs * vObjPos.z);
        // 緯度方向に引き伸ばした帯状の雲
        vec3 q = cp * vec3(2.4, 4.2, 2.4) + ${(seed + layer * 13.7).toFixed(2)};
        float w = pnFbm(q * 0.8);
        float d = pnFbm(q + w * 2.2);
        float pnCloud = smoothstep(${layer === 0 ? "0.5" : "0.56"}, 0.74, d);
        diffuseColor.a *= pnCloud * ${layer === 0 ? "0.92" : "0.6"};`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        normal = pnPerturb(-vViewPosition, normal, pnCloud * 0.02, faceDirection);`,
      );
  };
  mat.customProgramCacheKey = () => `pbody-cloud-${quality}-${layer}`;
  return mat;
}

export function createPlanetBody(opts: {
  radius: number;
  kind: BodyKind;
  quality: BodyQuality;
  seed?: number;
  /** 雲の殻の数（0..2） */
  cloudLayers?: number;
  /** 大気のリム（前面）と外側の光輪（背面） */
  atmosphere?: boolean;
  /** 霧の影響を受けるか（空に浮かぶ天体は false） */
  fog?: boolean;
}): PlanetBody {
  const disposables: Disposable[] = [];
  const group = new Group();
  const seed = opts.seed ?? 1.7;
  const [ws, hs] = SEGMENTS[opts.quality];
  const geo = new SphereGeometry(opts.radius, ws, hs);
  disposables.push(geo);
  const surface = surfaceMaterial(opts.kind, opts.quality, seed, disposables);
  surface.mat.fog = opts.fog ?? false;
  const body = new Mesh(geo, surface.mat);
  group.add(body);

  const time = { value: 0 };
  const cloudLayers = Math.min(
    opts.quality === "low" ? 1 : 2,
    opts.cloudLayers ?? 0,
  );
  const cloudMeshes: Mesh[] = [];
  for (let i = 0; i < cloudLayers; i++) {
    const r = opts.radius * (1.012 + i * 0.014);
    const cg = new SphereGeometry(r, ws, hs);
    disposables.push(cg);
    const cm = cloudMaterial(opts.quality, seed, i, time, disposables);
    cm.fog = opts.fog ?? false;
    const mesh = new Mesh(cg, cm);
    mesh.renderOrder = 1 + i;
    cloudMeshes.push(mesh);
    group.add(mesh);
  }

  let rim: ShaderMaterial | null = null;
  let halo: ShaderMaterial | null = null;
  if (opts.atmosphere !== false) {
    const [aw, ah] = SEGMENTS[opts.quality === "high" ? "medium" : "low"];
    const rimGeo = new SphereGeometry(opts.radius * 1.035, aw, ah);
    const haloGeo = new SphereGeometry(opts.radius * 1.16, aw, ah);
    disposables.push(rimGeo, haloGeo);
    rim = createGlowShellMaterial({
      color: 0x4ecfff,
      mode: 3,
      side: FrontSide,
    });
    halo = createGlowShellMaterial({
      color: 0x4ecfff,
      mode: 2,
      side: BackSide,
    });
    disposables.push(rim, halo);
    rim.uniforms.uOpacity.value = opts.kind === "moon" ? 0.25 : 0.9;
    halo.uniforms.uOpacity.value = opts.kind === "moon" ? 0.15 : 0.55;
    const rimMesh = new Mesh(rimGeo, rim);
    const haloMesh = new Mesh(haloGeo, halo);
    rimMesh.renderOrder = 4;
    haloMesh.renderOrder = 0;
    group.add(rimMesh, haloMesh);
  }

  return {
    group,
    setColors(low, high, atmo) {
      surface.low.value.copy(low);
      surface.high.value.copy(high);
      if (rim) {
        (rim.uniforms.uColor.value as Color).copy(atmo);
        (rim.uniforms.uCore.value as Color).copy(atmo).lerp(WHITE, 0.5);
      }
      if (halo) (halo.uniforms.uColor.value as Color).copy(atmo);
      for (const m of cloudMeshes) {
        (m.material as MeshStandardMaterial).color.copy(WHITE).lerp(atmo, 0.12);
      }
    },
    update(seconds) {
      time.value = seconds;
    },
    setAtmosphere(opacity) {
      if (rim) rim.uniforms.uOpacity.value = opacity;
      if (halo) halo.uniforms.uOpacity.value = opacity * 0.62;
    },
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}

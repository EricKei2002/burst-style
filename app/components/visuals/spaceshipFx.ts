import {
  AdditiveBlending,
  Color,
  DataTexture,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  NormalBlending,
  RGBAFormat,
  ShaderMaterial,
  UnsignedByteType,
  type Side,
} from "three";
import { drain } from "./frameSlicer";
import { fbm, mulberry32, smooth } from "./proceduralNoise";

/**
 * 宇宙船オーバーレイ用の柔らかい素材（雲・排気・プラズマ・大気）。
 * テクスチャは画像を読まず、初期化時に小さな DataTexture を手続き生成する。
 * spaceshipOverlay と同じ動的チャンクにだけ入る。
 */

function finishTexture(tex: DataTexture, mipmaps: boolean): DataTexture {
  tex.generateMipmaps = mipmaps;
  tex.minFilter = mipmaps ? LinearMipmapLinearFilter : LinearFilter;
  tex.magFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 2x2 アトラスの雲パフ。R = 陰影（上が明るい、薄い縁が明るい）、A = 密度。
 * 各セルの縁は必ず 0 に落ちるので板の輪郭が出ない。
 */
export function createCloudAtlas(size: number): DataTexture {
  return drain(cloudAtlasSteps(size));
}

/** createCloudAtlas の分割版（行ごとに yield する。FrameSlicer.run に渡す） */
export function* cloudAtlasSteps(
  size: number,
): Generator<void, DataTexture, unknown> {
  const data = new Uint8Array(size * size * 4);
  const cell = size / 2;
  const octaves = size >= 256 ? 5 : 4;
  for (let v = 0; v < 4; v++) {
    const rnd = mulberry32(1013 + v * 7919);
    const blobs: { x: number; y: number; r: number; w: number }[] = [];
    const n = 9 + Math.floor(rnd() * 5);
    for (let i = 0; i < n; i++) {
      // 積雲らしく、上側に盛り上がり下側は平らに
      const bx = (rnd() - 0.5) * 0.52;
      const by = -0.02 + rnd() * 0.16 + (rnd() - 0.5) * 0.06;
      const br = 0.1 + rnd() * 0.12 + (1 - Math.abs(bx) * 2) * 0.05;
      blobs.push({ x: bx, y: by, r: br, w: 0.7 + rnd() * 0.5 });
    }
    const ox = (v % 2) * cell;
    const oy = Math.floor(v / 2) * cell;
    for (let py = 0; py < cell; py++) {
      yield;
      // DataTexture の行 0 は uv.y = 0（下）。ny は上が正
      const ny = (py + 0.5) / cell - 0.5;
      for (let px = 0; px < cell; px++) {
        const nx = (px + 0.5) / cell - 0.5;
        let dens = 0;
        let top = 0;
        for (const b of blobs) {
          const dx = nx - b.x;
          const dy = (ny - b.y) * 1.15;
          const g = Math.exp(-(dx * dx + dy * dy) / (b.r * b.r)) * b.w;
          dens += g;
          // パフの上側ほど日が当たる
          top += g * smooth(-b.r, b.r, ny - b.y);
        }
        const warp = fbm(nx * 5 + v * 3.1, ny * 5 - v * 1.7, v + 3, octaves);
        const detail = fbm(nx * 14 + 9, ny * 14 + v, v + 11, 3);
        let a = dens * (0.55 + 0.75 * warp) - 0.22 + (detail - 0.5) * 0.18;
        a = smooth(0.0, 0.85, a);
        // 底を平らに切り、セルの縁で確実に 0
        a *= smooth(-0.26, -0.12, ny + (warp - 0.5) * 0.08);
        const edge = Math.max(Math.abs(nx), Math.abs(ny));
        a *= 1 - smooth(0.38, 0.49, edge);
        const lit = dens > 0.0001 ? top / dens : 0;
        const shade =
          0.35 +
          0.45 * lit +
          0.2 * (1 - smooth(0.1, 0.7, a)) +
          (detail - 0.5) * 0.12;
        const i = ((oy + py) * size + (ox + px)) * 4;
        const s = Math.round(Math.min(1, Math.max(0, shade)) * 255);
        data[i] = s;
        data[i + 1] = s;
        data[i + 2] = s;
        data[i + 3] = Math.round(Math.min(1, Math.max(0, a)) * 255);
      }
    }
  }
  const tex = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  return finishTexture(tex, true);
}

/** 星などに使う丸いソフトドット（白 + アルファ） */
export function createSoftDot(size = 32): DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5;
      const dy = (y + 0.5) / size - 0.5;
      const d = Math.sqrt(dx * dx + dy * dy) * 2;
      const core = Math.exp(-d * d * 9);
      const halo = Math.max(0, 1 - d) * 0.35;
      const a = Math.min(1, core + halo * halo);
      const i = (y * size + x) * 4;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.round(a * 255);
    }
  }
  return finishTexture(
    new DataTexture(data, size, size, RGBAFormat, UnsignedByteType),
    false,
  );
}

/** インスタンス雲：アトラスの 1 セルを貼った柔らかいビルボード。カメラ近く / 遠くで溶ける */
export function createCloudMaterial(atlas: DataTexture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uMap: { value: atlas },
      uLit: { value: new Color(1, 1, 1) },
      uShade: { value: new Color(0.4, 0.45, 0.6) },
      uGlow: { value: new Color(0, 0, 0) },
      uOpacity: { value: 0.3 },
    },
    vertexShader: /* glsl */ `
      attribute float aAlpha;
      attribute float aVariant;
      varying vec2 vUv;
      varying float vAlpha;
      void main() {
        float v = aVariant;
        vec2 cell = vec2(mod(v, 2.0), floor(v / 2.0)) * 0.5;
        vUv = cell + uv * 0.5;
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        float d = -mv.z;
        float nearFade = smoothstep(0.35, 3.2, d);
        float farFade = 1.0 - smoothstep(34.0, 72.0, d);
        vAlpha = aAlpha * nearFade * farFade;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uLit;
      uniform vec3 uShade;
      uniform vec3 uGlow;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vAlpha;
      void main() {
        vec4 t = texture2D(uMap, vUv);
        float a = t.a * vAlpha * uOpacity;
        if (a < 0.002) discard;
        vec3 col = mix(uShade, uLit, t.r);
        // 陰側ほどプラズマや地平の照り返しを受ける
        col += uGlow * (1.0 - t.r);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
  });
}

/**
 * 丸いソフトパーティクル（加算）。サイズはワールド単位で距離減衰。
 * aLife は 0（生まれたて）→ 1（消える）。古いほど広がって薄くなる。
 */
export function createSoftPointsMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uViewportH: { value: 800 },
      uOpacity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aLife;
      attribute vec3 aColor;
      uniform float uViewportH;
      varying vec3 vColor;
      varying float vFade;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float life = clamp(aLife, 0.0, 1.0);
        float grow = 0.55 + life * 2.4;
        gl_PointSize = aSize * grow * projectionMatrix[1][1] * uViewportH * 0.5 / max(0.05, -mv.z);
        vColor = aColor;
        vFade = pow(1.0 - life, 1.7);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vFade;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float d = length(p) * 2.0;
        if (d > 1.0 || vFade < 0.002) discard;
        float core = exp(-d * d * 5.0);
        float a = core * (1.0 - d) * vFade * uOpacity;
        // 中心は白っぽく
        vec3 col = mix(vColor, vec3(1.0), core * core * 0.35 * vFade);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

/**
 * フレネルで輪郭が溶ける発光シェル。
 * mode 0: 炎（ノズル側が濃く、中心が明るく縁が消える）
 * mode 1: プラズマ鞘（縁が光り、先端が最も熱い。後方へ流れる筋）
 * mode 2: 大気（背面シェル。外縁で 0、惑星の縁に向かって濃く）
 * mode 3: 大気（前面シェル。正面は透明で、縁に向かって濃くなるリム）
 */
export function createGlowShellMaterial(opts: {
  color: number;
  mode: 0 | 1 | 2 | 3;
  side?: Side;
}): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(opts.color) },
      uCore: { value: new Color(1, 1, 1) },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    },
    defines: { GLOW_MODE: opts.mode },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      varying vec2 vUv;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        vUv = uv;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uCore;
      uniform float uOpacity;
      uniform float uTime;
      varying vec3 vN;
      varying vec3 vV;
      varying vec2 vUv;
      void main() {
        float facing = abs(dot(normalize(vN), normalize(vV)));
        float a;
        vec3 col;
        #if GLOW_MODE == 0
          float along = pow(1.0 - vUv.y, 1.35);
          float flick = 0.86 + 0.14 * sin(uTime * 38.0 + vUv.y * 22.0);
          a = pow(facing, 2.2) * along * flick;
          col = mix(uColor, uCore, pow(facing, 6.0) * along);
        #elif GLOW_MODE == 1
          float rim = pow(1.0 - facing, 1.6);
          float tip = smoothstep(0.0, 1.0, vUv.y);
          float streak = 0.6 + 0.4 * sin(vUv.x * 62.0 + vUv.y * 9.0 - uTime * 18.0)
                       * sin(vUv.x * 23.0 - uTime * 7.0);
          a = (rim * 0.75 + facing * 0.25) * (0.25 + 0.75 * tip) * streak
              * smoothstep(0.0, 0.3, vUv.y);
          col = mix(uColor, uCore, tip * tip * facing);
        #elif GLOW_MODE == 2
          a = pow(facing, 1.5);
          col = uColor;
        #else
          a = pow(1.0 - facing, 2.6) * 0.9;
          col = mix(uColor, uCore, pow(1.0 - facing, 6.0) * 0.5);
        #endif
        a *= uOpacity;
        if (a < 0.002) discard;
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: opts.side ?? DoubleSide,
  });
}

import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DataTexture,
  DirectionalLight,
  DynamicDrawUsage,
  Fog,
  Group,
  HemisphereLight,
  InstancedBufferAttribute,
  InstancedMesh,
  LatheGeometry,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  NormalBlending,
  Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Points,
  RepeatWrapping,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  UnsignedByteType,
  Vector2,
  Vector3,
  WebGLRenderer,
  Quaternion,
  Texture,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { PlanetTerrain, PlanetTheme, Rgb } from "../../lib/planets";
import { createPlanetBody, type PlanetBody } from "./planetBody";
import { NOISE_GLSL, fbm, mulberry32, ridged, smooth } from "./proceduralNoise";
import { FrameSlicer, SliceCancelled, drain } from "./frameSlicer";
import { shipModelSteps } from "./shipModel";
import { cloudAtlasSteps, createSoftDot } from "./spaceshipFx";

/**
 * 惑星ページの背景（three）。PlanetInterior から動的 import される。
 * - 地表：視錐台に沿った台形グリッドを地形ごとのノイズで変位させた高分割メッシュ
 *   （MeshStandard + 太陽の平行光 + 半球光、高品質では地形の自己影）
 * - 大気：空のドーム（散乱グラデーション・太陽・巻雲・オーロラ）と同色の距離霧
 * - 空の天体：高分割の惑星 / 衛星（太陽の向きで欠ける）
 * - 雲：ノイズで削ったパフを 3D に積んだクラスタ（上が明るく、逆光で縁が光る）
 * - 視差：カメラ自体を動かすので、近景ほど大きく動く本物の 3D 視差
 */

export type PlanetSceneQuality = "high" | "medium" | "low";

export type PlanetSceneHandle = {
  setTheme(theme: PlanetTheme): void;
  /**
   * 分割版の setTheme（FrameSlicer で区切って組み立てる）。
   * render=false なら組み立てだけ（初回はシェーダーを compileAsync してから描く）
   */
  setThemeAsync(
    theme: PlanetTheme,
    slicer: FrameSlicer,
    render?: boolean,
  ): Promise<void>;
  /**
   * セクション内スクロールの進み具合（0..1）。テーマごとのカメラパスをたどる。
   * 動きを減らす設定では無視する（構図は固定）。
   */
  setScroll(progress: number): void;
  /**
   * 格納庫の駐機機体を画面のこの位置（NDC, -1..1）に収める。weight 0 で通常の構図。
   * DOM の「駐機窓」の位置から PlanetInterior が渡す。
   */
  setFocus(x: number, y: number, weight: number): void;
  /** 格納庫の展示物（作品の看板）の当たり判定。画面座標（px）→ 作品の slug */
  pickExhibit(clientX: number, clientY: number): string | null;
  /** 看板を置く作品（slug と表示名）。格納庫テーマの組み立て前に渡す */
  setExhibits(list: { slug: string; label: string }[]): void;
  /** -1..1 の視線目標（ポインター / 傾き） */
  setLook(x: number, y: number): void;
  start(): void;
  stop(): void;
  renderOnce(): void;
  resize(): void;
  dispose(): void;
  readonly animate: boolean;
};

type Disposable = { dispose(): void };

type NavHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

type Config = {
  quality: PlanetSceneQuality;
  dprCap: number;
  cols: number;
  rows: number;
  shadowMap: number;
  moons: number;
  clusters: number;
  puffs: number;
  banks: number;
  particles: number;
  detailTex: number;
  env: boolean;
  fpsCap: number;
  animate: boolean;
};

function detectConfig(reduce: boolean): Config {
  const nav = navigator as NavHints;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 768;
  const mobile = coarse || narrow;
  const mem = nav.deviceMemory;
  const cores = navigator.hardwareConcurrency || 8;
  const saveData = nav.connection?.saveData === true;
  const lowEnd =
    saveData || (typeof mem === "number" && mem <= 4) || cores <= 4;
  if (reduce || lowEnd) {
    return {
      quality: "low",
      dprCap: 1,
      cols: 90,
      rows: 70,
      shadowMap: 0,
      moons: 1,
      clusters: 4,
      puffs: 4,
      banks: 3,
      particles: reduce ? 0 : 16,
      detailTex: 0,
      env: false,
      fpsCap: 30,
      animate: !reduce,
    };
  }
  if (mobile) {
    return {
      quality: "medium",
      dprCap: 1.25,
      cols: 140,
      rows: 120,
      shadowMap: 0,
      moons: 1,
      clusters: 6,
      puffs: 6,
      banks: 5,
      particles: 28,
      detailTex: 128,
      // スマホは環境マップ（PMREM の畳み込み）を省いて初期化を軽くする
      env: false,
      fpsCap: 60,
      animate: true,
    };
  }
  return {
    quality: "high",
    dprCap: 1.5,
    cols: 220,
    rows: 200,
    shadowMap: 2048,
    moons: 2,
    clusters: 9,
    puffs: 8,
    banks: 8,
    particles: 64,
    detailTex: 256,
    env: true,
    fpsCap: 60,
    animate: true,
  };
}

/** sRGB の 0–255 を線形 Color に */
function lin(c: Rgb, scale = 1): Color {
  return new Color()
    .setRGB(c[0] / 255, c[1] / 255, c[2] / 255, SRGBColorSpace)
    .multiplyScalar(scale);
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 1000;
}

type SkyLayout = {
  /** 太陽の方位（度、+ が右）と仰角（ラジアン） */
  sunAz: number;
  sunEl: number;
  moons: { az: number; el: number; size: number; kind: "planet" | "moon" }[];
};

function skyLayout(theme: PlanetTheme): SkyLayout {
  if (theme.id === "about") {
    return {
      sunAz: 18,
      sunEl: 0.07,
      moons: [
        { az: -30, el: 0.36, size: 34, kind: "moon" },
        { az: 32, el: 0.3, size: 12, kind: "moon" },
      ],
    };
  }
  if (theme.id === "contact") {
    return {
      sunAz: -22,
      sunEl: 0.12,
      moons: [
        { az: 30, el: 0.34, size: 30, kind: "planet" },
        { az: -34, el: 0.28, size: 11, kind: "moon" },
      ],
    };
  }
  if (theme.id === "uncharted") {
    return {
      sunAz: 6,
      sunEl: 0.16,
      moons: [
        { az: 26, el: 0.3, size: 26, kind: "moon" },
        { az: -30, el: 0.38, size: 9, kind: "moon" },
      ],
    };
  }
  return {
    sunAz: -10,
    sunEl: 0.1,
    moons: [
      { az: 30, el: 0.33, size: 36, kind: "planet" },
      { az: -34, el: 0.3, size: 12, kind: "moon" },
    ],
  };
}

function dirFrom(azDeg: number, el: number, out = new Vector3()): Vector3 {
  const az = (azDeg * Math.PI) / 180;
  return out
    .set(
      Math.sin(az) * Math.cos(el),
      Math.sin(el),
      -Math.cos(az) * Math.cos(el),
    )
    .normalize();
}

// ---------------------------------------------------------------------------
// 地形
// ---------------------------------------------------------------------------

type Crater = { x: number; z: number; r: number };

function makeHeightFn(
  terrain: PlanetTerrain,
  seed: number,
): (x: number, z: number) => number {
  const rnd = mulberry32(seed * 977 + 13);
  const craters: Crater[] = [];
  if (terrain === "crater") {
    for (let i = 0; i < 14; i++) {
      craters.push({
        x: (rnd() - 0.5) * 260,
        z: -30 - rnd() * 240,
        r: 8 + rnd() * 26,
      });
    }
    craters.push({ x: 14, z: -70, r: 28 });
  }
  return (x, z) => {
    const d = -z;
    const far = smooth(30, 220, d);
    // 遠景の山脈：奥ほど高く、層になったシルエットを作る
    const r = ridged(x * 0.011 + seed, z * 0.011, seed + 5, 5);
    let h = Math.pow(r, 1.6) * (6 + far * 46) * smooth(35, 140, d);
    switch (terrain) {
      case "dunes": {
        const warp = fbm(x * 0.02, z * 0.02, seed + 2, 4) * 5;
        // 非対称な砂丘（風上はなだらか、風下は急）と小さな風紋
        const ph = x * 0.16 + z * 0.07 + warp;
        const s = 0.5 + 0.5 * Math.sin(ph + 0.45 * Math.sin(ph));
        const s2 = 0.5 + 0.5 * Math.sin(x * 0.42 - z * 0.2 + warp * 1.7);
        const near = 0.6 + 0.4 * smooth(10, 80, d);
        h +=
          (Math.pow(s, 2.2) * 3.4 + s2 * 0.35) * near +
          fbm(x * 0.05, z * 0.05, seed + 3, 3) * 1.6;
        break;
      }
      case "canyons": {
        const n = fbm(x * 0.016, z * 0.016, seed + 7, 5);
        const t = n * 4.2;
        const terr =
          (Math.floor(t) + smooth(0.68, 0.96, t - Math.floor(t))) / 4.2;
        let mesa = terr * 26 - 6;
        // 手前から奥へ蛇行する谷（カメラはこの底にいる）
        const cx = x + 16 * Math.sin(z * 0.018 + seed);
        mesa = -4 + (mesa + 4) * smooth(9, 30, Math.abs(cx));
        h = h * 0.6 + mesa + fbm(x * 0.08, z * 0.08, seed + 9, 3) * 0.9;
        break;
      }
      case "hangar": {
        const flat = 1 - smooth(55, 95, Math.abs(x));
        const plain = fbm(x * 0.03, z * 0.03, seed + 4, 4) * 2.2;
        const pad = smooth(110, 70, d) * smooth(70, 40, Math.abs(x));
        h += plain * (1 - pad * 0.85) * (flat * 0.6 + 0.4);
        break;
      }
      case "crater": {
        h += fbm(x * 0.03, z * 0.03, seed + 6, 4) * 2.4;
        for (const c of craters) {
          const dist = Math.hypot(x - c.x, z - c.z);
          if (dist > c.r * 1.8) continue;
          const k = (dist - c.r) / (c.r * 0.22);
          h += Math.exp(-k * k) * c.r * 0.16;
          h -= smooth(c.r, 0, dist) * c.r * 0.28;
        }
        break;
      }
      case "facets": {
        h += Math.pow(ridged(x * 0.03, z * 0.03, seed + 8, 4), 2) * 9;
        break;
      }
      default: {
        h += fbm(x * 0.025, z * 0.025, seed + 1, 4) * 1.6;
      }
    }
    return h;
  };
}

/**
 * 視錐台に沿った台形グリッド。手前ほど細かく、奥ほど粗い。
 * 頂点色は高さ・傾き・地層の縞で決め、MeshStandard の光で陰影が付く。
 */
function* buildTerrainSteps(
  theme: PlanetTheme,
  cfg: Config,
  heightAt: (x: number, z: number) => number,
): Generator<void, BufferGeometry, unknown> {
  const cols = cfg.cols;
  const rows = cfg.rows;
  const zNear = 16;
  const depth = 330;
  const count = (cols + 1) * (rows + 1);
  const pos = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  let hMin = Infinity;
  let hMax = -Infinity;
  for (let j = 0; j <= rows; j++) {
    if ((j & 3) === 0) yield;
    const t = j / rows;
    const z = zNear - depth * Math.pow(t, 1.9);
    const d = Math.max(0, -z);
    const half = 16 + d * 1.45;
    for (let i = 0; i <= cols; i++) {
      const u = (i / cols) * 2 - 1;
      const x = Math.sign(u) * Math.pow(Math.abs(u), 1.35) * half;
      const h = heightAt(x, z);
      const v = j * (cols + 1) + i;
      pos[v * 3] = x;
      pos[v * 3 + 1] = h;
      pos[v * 3 + 2] = z;
      uv[v * 2] = x / 7;
      uv[v * 2 + 1] = z / 7;
      if (d < 140) {
        hMin = Math.min(hMin, h);
        hMax = Math.max(hMax, h);
      }
    }
  }
  const index = new Uint32Array(rows * cols * 6);
  let n = 0;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i;
      const b = a + 1;
      const c = a + cols + 1;
      const e = c + 1;
      // 上から見て反時計回り（法線が +Y）
      index[n++] = a;
      index[n++] = b;
      index[n++] = c;
      index[n++] = b;
      index[n++] = e;
      index[n++] = c;
    }
  }
  const geo = new BufferGeometry();
  geo.setIndex(new BufferAttribute(index, 1));
  geo.setAttribute("position", new BufferAttribute(pos, 3));
  geo.setAttribute("uv", new BufferAttribute(uv, 2));
  yield;
  geo.computeVertexNormals();
  yield;

  // 実際の光が当たるので、空用に暗く設計された地面色を持ち上げてアルベドにする
  const low = lin(theme.ground, 2.2);
  const high = lin(theme.groundHi, 1.6);
  const rock = lin(theme.groundHi, 1.3).lerp(lin(theme.accent, 0.4), 0.12);
  const tint = lin(theme.accent, 0.9);
  const nrm = geo.attributes.normal as BufferAttribute;
  const col = new Float32Array(count * 3);
  const c = new Color();
  const span = Math.max(1, hMax - hMin);
  for (let v = 0; v < count; v++) {
    if ((v & 2047) === 0) yield;
    const x = pos[v * 3];
    const h = pos[v * 3 + 1];
    const z = pos[v * 3 + 2];
    const ny = nrm.getY(v);
    const hn = Math.min(1, Math.max(0, (h - hMin) / span));
    c.copy(low).lerp(high, smooth(0.05, 0.85, hn));
    const slope = smooth(0.78, 0.45, ny);
    c.lerp(rock, slope * 0.8);
    if (theme.terrain === "canyons") {
      // 崖の地層の縞
      const band =
        0.5 + 0.5 * Math.sin(h * 1.7 + fbm(x * 0.05, z * 0.05, 3, 2) * 3);
      c.multiplyScalar(0.9 + 0.35 * band * slope);
    } else if (theme.terrain === "dunes") {
      // 稜線の砂は明るく色づく
      c.lerp(tint, smooth(0.9, 1, ny) * smooth(0.4, 0.9, hn) * 0.18);
    } else if (theme.terrain === "crater") {
      c.multiplyScalar(0.85 + 0.3 * fbm(x * 0.2, z * 0.2, 11, 2));
    }
    col[v * 3] = c.r;
    col[v * 3 + 1] = c.g;
    col[v * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new BufferAttribute(col, 3));
  return geo;
}

/** 細かな起伏の法線マップ（タイル）。地表の質感を砂・岩らしくする */
function* detailNormalSteps(
  size: number,
): Generator<void, DataTexture, unknown> {
  const hgt = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    if ((y & 7) === 0) yield;
    for (let x = 0; x < size; x++) {
      // 継ぎ目なく繰り返すよう、トーラス上の座標でサンプリングする
      const ax = (x / size) * Math.PI * 2;
      const ay = (y / size) * Math.PI * 2;
      const cx = Math.cos(ax) * 1.6;
      const sx = Math.sin(ax) * 1.6;
      const cy = Math.cos(ay) * 1.6;
      const sy = Math.sin(ay) * 1.6;
      hgt[y * size + x] =
        fbm(cx + cy + 5, sx + sy * 0.7 + 3, 21, 4) * 0.6 +
        fbm(cx * 2 - sy * 2 + 9, sx * 2 + cy * 2, 33, 3) * 0.4;
    }
  }
  const data = new Uint8Array(size * size * 4);
  const s = size / 24;
  for (let y = 0; y < size; y++) {
    if ((y & 15) === 0) yield;
    for (let x = 0; x < size; x++) {
      const dx =
        (hgt[y * size + ((x + 1) % size)] -
          hgt[y * size + ((x - 1 + size) % size)]) *
        s;
      const dy =
        (hgt[((y + 1) % size) * size + x] -
          hgt[((y - 1 + size) % size) * size + x]) *
        s;
      const len = Math.hypot(dx, dy, 1);
      const o = (y * size + x) * 4;
      data[o] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      data[o + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      data[o + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      data[o + 3] = 255;
    }
  }
  const tex = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// 空
// ---------------------------------------------------------------------------

function createSkyMaterial(quality: PlanetSceneQuality): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTop: { value: new Color() },
      uHorizon: { value: new Color() },
      uHaze: { value: new Color() },
      uAccent: { value: new Color() },
      uAccent2: { value: new Color() },
      uSunDir: { value: new Vector3(0, 0.1, -1) },
      uTime: { value: 0 },
      uAurora: { value: 0 },
      uStars: { value: 0 },
      uCirrus: { value: 0.5 },
    },
    defines: {
      FBM_OCTAVES: quality === "high" ? 5 : quality === "medium" ? 4 : 3,
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        // 常に最奥に置く
        gl_Position = p.xyww;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop;
      uniform vec3 uHorizon;
      uniform vec3 uHaze;
      uniform vec3 uAccent;
      uniform vec3 uAccent2;
      uniform vec3 uSunDir;
      uniform float uTime;
      uniform float uAurora;
      uniform float uStars;
      uniform float uCirrus;
      varying vec3 vDir;
      ${NOISE_GLSL}
      void main() {
        vec3 d = normalize(vDir);
        float y = d.y;
        float up = clamp(y, 0.0, 1.0);
        // 大気の厚み：地平ほど散乱色が濃い
        vec3 col = mix(uHorizon, uTop, pow(smoothstep(0.0, 0.62, up), 0.55));
        col = mix(col, uHaze, (1.0 - smoothstep(0.0, 0.22, up)) * 0.35);
        float sd = max(dot(d, normalize(uSunDir)), 0.0);
        // 太陽のまわりのミー散乱と、地平沿いに広がる光
        col += uAccent * (pow(sd, 6.0) * 0.35 + pow(sd, 48.0) * 0.6);
        col += uAccent * pow(sd, 2.0) * (1.0 - smoothstep(0.0, 0.3, up)) * 0.25;
        // 太陽の円盤
        float disc = smoothstep(0.9993, 0.9998, sd);
        col = mix(col, vec3(1.0, 0.97, 0.9) * 1.4, disc);
        // 巻雲：高度で引き伸ばした fBm。太陽側ほど明るく縁取られる
        if (y > 0.0 && uCirrus > 0.0) {
          vec2 q = d.xz / (y + 0.12);
          float w = pnFbm(vec3(q * 0.9 + vec2(uTime * 0.004, 0.0), 1.0));
          float c = pnFbm(vec3(q * vec2(1.2, 3.4) + w * 1.8 + vec2(uTime * 0.01, 0.0), 4.0));
          float cov = smoothstep(0.52, 0.78, c) * smoothstep(0.0, 0.08, y)
            * (1.0 - smoothstep(0.35, 0.8, y));
          vec3 cc = mix(uHaze * 1.4, uAccent * 0.9 + uHaze * 0.4, pow(sd, 3.0));
          col = mix(col, cc, cov * uCirrus);
        }
        // オーロラ：縦に流れる帯
        if (uAurora > 0.0 && y > 0.02) {
          vec2 q = d.xz / (y + 0.35);
          float band = pnFbm(vec3(q.x * 1.6 + uTime * 0.03, q.y * 0.4, uTime * 0.02));
          float curtain = smoothstep(0.42, 0.62, band) * (1.0 - smoothstep(0.42, 0.62, band + 0.12));
          float rays = 0.6 + 0.4 * sin(q.x * 40.0 + band * 12.0 + uTime * 0.4);
          float h = smoothstep(0.04, 0.16, y) * (1.0 - smoothstep(0.32, 0.62, y));
          vec3 ac = mix(uAccent2, uAccent, smoothstep(0.1, 0.5, y));
          col += ac * curtain * rays * h * uAurora * 1.6;
        }
        // 星（暗い空でだけ）
        if (uStars > 0.0 && y > 0.05) {
          float s = pnHash(floor(d * 380.0));
          float tw = 0.7 + 0.3 * sin(uTime * 2.0 + s * 60.0);
          col += vec3(step(0.9975, s)) * smoothstep(0.05, 0.4, y) * uStars * tw * 0.8;
        }
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
    side: BackSide,
    depthWrite: false,
    fog: false,
  });
}

// ---------------------------------------------------------------------------
// 雲（体積感のあるパフのクラスタ）
// ---------------------------------------------------------------------------

function createCloudPuffMaterial(atlas: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uMap: { value: atlas },
      uLit: { value: new Color(1, 1, 1) },
      uShade: { value: new Color(0.3, 0.3, 0.4) },
      uSun: { value: new Color(1, 0.8, 0.6) },
      uFog: { value: new Color() },
      uSunDir: { value: new Vector3(0, 0.1, -1) },
      uDrift: { value: 0 },
      uWrap: { value: 900 },
      uOpacity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aAlpha;
      attribute float aVariant;
      attribute float aShade;
      uniform float uDrift;
      uniform float uWrap;
      uniform vec3 uSunDir;
      varying vec2 vUv;
      varying float vAlpha;
      varying float vShade;
      varying float vForward;
      varying float vFog;
      void main() {
        float v = aVariant;
        vec2 cell = vec2(mod(v, 2.0), floor(v / 2.0)) * 0.5;
        vUv = cell + uv * 0.5;
        vec3 center = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float scale = length(instanceMatrix[0].xyz);
        // 風で流れて、端から端へ回り込む
        center.x = mod(center.x + uDrift + uWrap * 0.5, uWrap) - uWrap * 0.5;
        vec4 wc = modelMatrix * vec4(center, 1.0);
        vec4 mv = viewMatrix * wc;
        // ビルボード（CPU で毎フレーム向きを直さない）
        mv.xy += position.xy * scale;
        vec3 viewDir = normalize(wc.xyz - cameraPosition);
        vForward = pow(max(dot(viewDir, normalize(uSunDir)), 0.0), 5.0);
        float dist = length(wc.xyz - cameraPosition);
        vFog = smoothstep(160.0, 820.0, dist) * 0.85;
        float edgeFade = 1.0 - smoothstep(uWrap * 0.36, uWrap * 0.5, abs(center.x));
        vAlpha = aAlpha * edgeFade;
        vShade = aShade;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uLit;
      uniform vec3 uShade;
      uniform vec3 uSun;
      uniform vec3 uFog;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vAlpha;
      varying float vShade;
      varying float vForward;
      varying float vFog;
      void main() {
        vec4 t = texture2D(uMap, vUv);
        // 縁ほど急に薄くして、パフの輪郭を出さない
        float a = pow(t.a, 1.6) * vAlpha * uOpacity;
        if (a < 0.003) discard;
        // 上のパフほど日が当たり、下は自分の影で暗い
        float lit = clamp(t.r * 0.75 + vShade * 0.55 - 0.15, 0.0, 1.0);
        vec3 col = mix(uShade, uLit, lit);
        // 逆光：薄い縁が太陽色に光る（シルバーライニング）
        float thin = 1.0 - smoothstep(0.05, 0.55, t.a);
        col += uSun * thin * vForward * 1.4;
        col = mix(col, uFog, vFog);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    fog: false,
  });
}

// ---------------------------------------------------------------------------
// 浮遊する粒（火の粉・灰・火花・霧）
// ---------------------------------------------------------------------------

function createDustMaterial(dot: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uMap: { value: dot },
      uViewportH: { value: 800 },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aAlpha;
      attribute vec3 aColor;
      uniform float uViewportH;
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * projectionMatrix[1][1] * uViewportH * 0.5 / max(0.1, -mv.z);
        vAlpha = aAlpha;
        vColor = aColor;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
        if (a < 0.003) discard;
        gl_FragColor = vec4(vColor, a);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: false,
  });
}

type Dust = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  span: number;
  size: number;
  alpha: number;
  hue: number;
};

// ---------------------------------------------------------------------------
// 惑星ごとの空気（照明・霧・密度・画角）
// 同じ部品でも、露出・霧の濃さ・粒の量・カメラの高さと画角で場所の空気を変える
// ---------------------------------------------------------------------------

type Atmos = {
  /** トーンマップの露出 */
  exposure: number;
  /** 太陽（平行光）の強さ */
  sun: number;
  /** 半球光（空と地面の照り返し）の強さ */
  hemi: number;
  fogNear: number;
  fogFar: number;
  /** 浮遊粒の量（品質ごとの上限に掛ける） */
  density: number;
  /** 地表からのカメラの高さ */
  eye: number;
  /** 画角の増減（度）。狭いと望遠で壁が迫り、広いと開けて見える */
  fov: number;
};

const ATMOS: Record<string, Atmos> = {
  // 工房：管制灯と誘導灯が主役。中くらいの霧、標準の画角
  projects: {
    exposure: 1,
    sun: 2.6,
    hemi: 1.5,
    fogNear: 40,
    fogFar: 470,
    density: 1,
    eye: 2.6,
    fov: 0,
  },
  // 居住地：低い夕陽で明るく暖かい。霧は薄く遠くまで開け、火の粉が多い。広角で低い目線
  about: {
    exposure: 1.14,
    sun: 3.4,
    hemi: 1.8,
    fogNear: 60,
    fogFar: 560,
    density: 1.6,
    eye: 1.7,
    fov: 6,
  },
  // 交信の谷：暗く青い。谷底に霧が溜まり、望遠で崖が迫る。オーロラの粒は濃い
  contact: {
    exposure: 0.86,
    sun: 2.2,
    hemi: 1.25,
    fogNear: 14,
    fogFar: 360,
    density: 1.4,
    eye: 2.2,
    fov: -7,
  },
  // 未踏の灰月：ほとんど光がない。粒は少なく、静か
  uncharted: {
    exposure: 0.8,
    sun: 2,
    hemi: 1.1,
    fogNear: 40,
    fogFar: 620,
    density: 0.5,
    eye: 2.6,
    fov: 0,
  },
};

function atmosFor(t: PlanetTheme): Atmos {
  return ATMOS[t.id] ?? ATMOS.projects;
}

/**
 * 展示物の看板の文字（端末の表示板）。CanvasTexture に等幅で描く。
 * 読める情報は DOM（作品カードと文字の一覧）にもあるので、ここは飾りと入口。
 */
function createSignTexture(
  label: string,
  index: string,
  t: PlanetTheme,
): CanvasTexture {
  const w = 512;
  const h = 204;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = "#07060a";
    g.fillRect(0, 0, w, h);
    const [r1, g1, b1] = t.accent2;
    const [r2, g2, b2] = t.accent;
    g.strokeStyle = `rgba(${r1},${g1},${b1},0.85)`;
    g.lineWidth = 4;
    g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = `rgb(${r1},${g1},${b1})`;
    g.font = "600 26px ui-monospace, Menlo, monospace";
    g.fillText(`BAY-${index}  ./projects`, 30, 52);
    g.fillStyle = "#f5f3ff";
    g.font = "700 54px ui-monospace, Menlo, monospace";
    let text = label;
    while (g.measureText(text).width > w - 60 && text.length > 3) {
      text = text.slice(0, -2) + "…";
    }
    g.fillText(text, 30, 124);
    g.fillStyle = `rgb(${r2},${g2},${b2})`;
    g.font = "500 24px ui-monospace, Menlo, monospace";
    g.fillText("> open", 30, 170);
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** カメラの構図：位置と注視点 */
type Shot = { cam: Vector3; look: Vector3 };

// ---------------------------------------------------------------------------
// シーン
// ---------------------------------------------------------------------------

type SceneOpts = {
  reduce: boolean;
  onContextLost: () => void;
  /** 格納庫の看板に載せる作品 */
  exhibits?: { slug: string; label: string }[];
};
type BuiltScene = {
  handle: PlanetSceneHandle;
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
};

/**
 * 分割版。組み立てを数 ms ごとに区切り、テーマを当てたあと
 * compileAsync（KHR_parallel_shader_compile）でシェーダーを並列にコンパイルする。
 */
export async function createPlanetSceneAsync(
  host: HTMLElement,
  opts: SceneOpts,
  theme: PlanetTheme,
  slicer: FrameSlicer,
): Promise<PlanetSceneHandle | null> {
  const built = await slicer.run(planetSceneSteps(host, opts));
  if (!built) return null;
  try {
    // 組み立てだけ先に済ませ、最初の描画より前にシェーダーを並列コンパイルする
    // （先に描くと、その 1 フレームで全シェーダーが同期コンパイルされて長いタスクになる）
    await built.handle.setThemeAsync(theme, slicer, false);
    await slicer.pause();
    await built.renderer.compileAsync(built.scene, built.camera);
    // テクスチャも 1 枚ずつ GPU へ送っておく
    const textures = new Set<Texture>();
    built.scene.traverse((o) => {
      const mat = (o as Mesh).material as unknown as
        Record<string, unknown> | undefined;
      if (!mat) return;
      for (const v of Object.values(mat)) {
        if (v instanceof Texture) textures.add(v);
      }
      const uniforms = mat.uniforms as
        Record<string, { value: unknown }> | undefined;
      for (const u of Object.values(uniforms ?? {})) {
        if (u.value instanceof Texture) textures.add(u.value);
      }
    });
    for (const tex of textures) {
      await slicer.pause();
      built.renderer.initTexture(tex);
    }
  } catch (error) {
    if (error instanceof SliceCancelled) {
      built.handle.dispose();
      throw error;
    }
  }
  return built.handle;
}

function* planetSceneSteps(
  host: HTMLElement,
  opts: SceneOpts,
): Generator<void, BuiltScene | null, unknown> {
  const cfg = detectConfig(opts.reduce);
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      antialias: cfg.quality !== "low",
      alpha: false,
      depth: true,
      stencil: false,
      powerPreference: cfg.quality === "low" ? "low-power" : "default",
    });
  } catch {
    return null;
  }
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;pointer-events:none;" +
    (opts.reduce ? "" : "transition:opacity 600ms ease-out;");
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  if (cfg.shadowMap > 0) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    // 地形と建物は動かないので、テーマ変更時だけ影を描き直す
    renderer.shadowMap.autoUpdate = false;
  }
  host.prepend(canvas);

  const permanent: Disposable[] = [];
  let completed = false;
  try {
    const keep = <T extends Disposable>(x: T): T => {
      permanent.push(x);
      return x;
    };

    const scene = new Scene();
    const camera = new PerspectiveCamera(50, 1, 0.5, 2400);
    const fog = new Fog(0x000000, 30, 460);
    scene.fog = fog;

    yield;
    if (cfg.env) {
      try {
        const pmrem = new PMREMGenerator(renderer);
        const room = new RoomEnvironment();
        const env = pmrem.fromScene(room, 0.04).texture;
        room.dispose();
        pmrem.dispose();
        scene.environment = env;
        scene.environmentIntensity = 0.35;
        keep(env);
      } catch {
        // 環境マップなしでもライトで見える
      }
    }

    yield;
    // 空のドーム（常に最背面）
    const skyMat = keep(createSkyMaterial(cfg.quality));
    const skyGeo = keep(new SphereGeometry(1000, 48, 24));
    const sky = new Mesh(skyGeo, skyMat);
    sky.renderOrder = -10;
    sky.frustumCulled = false;
    scene.add(sky);

    const hemi = new HemisphereLight(0xffffff, 0x000000, 1);
    scene.add(hemi);
    const sun = new DirectionalLight(0xffffff, 2.6);
    scene.add(sun);
    scene.add(sun.target);
    const back = new DirectionalLight(0xffffff, 0.5);
    scene.add(back);
    if (cfg.shadowMap > 0) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(cfg.shadowMap, cfg.shadowMap);
      const sc = sun.shadow.camera;
      sc.left = -150;
      sc.right = 150;
      sc.top = 130;
      sc.bottom = -130;
      sc.near = 10;
      sc.far = 900;
      sun.shadow.bias = -0.0006;
      sun.shadow.normalBias = 0.6;
      sun.shadow.radius = 2;
    }

    const detailNormal = cfg.detailTex
      ? keep(yield* detailNormalSteps(cfg.detailTex))
      : null;
    // 砂や岩は逆光でも鏡のように光らないよう、鏡面反射を弱めた PBR にする
    const terrainMat = keep(
      new MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 1,
        metalness: 0,
        specularIntensity: 0.22,
        normalMap: detailNormal,
        normalScale: new Vector2(0.55, 0.55),
      }),
    );
    let terrain: Mesh | null = null;

    // 雲のパフ
    const softDot = keep(createSoftDot(32));
    const atlas = keep(
      yield* cloudAtlasSteps(cfg.quality === "low" ? 128 : 256),
    );
    const puffCount = cfg.clusters * cfg.puffs + cfg.banks;
    const puffGeo = keep(new PlaneGeometry(1, 0.64));
    const aAlpha = new InstancedBufferAttribute(new Float32Array(puffCount), 1);
    const aVariant = new InstancedBufferAttribute(
      new Float32Array(puffCount),
      1,
    );
    const aShade = new InstancedBufferAttribute(new Float32Array(puffCount), 1);
    puffGeo.setAttribute("aAlpha", aAlpha);
    puffGeo.setAttribute("aVariant", aVariant);
    puffGeo.setAttribute("aShade", aShade);
    const puffMat = keep(createCloudPuffMaterial(atlas));
    const puffs = new InstancedMesh(puffGeo, puffMat, puffCount);
    puffs.frustumCulled = false;
    puffs.renderOrder = 2;
    scene.add(puffs);

    // 浮遊粒（濃い惑星では上限の 1.6 倍まで）
    const dust: Dust[] = [];
    const dustCap = Math.max(1, Math.ceil(cfg.particles * 1.6));
    const dustGeo = keep(new BufferGeometry());
    const dPos = new Float32Array(dustCap * 3);
    const dSize = new Float32Array(dustCap);
    const dAlpha = new Float32Array(dustCap);
    const dCol = new Float32Array(dustCap * 3);
    const dPosAttr = new BufferAttribute(dPos, 3);
    const dSizeAttr = new BufferAttribute(dSize, 1);
    const dAlphaAttr = new BufferAttribute(dAlpha, 1);
    const dColAttr = new BufferAttribute(dCol, 3);
    for (const a of [dPosAttr, dSizeAttr, dAlphaAttr, dColAttr]) {
      a.setUsage(DynamicDrawUsage);
    }
    dustGeo.setAttribute("position", dPosAttr);
    dustGeo.setAttribute("aSize", dSizeAttr);
    dustGeo.setAttribute("aAlpha", dAlphaAttr);
    dustGeo.setAttribute("aColor", dColAttr);
    const dustMat = keep(createDustMaterial(softDot));
    const dustPoints = new Points(dustGeo, dustMat);
    dustPoints.frustumCulled = false;
    dustPoints.renderOrder = 3;
    dustPoints.visible = cfg.particles > 0;
    scene.add(dustPoints);

    // テーマごとに作り直すもの
    let themed: Disposable[] = [];
    let bodies: PlanetBody[] = [];
    let structures: Group | null = null;
    let beacon: MeshStandardMaterial | null = null;
    let theme: PlanetTheme | null = null;
    let heightAt: (x: number, z: number) => number = () => 0;
    const dustA = new Color();
    const dustB = new Color();

    const camBase = new Vector3(0, 3, 12);
    const lookBase = new Vector3(0, 6, -70);
    // 巡航カメラ：テーマごとの「始まりの構図」と「読み進めた先の構図」を
    // スクロールの進み具合で結び、今の位置はそこへ減衰しながら滑る（自由移動はしない）
    const shotA: Shot = { cam: new Vector3(), look: new Vector3() };
    const shotB: Shot = { cam: new Vector3(), look: new Vector3() };
    const camNow = new Vector3(0, 3, 12);
    const lookNow = new Vector3(0, 6, -70);
    const camGoal = new Vector3();
    const lookGoal = new Vector3();
    let scrollGoal = 0;
    let focusX = 0;
    let focusY = 0;
    let focusW = 0;
    let focusWNow = 0;
    let fovBase = 50;
    let atmos: Atmos = ATMOS.projects;
    /** 格納庫の駐機機体の中心（ワールド座標） */
    const shipAnchor = new Vector3();
    let hasShip = false;
    /** 展示物（作品の看板）。当たり判定は画面へ投影した矩形で行う */
    let exhibitList: { slug: string; label: string }[] = opts.exhibits ?? [];
    const exhibits: { slug: string; mesh: Mesh }[] = [];
    let building: string | null = null;
    let lookX = 0;
    let lookY = 0;
    let targetX = 0;
    let targetY = 0;
    let clock = 0;
    const sunDir = new Vector3();

    const spawnDust = (p: Dust, initial: boolean) => {
      const kind = theme?.particles ?? "mist";
      const r = Math.random;
      p.x = (r() - 0.5) * 70;
      p.z = 4 - r() * 70;
      p.y = heightAt(p.x, p.z) + 0.4 + r() * 10;
      p.vx = (r() - 0.5) * 0.6;
      p.vy = 0;
      p.vz = (r() - 0.5) * 0.4;
      p.life = 0;
      p.span = 3 + r() * 4;
      p.size = 0.12 + r() * 0.16;
      p.alpha = 0.8;
      p.hue = r();
      if (kind === "embers") {
        p.y = heightAt(p.x, p.z) + r() * 2;
        p.vy = 0.8 + r() * 1.4;
        p.vx = (r() - 0.5) * 0.8;
        p.size = 0.1 + r() * 0.14;
      } else if (kind === "ash") {
        p.y = heightAt(p.x, p.z) + 4 + r() * 14;
        p.vy = -(0.3 + r() * 0.5);
        p.size = 0.08 + r() * 0.1;
        p.alpha = 0.45;
        p.span = 6 + r() * 5;
      } else if (kind === "sparks") {
        p.vx = (r() - 0.5) * 3;
        p.vy = 0.4 + r() * 2;
        p.span = 1.4 + r() * 1.6;
        p.size = 0.06 + r() * 0.08;
      } else if (kind === "aurora") {
        p.vy = 0.1 + r() * 0.3;
        p.size = 0.1 + r() * 0.12;
        p.alpha = 0.6;
      } else {
        // 霧：大きく淡い
        p.size = 3 + r() * 5;
        p.alpha = 0.06;
        p.y = heightAt(p.x, p.z) + 0.5 + r() * 3;
        p.vx = 0.4 + r() * 0.8;
        p.span = 6 + r() * 5;
      }
      if (initial) p.life = r() * p.span;
    };

    const writeDust = (dt: number) => {
      for (let i = 0; i < dust.length; i++) {
        const p = dust[i];
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        if (p.life >= p.span) spawnDust(p, false);
        const f = p.life / p.span;
        const fade = f < 0.15 ? f / 0.15 : f > 0.7 ? (1 - f) / 0.3 : 1;
        dPos[i * 3] = p.x;
        dPos[i * 3 + 1] = p.y;
        dPos[i * 3 + 2] = p.z;
        dSize[i] = p.size;
        dAlpha[i] = p.alpha * fade;
        const c = p.hue > 0.5 ? dustA : dustB;
        dCol[i * 3] = c.r;
        dCol[i * 3 + 1] = c.g;
        dCol[i * 3 + 2] = c.b;
      }
      dPosAttr.needsUpdate = true;
      dSizeAttr.needsUpdate = true;
      dAlphaAttr.needsUpdate = true;
      dColAttr.needsUpdate = true;
    };

    /** Projects の工房：着陸パッド・格納庫・管制塔・駐機中の宇宙船 */
    function* buildStructuresSteps(
      t: PlanetTheme,
      track: (x: Disposable) => void,
    ): Generator<void, Group, unknown> {
      const g = new Group();
      const accent = lin(t.accent);
      const accent2 = lin(t.accent2);
      const metal = new MeshStandardMaterial({
        color: 0x2a2f3a,
        metalness: 0.75,
        roughness: 0.45,
      });
      const panel = new MeshStandardMaterial({
        color: 0x14161d,
        metalness: 0.5,
        roughness: 0.6,
      });
      const glowA = new MeshStandardMaterial({
        color: 0x000000,
        emissive: accent2,
        emissiveIntensity: 2.2,
      });
      const glowB = new MeshStandardMaterial({
        color: 0x000000,
        emissive: accent,
        emissiveIntensity: 1.8,
      });
      for (const m of [metal, panel, glowA, glowB]) track(m);
      beacon = glowB;
      const seg =
        cfg.quality === "high" ? 96 : cfg.quality === "medium" ? 64 : 32;
      const shadows = cfg.shadowMap > 0;
      const add = (
        geo: BufferGeometry,
        mat: MeshStandardMaterial,
        x: number,
        y: number,
        z: number,
        rx = 0,
        ry = 0,
        rz = 0,
      ) => {
        track(geo);
        const m = new Mesh(geo, mat);
        m.position.set(x, y, z);
        m.rotation.set(rx, ry, rz);
        m.castShadow = shadows;
        m.receiveShadow = shadows;
        g.add(m);
        return m;
      };
      const padZ = -58;
      const padY = heightAt(0, padZ);
      // 着陸パッドと誘導灯
      add(new CylinderGeometry(10, 10.6, 0.8, seg), metal, 0, padY + 0.2, padZ);
      add(
        new TorusGeometry(7, 0.1, 8, seg),
        glowB,
        0,
        padY + 0.62,
        padZ,
        Math.PI / 2,
      );
      add(
        new TorusGeometry(9.6, 0.08, 8, seg),
        glowA,
        0,
        padY + 0.62,
        padZ,
        Math.PI / 2,
      );
      // 格納庫：角の丸い箱＋かまぼこ屋根＋窓の帯
      const hx = -30;
      const hz = -82;
      const hy = heightAt(hx, hz);
      add(new RoundedBoxGeometry(26, 8, 14, 3, 0.8), panel, hx, hy + 4, hz);
      add(
        new CylinderGeometry(7, 7, 26, seg, 1, false, 0, Math.PI),
        metal,
        hx,
        hy + 8,
        hz,
        0,
        0,
        Math.PI / 2,
      );
      add(
        new RoundedBoxGeometry(22, 0.5, 0.3, 1, 0.1),
        glowA,
        hx,
        hy + 5.5,
        hz + 7.1,
      );
      add(
        new RoundedBoxGeometry(10, 5.5, 0.4, 2, 0.15),
        panel,
        hx + 4,
        hy + 2.75,
        hz + 7.05,
      );
      // 管制塔（回転体）
      const tx = 26;
      const tz = -70;
      const ty = heightAt(tx, tz);
      const tower = [
        [3.2, 0],
        [2.6, 1],
        [1.6, 3],
        [1.3, 12],
        [3.6, 13],
        [3.8, 15.5],
        [2.8, 16.5],
        [0.6, 17.4],
        [0, 17.6],
      ].map(([r, y]) => new Vector2(r, y));
      add(new LatheGeometry(tower, seg), metal, tx, ty, tz);
      add(
        new CylinderGeometry(3.66, 3.66, 1.1, seg, 1, true),
        glowA,
        tx,
        ty + 14.3,
        tz,
      );
      add(new SphereGeometry(0.45, 24, 16), glowB, tx, ty + 18.1, tz);
      // アンテナ群
      for (let i = 0; i < 3; i++) {
        const ax = 44 + i * 6;
        const az = -96 - i * 9;
        const ay = heightAt(ax, az);
        const hgt = 11 + i * 3;
        add(
          new CylinderGeometry(0.12, 0.3, hgt, 12),
          metal,
          ax,
          ay + hgt / 2,
          az,
        );
        add(new SphereGeometry(0.32, 16, 12), glowB, ax, ay + hgt, az);
      }
      yield;
      // 展示物：駐機パッドの奥に、作品ごとの看板（端末風の板）を門型の弧に並べる
      // （機体の手前に置くと隠れるので、機体の上の背景になる高さにする）
      exhibits.length = 0;
      exhibitList.forEach((item, i) => {
        const n = exhibitList.length;
        const ang = (i - (n - 1) / 2) * 0.26;
        const ex = Math.sin(ang) * 20;
        const ez = padZ - 8 - Math.cos(ang) * 4;
        const groundAt = heightAt(ex, ez);
        const ey = groundAt + 4.6;
        const tex = createSignTexture(item.label, `0${i + 1}`, t);
        track(tex);
        const face = new MeshStandardMaterial({
          color: 0x000000,
          emissive: 0xffffff,
          emissiveMap: tex,
          emissiveIntensity: 1.25,
          roughness: 0.6,
        });
        track(face);
        const mast = ey + 2.2 - groundAt;
        add(
          new CylinderGeometry(0.12, 0.18, mast, 10),
          metal,
          ex,
          groundAt + mast / 2,
          ez,
        );
        // 始まりの構図のカメラ（右手前）の方へ少し向ける
        const sign = add(
          new RoundedBoxGeometry(5.2, 2.2, 0.25, 2, 0.08),
          panel,
          ex,
          ey + 3.3,
          ez,
          -0.06,
          Math.atan2(8 - ex, -22 - ez) * 0.85,
        );
        const faceMesh = add(new PlaneGeometry(4.9, 1.95), face, 0, 0, 0.14);
        g.remove(faceMesh);
        faceMesh.position.set(0, 0, 0.14);
        faceMesh.rotation.set(0, 0, 0);
        sign.add(faceMesh);
        exhibits.push({ slug: item.slug, mesh: sign });
      });
      yield;
      // 駐機中の宇宙船（遷移と同じ機体）
      const shipDisposables: Disposable[] = [];
      const ship = yield* shipModelSteps(
        cfg.quality === "high" ? "medium" : "low",
        { value: lin(t.accent, 0.35) },
        softDot,
        shipDisposables,
      );
      for (const d of shipDisposables) track(d);
      // 居住リングの下端（機体ローカル y ≈ -0.51）がパッドの少し上に来る高さ
      ship.group.scale.setScalar(6.6);
      ship.group.position.set(0, padY + 0.62 + 0.51 * 6.6 + 0.18, padZ);
      ship.group.rotation.set(0, -0.65, 0);
      ship.group.traverse((o) => {
        if ((o as Mesh).isMesh) {
          o.castShadow = shadows;
          o.receiveShadow = shadows;
        }
      });
      g.add(ship.group);
      shipAnchor.set(0, ship.group.position.y + 0.4, padZ);
      hasShip = true;
      return g;
    }

    const seedPuffs = (t: PlanetTheme) => {
      const rnd = mulberry32(hashId(t.id) + 77);
      type P = {
        x: number;
        y: number;
        z: number;
        s: number;
        v: number;
        a: number;
        sh: number;
      };
      const list: P[] = [];
      const heavy = t.terrain === "canyons" ? 1.2 : 1;
      for (let c = 0; c < cfg.clusters; c++) {
        const cx = (rnd() - 0.5) * 760;
        const cz = -260 - rnd() * 380;
        const cy = 34 + rnd() * 34 + (-cz - 260) * 0.06;
        const size = (44 + rnd() * 40) * heavy;
        for (let k = 0; k < cfg.puffs; k++) {
          // 楕円体の中に重ねて積む。1 枚ずつは淡く、重なって厚みになる
          const u = rnd();
          const ang = rnd() * Math.PI * 2;
          const rr = Math.sqrt(rnd());
          list.push({
            x: cx + Math.cos(ang) * rr * size * 0.9,
            y: cy + u * size * 0.32,
            z: cz + Math.sin(ang) * rr * size * 0.5,
            s: size * (1.35 - u * 0.45) * (0.8 + rnd() * 0.4),
            v: Math.floor(rnd() * 4),
            a: 0.3 + rnd() * 0.25,
            sh: u,
          });
        }
      }
      // 地平近くの霧の層（地形の層のあいだに挟む）
      for (let k = 0; k < cfg.banks; k++) {
        const z = -70 - rnd() * 220;
        const x = (rnd() - 0.5) * 300;
        list.push({
          x,
          y: heightAt(x, z) + 4 + rnd() * 6,
          z,
          s: 60 + rnd() * 60,
          v: Math.floor(rnd() * 4),
          a: 0.16 + rnd() * 0.14,
          sh: 0.2,
        });
      }
      // 半透明の重なりが破綻しないよう奥から描く
      list.sort((a, b) => a.z - b.z);
      const m = new Object3D();
      list.forEach((p, i) => {
        m.position.set(p.x, p.y, p.z);
        m.scale.setScalar(p.s);
        m.updateMatrix();
        puffs.setMatrixAt(i, m.matrix);
        aAlpha.setX(i, p.a);
        aVariant.setX(i, p.v);
        aShade.setX(i, p.sh);
      });
      puffs.count = list.length;
      puffs.instanceMatrix.needsUpdate = true;
      aAlpha.needsUpdate = true;
      aVariant.needsUpdate = true;
      aShade.needsUpdate = true;
    };

    function* applyThemeSteps(t: PlanetTheme): Generator<void, void, unknown> {
      if (theme && theme.id === t.id && building === null) return;
      const firstTheme = theme === null;
      building = t.id;
      theme = null;
      hasShip = false;
      exhibits.length = 0;
      for (const d of themed) d.dispose();
      themed = [];
      for (const b of bodies) {
        scene.remove(b.group);
        b.dispose();
      }
      bodies = [];
      if (structures) {
        scene.remove(structures);
        structures = null;
      }
      beacon = null;
      if (terrain) {
        scene.remove(terrain);
        terrain.geometry.dispose();
        terrain = null;
      }

      yield;
      atmos = atmosFor(t);
      renderer.toneMappingExposure = atmos.exposure;
      const seed = hashId(t.id) % 97;
      heightAt = makeHeightFn(t.terrain, seed);
      const layout = skyLayout(t);
      dirFrom(layout.sunAz, layout.sunEl, sunDir);

      // 空と霧（地平の色をそろえて継ぎ目を消す）
      const u = skyMat.uniforms;
      (u.uTop.value as Color).copy(lin(t.skyTop));
      (u.uHorizon.value as Color).copy(lin(t.skyHorizon));
      (u.uHaze.value as Color).copy(lin(t.haze));
      (u.uAccent.value as Color).copy(lin(t.accent));
      (u.uAccent2.value as Color).copy(lin(t.accent2));
      (u.uSunDir.value as Vector3).copy(sunDir);
      u.uAurora.value = t.particles === "aurora" ? 1 : 0;
      u.uStars.value = t.id === "uncharted" || t.id === "contact" ? 1 : 0.4;
      u.uCirrus.value = t.id === "uncharted" ? 0.25 : 0.6;
      fog.color.copy(lin(t.skyHorizon)).lerp(lin(t.haze), 0.45);
      fog.near = atmos.fogNear;
      fog.far = atmos.fogFar;

      // 光：低い太陽（アクセント色）＋空と地面の半球光＋反対側の弱い縁取り
      sun.color.setRGB(1, 1, 1).lerp(lin(t.accent), 0.5);
      sun.intensity = atmos.sun;
      sun.position.copy(sunDir).multiplyScalar(420);
      sun.position.z -= 60;
      sun.target.position.set(0, 0, -60);
      hemi.color.copy(lin(t.skyHorizon, 2.4)).lerp(lin(t.haze, 1.6), 0.4);
      hemi.groundColor.copy(lin(t.ground, 2));
      hemi.intensity = atmos.hemi;
      back.color.copy(lin(t.accent2));
      back.intensity = 1.1;
      back.position.set(-sunDir.x * 300, 120, 200);

      // 地形
      const terrainGeo = yield* buildTerrainSteps(t, cfg, heightAt);
      terrain = new Mesh(terrainGeo, terrainMat);
      terrain.receiveShadow = cfg.shadowMap > 0;
      terrain.castShadow = cfg.shadowMap > 0;
      scene.add(terrain);

      // カメラは地表のすぐ上
      const groundY = Math.max(
        heightAt(0, 12),
        heightAt(0, 6),
        heightAt(0, 0),
        heightAt(0, -6),
      );
      camBase.set(0, groundY + atmos.eye, 12);
      lookBase.set(0, groundY + atmos.eye + 3.9, -70);
      fovBase = 50 + atmos.fov;
      resize();
      yield;

      // 空の天体（太陽の向きで欠けて見える）
      const want = Math.min(cfg.moons, layout.moons.length);
      for (let i = 0; i < want; i++) {
        const m = layout.moons[i];
        const bodyQuality =
          cfg.quality === "high" && i === 0
            ? "high"
            : cfg.quality === "low"
              ? "low"
              : "medium";
        const body = createPlanetBody({
          radius: m.size,
          kind: m.kind,
          quality: bodyQuality,
          seed: seed * 0.37 + i * 3.1,
          cloudLayers: m.kind === "planet" ? 1 : 0,
        });
        body.group.position.copy(dirFrom(m.az, m.el).multiplyScalar(820));
        body.group.rotation.set(0.3 + i, i * 1.7, 0.2);
        if (m.kind === "planet") {
          body.setColors(
            lin(t.skyHorizon, 0.8),
            lin(t.accent2, 0.9).lerp(lin(t.accent, 0.8), 0.4),
            lin(t.accent2),
          );
          body.setAtmosphere(0.85);
        } else {
          body.setColors(
            lin(t.groundHi, 1.4),
            lin(t.accent, 0.9).lerp(new Color(0.6, 0.6, 0.6), 0.5),
            lin(t.haze, 1.4),
          );
          body.setAtmosphere(0.35);
        }
        scene.add(body.group);
        bodies.push(body);
        yield;
      }

      if (t.terrain === "hangar") {
        structures = yield* buildStructuresSteps(t, (d) => themed.push(d));
        scene.add(structures);
      }
      setShots(t);
      if (firstTheme || !cfg.animate) {
        // 最初は構図そのものから
        camNow.copy(shotA.cam);
        lookNow.copy(shotA.look);
      } else {
        // 惑星を移ったときは、少し高く後ろから構図へ滑り込む
        camNow.copy(shotA.cam).add(new Vector3(0, 9, 26));
        lookNow.copy(shotA.look).add(new Vector3(0, 6, 0));
      }

      // 雲
      const pu = puffMat.uniforms;
      (pu.uLit.value as Color)
        .copy(lin(t.accent, 0.9))
        .lerp(new Color(0.95, 0.9, 0.85), 0.35);
      // 陰は空の散乱色に溶かす（灰色の板に見えないように）
      (pu.uShade.value as Color)
        .copy(lin(t.skyHorizon, 1.1))
        .lerp(lin(t.haze), 0.4);
      (pu.uSun.value as Color).copy(lin(t.accent, 1.2));
      (pu.uFog.value as Color).copy(fog.color);
      (pu.uSunDir.value as Vector3).copy(sunDir);
      pu.uOpacity.value = t.id === "uncharted" ? 0.55 : 0.9;
      seedPuffs(t);

      // 粒
      dustA.copy(lin(t.accent, t.particles === "ash" ? 0.6 : 1.4));
      dustB.copy(lin(t.accent2, t.particles === "ash" ? 0.5 : 1.2));
      dust.length = 0;
      const particles = Math.min(
        dustCap,
        Math.round(cfg.particles * atmos.density),
      );
      for (let i = 0; i < particles; i++) {
        const p = {} as Dust;
        spawnDust(p, true);
        dust.push(p);
      }
      dustGeo.setDrawRange(0, particles);
      if (particles > 0) writeDust(0);

      if (cfg.shadowMap > 0) renderer.shadowMap.needsUpdate = true;
      theme = t;
      building = null;
    }

    /**
     * テーマごとの 2 つの構図。A は入った直後（見出しを読む位置）、B はスクロールで読み進めた先。
     * どちらも固定の構図で、自由に歩かせない。
     */
    const setShots = (t: PlanetTheme) => {
      shotA.cam.copy(camBase);
      shotA.look.copy(lookBase);
      if (t.terrain === "hangar") {
        // 格納庫：駐機パッドを斜め上から。読み進めるとクレーンで上がって見下ろす
        const padY = heightAt(0, -58);
        shotA.cam.set(8, padY + 7, -22);
        shotA.look.set(-2, padY + 4.5, -58);
        shotB.cam.set(-6, padY + 17, -26);
        shotB.look.set(2, padY + 1, -66);
      } else if (t.terrain === "dunes") {
        // 砂丘：低く前へ進みながら右の稜線へ視線を振る
        shotB.cam.copy(camBase).add(new Vector3(5, 1.4, -34));
        shotB.cam.y = Math.max(
          shotB.cam.y,
          heightAt(shotB.cam.x, shotB.cam.z) + atmos.eye,
        );
        shotB.look.copy(lookBase).add(new Vector3(26, -1.5, -10));
      } else if (t.terrain === "canyons") {
        // 谷：谷底を奥へ進み、崖の上の空（オーロラ）を見上げる
        const z = -42;
        const cx = -16 * Math.sin(z * 0.018 + (hashId(t.id) % 97));
        shotB.cam.set(cx * 0.6, heightAt(cx * 0.6, z) + atmos.eye + 3.5, z);
        shotB.look.copy(lookBase).add(new Vector3(0, 16, -40));
      } else {
        shotB.cam.copy(camBase).add(new Vector3(0, 3, -20));
        shotB.look.copy(lookBase).add(new Vector3(-8, -2, 0));
      }
    };

    const resize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, cfg.dprCap);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      // 縦長の画面では画角を広げて、地平と天体を収める
      camera.fov =
        camera.aspect < 1 ? fovBase + (1 - camera.aspect) * 26 : fovBase;
      camera.updateProjectionMatrix();
      dustMat.uniforms.uViewportH.value = h * dpr;
    };

    const lookAt = new Vector3();
    const qBase = new Quaternion();
    const qFocus = new Quaternion();
    const easeInOut = (x: number) => x * x * (3 - 2 * x);
    /** スクロールの進み具合から今の目標構図を決める */
    const updateGoal = () => {
      const p = cfg.animate
        ? easeInOut(Math.min(1, Math.max(0, scrollGoal)))
        : 0;
      camGoal.lerpVectors(shotA.cam, shotB.cam, p);
      lookGoal.lerpVectors(shotA.look, shotB.look, p);
    };
    /** 今の構図を目標へ減衰しながら近づける（dt 秒） */
    const glide = (dt: number) => {
      updateGoal();
      if (!cfg.animate || dt <= 0) {
        camNow.copy(camGoal);
        lookNow.copy(lookGoal);
        focusWNow = focusW;
        return;
      }
      const k = 1 - Math.exp(-dt * 2.4);
      camNow.lerp(camGoal, k);
      lookNow.lerp(lookGoal, k);
      focusWNow += (focusW - focusWNow) * (1 - Math.exp(-dt * 5));
    };
    const draw = () => {
      camera.position.set(
        camNow.x + lookX * 1.8,
        camNow.y -
          lookY * 0.7 +
          (cfg.animate ? Math.sin(clock * 0.21) * 0.12 : 0),
        camNow.z,
      );
      lookAt.set(lookNow.x + lookX * 5, lookNow.y - lookY * 2.2, lookNow.z);
      camera.lookAt(lookAt);
      if (hasShip && focusWNow > 0.001) {
        // 駐機機体を DOM の駐機窓の位置（NDC）へ置く向きを作り、通常の構図と混ぜる
        qBase.copy(camera.quaternion);
        camera.lookAt(shipAnchor);
        const tv = Math.tan((camera.fov * Math.PI) / 360);
        camera.rotateY(Math.atan(focusX * tv * camera.aspect));
        camera.rotateX(Math.atan(-focusY * tv));
        qFocus.copy(camera.quaternion);
        camera.quaternion.slerpQuaternions(qBase, qFocus, focusWNow);
      }
      sky.position.copy(camera.position);
      renderer.render(scene, camera);
    };

    let raf = 0;
    let last = 0;
    let acc = 0;
    let disposed = false;
    let lost = false;
    let shown = false;
    const minFrame = 1 / cfg.fpsCap - 0.002;

    const reveal = () => {
      if (shown) return;
      shown = true;
      canvas.style.opacity = "1";
    };

    const tick = (now: number) => {
      if (disposed || lost) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += dt;
      if (acc < minFrame) return;
      const step = acc;
      acc = 0;
      clock += step;
      const k = 1 - Math.exp(-step * 3.5);
      lookX += (targetX - lookX) * k;
      lookY += (targetY - lookY) * k;
      glide(step);
      skyMat.uniforms.uTime.value = clock;
      puffMat.uniforms.uDrift.value = clock * 2.2;
      for (const b of bodies) {
        b.update(clock);
        b.group.rotation.y += step * 0.01;
      }
      if (beacon) {
        beacon.emissiveIntensity =
          1.2 + 1.4 * Math.max(0, Math.sin(clock * 2.6));
      }
      if (cfg.particles > 0) writeDust(step);
      draw();
      reveal();
    };

    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      canvas.style.opacity = "0";
      opts.onContextLost();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    resize();

    const idle = () => !raf && !disposed && !lost && theme !== null;

    const projected = new Vector3();
    const handle: PlanetSceneHandle = {
      animate: cfg.animate,
      setTheme(t) {
        if (disposed || lost) return;
        drain(applyThemeSteps(t));
        if (idle()) {
          glide(0);
          draw();
          reveal();
        }
      },
      async setThemeAsync(t, slicer, render = true) {
        if (disposed || lost) return;
        await slicer.run(applyThemeSteps(t));
        if (render && idle()) {
          glide(0);
          draw();
          reveal();
        }
      },
      setScroll(progress) {
        scrollGoal = progress;
      },
      setFocus(x, y, weight) {
        focusX = x;
        focusY = y;
        focusW = weight;
      },
      setExhibits(list) {
        exhibitList = list;
      },
      pickExhibit(clientX, clientY) {
        if (!exhibits.length || theme === null) return null;
        const rect = canvas.getBoundingClientRect();
        const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
        const ny = -((clientY - rect.top) / rect.height) * 2 + 1;
        let best: string | null = null;
        let bestD = Infinity;
        for (const ex of exhibits) {
          // 看板の中心と、横幅の端を投影して画面上の大きさを測る
          ex.mesh.getWorldPosition(projected);
          const dist = projected.distanceTo(camera.position);
          projected.project(camera);
          if (projected.z > 1) continue;
          const halfW =
            2.6 /
            (dist * Math.tan((camera.fov * Math.PI) / 360)) /
            camera.aspect;
          const halfH = 1.1 / (dist * Math.tan((camera.fov * Math.PI) / 360));
          const dx = Math.abs(nx - projected.x);
          const dy = Math.abs(ny - projected.y);
          if (dx <= halfW * 1.15 && dy <= halfH * 1.3) {
            const d = dx + dy;
            if (d < bestD) {
              bestD = d;
              best = ex.slug;
            }
          }
        }
        return best;
      },
      setLook(x, y) {
        targetX = x;
        targetY = y;
      },
      start() {
        if (!cfg.animate || raf || disposed || lost) return;
        last = performance.now();
        acc = 0;
        raf = requestAnimationFrame(tick);
      },
      stop() {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      },
      renderOnce() {
        if (!idle()) return;
        glide(0);
        draw();
        reveal();
      },
      resize() {
        resize();
        if (idle()) draw();
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        canvas.removeEventListener("webglcontextlost", onLost);
        for (const d of themed) d.dispose();
        for (const b of bodies) b.dispose();
        terrain?.geometry.dispose();
        for (const d of permanent) d.dispose();
        renderer.dispose();
        if (!lost) renderer.forceContextLoss();
        canvas.remove();
      },
    };
    completed = true;
    return { handle, renderer, scene, camera };
  } finally {
    // 途中で打ち切られたときは作りかけを片付ける
    if (!completed) {
      for (const d of permanent) d.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    }
  }
}

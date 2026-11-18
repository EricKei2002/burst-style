import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  DataTexture,
  DoubleSide,
  Group,
  InstancedMesh,
  LatheGeometry,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  UnsignedByteType,
  Vector2,
  Vector3,
  type Material,
  type Texture,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mulberry32, valueNoise } from "./proceduralNoise";

/**
 * 高ポリゴンの探査船（手続き生成、glTF なし）。戦闘機・航空機の形にはしない。
 * - 指令モジュール・居住リング・タンク・ノズルは回転体 / トーラス / カプセルで曲面を作る
 * - パネルの継ぎ目・リベット・塗装の濃淡は DataTexture の法線 / ORM / 色マップで描く
 * - PBR（MeshPhysical / MeshStandard）。環境光は呼び出し側の PMREM（RoomEnvironment）
 * 品質ごとに分割数・テクスチャ解像度・クリアコート・細部パーツを落とす。
 */

export type ShipQuality = "high" | "medium" | "low";

type Disposable = { dispose(): void };

export type ShipModel = {
  group: Group;
  /** 排気の出口（機体ローカル） */
  engines: Vector3[];
};

const DETAIL: Record<
  ShipQuality,
  {
    radial: number;
    profile: number;
    bevel: number;
    curve: number;
    tex: number;
    clearcoat: boolean;
    greebles: boolean;
    shadows: boolean;
  }
> = {
  high: {
    radial: 72,
    profile: 56,
    bevel: 4,
    curve: 24,
    tex: 512,
    clearcoat: true,
    greebles: true,
    shadows: true,
  },
  medium: {
    radial: 44,
    profile: 34,
    bevel: 3,
    curve: 14,
    tex: 256,
    clearcoat: false,
    greebles: true,
    shadows: true,
  },
  low: {
    radial: 22,
    profile: 18,
    bevel: 1,
    curve: 8,
    tex: 128,
    clearcoat: false,
    greebles: false,
    shadows: false,
  },
};

function finish(tex: DataTexture, srgb = false): DataTexture {
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.anisotropy = 4;
  if (srgb) tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 外板のテクスチャ一式。行（v 方向）ごとに幅の違うパネルに割り、
 * 継ぎ目は溝（高さ低）、一部の継ぎ目に沿ってリベットを打つ。
 * ORM: R = AO、G = 粗さ、B = 金属度
 */
function createHullTextures(size: number): {
  albedo: DataTexture;
  normal: DataTexture;
  orm: DataTexture;
} {
  const rnd = mulberry32(4242);
  const height = new Float32Array(size * size).fill(1);
  const tone = new Float32Array(size * size);
  const rough = new Float32Array(size * size);

  const rows: number[] = [0];
  let v = 0;
  for (;;) {
    v += 0.06 + rnd() * 0.1;
    if (v >= 0.97) break;
    rows.push(v);
  }
  rows.push(1);
  type Panel = {
    v0: number;
    v1: number;
    u0: number;
    u1: number;
    tone: number;
    rough: number;
    rivets: boolean;
  };
  const panels: Panel[] = [];
  for (let r = 0; r < rows.length - 1; r++) {
    const start = rnd() * 0.1;
    const cuts: number[] = [start];
    let u = 0;
    for (;;) {
      u += 0.08 + rnd() * 0.2;
      if (u >= 0.98) break;
      cuts.push(start + u);
    }
    cuts.push(start + 1);
    for (let c = 0; c < cuts.length - 1; c++) {
      panels.push({
        v0: rows[r],
        v1: rows[r + 1],
        u0: cuts[c],
        u1: cuts[c + 1],
        tone: (rnd() - 0.5) * 0.14,
        rough: (rnd() - 0.5) * 0.18,
        rivets: rnd() > 0.55,
      });
    }
  }
  const seam = 1.6 / size;
  const rivetStep = 10 / size;
  for (const p of panels) {
    const y0 = Math.floor(p.v0 * size);
    const y1 = Math.min(size, Math.ceil(p.v1 * size));
    const x0 = Math.floor(p.u0 * size);
    const x1 = Math.ceil(p.u1 * size);
    for (let y = y0; y < y1; y++) {
      const vv = (y + 0.5) / size;
      for (let x = x0; x < x1; x++) {
        const uu = (x + 0.5) / size;
        const xi = x % size;
        const i = y * size + xi;
        const du = Math.min(uu - p.u0, p.u1 - uu);
        const dv = Math.min(vv - p.v0, p.v1 - vv);
        const d = Math.min(du, dv);
        if (d < 0) continue;
        // 溝（滑らかに落ちる）と、パネル縁のわずかな面取り
        let h = d < seam ? 0.15 + 0.85 * (d / seam) : 1;
        h -= 0.08 * Math.max(0, 1 - d / (seam * 4));
        if (p.rivets && d > seam * 1.8 && d < seam * 3.6) {
          const along = du < dv ? vv : uu;
          const k = (along % rivetStep) / rivetStep - 0.5;
          const rr = k * rivetStep * size;
          const dd = (d - seam * 2.7) * size;
          if (rr * rr + dd * dd < 1.4) h += 0.35;
        }
        const grain = valueNoise(uu * 90, vv * 90, 7) - 0.5;
        height[i] = h + grain * 0.04;
        tone[i] = p.tone + grain * 0.05;
        rough[i] = p.rough + grain * 0.12 + (d < seam * 1.5 ? 0.25 : 0);
      }
    }
  }

  const albedo = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  const orm = new Uint8Array(size * size * 4);
  const strength = size / 96;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const xl = (x - 1 + size) % size;
      const xr = (x + 1) % size;
      const yu = (y - 1 + size) % size;
      const yd = (y + 1) % size;
      const dx = (height[y * size + xr] - height[y * size + xl]) * strength;
      const dy = (height[yd * size + x] - height[yu * size + x]) * strength;
      const len = Math.hypot(dx, dy, 1);
      const o = i * 4;
      normal[o] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      normal[o + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      normal[o + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      normal[o + 3] = 255;
      const g = Math.round(Math.min(1, Math.max(0, 0.62 + tone[i])) * 255);
      albedo[o] = g;
      albedo[o + 1] = Math.min(255, g + 4);
      albedo[o + 2] = Math.min(255, g + 10);
      albedo[o + 3] = 255;
      const ao = Math.min(1, 0.55 + height[i] * 0.45);
      orm[o] = Math.round(ao * 255);
      orm[o + 1] = Math.round(
        Math.min(1, Math.max(0.05, 0.38 + rough[i])) * 255,
      );
      orm[o + 2] = 255;
      orm[o + 3] = 255;
    }
  }
  return {
    albedo: finish(
      new DataTexture(albedo, size, size, RGBAFormat, UnsignedByteType),
      true,
    ),
    normal: finish(
      new DataTexture(normal, size, size, RGBAFormat, UnsignedByteType),
    ),
    orm: finish(new DataTexture(orm, size, size, RGBAFormat, UnsignedByteType)),
  };
}

/**
 * 視線に対して寝ている面ほど光るフレネルのリムを足す。
 * 暗い宇宙でも機体のシルエットを大気色で縁取る。
 */
export function addRim(
  mat: MeshStandardMaterial,
  rim: { value: Color },
  strength: number,
): void {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = rim;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec3 uRimColor;",
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        {
          float rimF = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
          totalEmissiveRadiance += uRimColor * (pow(rimF, 3.0) * ${strength.toFixed(3)});
        }`,
      );
  };
  mat.customProgramCacheKey = () => `ship-rim-${strength}-${mat.type}`;
}

function lathe(points: Vector2[], radial: number): LatheGeometry {
  const g = new LatheGeometry(points, radial);
  // 回転軸 Y を機体の前後 Z に（+Y → +Z）
  g.rotateX(Math.PI / 2);
  return g;
}

function v2(list: number[][]): Vector2[] {
  return list.map(([r, y]) => new Vector2(r, y));
}

/**
 * 放熱板のテクスチャ。外向きに走る冷却管（縞）と、管に沿って残る熱のにじみ。
 * 戻り値の glow は emissiveMap（白 = 熱い管）。
 */
function createRadiatorTextures(size: number): {
  albedo: DataTexture;
  normal: DataTexture;
  glow: DataTexture;
} {
  const albedo = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  const glow = new Uint8Array(size * size * 4);
  const tubes = 12;
  const height = (v: number) => {
    const k = (v * tubes) % 1;
    // 管の丸い断面
    return Math.max(0, Math.cos((k - 0.5) * Math.PI * 1.6));
  };
  for (let y = 0; y < size; y++) {
    const v = (y + 0.5) / size;
    const h = height(v);
    const dh = (height(v + 1 / size) - height(v - 1 / size)) * (size / 40);
    const len = Math.hypot(dh, 1);
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const o = (y * size + x) * 4;
      const grain = valueNoise(u * 40, v * 40, 3) - 0.5;
      const g = Math.round(Math.min(1, 0.34 + h * 0.36 + grain * 0.06) * 255);
      albedo[o] = g;
      albedo[o + 1] = g;
      albedo[o + 2] = Math.min(255, g + 8);
      albedo[o + 3] = 255;
      normal[o] = 128;
      normal[o + 1] = Math.round(((-dh / len) * 0.5 + 0.5) * 255);
      normal[o + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      normal[o + 3] = 255;
      const heat = Math.round(Math.pow(h, 3) * 255);
      glow[o] = heat;
      glow[o + 1] = heat;
      glow[o + 2] = heat;
      glow[o + 3] = 255;
    }
  }
  const make = (data: Uint8Array, srgb: boolean) =>
    finish(
      new DataTexture(data, size, size, RGBAFormat, UnsignedByteType),
      srgb,
    );
  return {
    albedo: make(albedo, true),
    normal: make(normal, false),
    glow: make(glow, true),
  };
}

/** 開口ありのノズル（外面 → 縁 → 内面）。z=0 が取り付け面、+Z が出口 */
function bellProfile(
  throat: number,
  exit: number,
  length: number,
  steps: number,
) {
  const pts: Vector2[] = [
    new Vector2(throat * 1.3, 0),
    new Vector2(throat * 1.1, 0.012),
  ];
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    pts.push(
      new Vector2(
        throat + (exit - throat) * Math.pow(k, 0.75),
        0.02 + k * (length - 0.02),
      ),
    );
  }
  const wall = Math.max(0.004, exit * 0.07);
  pts.push(new Vector2(exit - wall * 0.5, length + wall * 0.4));
  for (let i = steps; i >= 0; i--) {
    const k = i / steps;
    pts.push(
      new Vector2(
        Math.max(0.002, throat + (exit - throat) * Math.pow(k, 0.75) - wall),
        0.02 + k * (length - 0.02),
      ),
    );
  }
  return pts;
}

/**
 * 探査船（巡航船）型の宇宙船。機首は -Z、エンジンは +Z。
 * 前から：丸い指令モジュール（窓の列＋ブリッジのバイザー）→ 細い背骨 →
 * 窓が灯る居住リング（スポーク付き）→ 推進剤タンク群と放熱板 →
 * 大きなエンジン・クラスター（中央 1 基＋周囲 6 基、低品質は 4 基）。
 * 背骨の上に高利得のパラボラ、指令モジュールにホイップアンテナと小型ディッシュ。
 */
export function createShipModel(
  quality: ShipQuality,
  rim: { value: Color },
  softDot: Texture,
  disposables: Disposable[],
): ShipModel {
  const d = DETAIL[quality];
  const low = quality === "low";
  const group = new Group();
  const track = <T extends Disposable>(x: T): T => {
    disposables.push(x);
    return x;
  };

  // ---- テクスチャ ----
  const tex = createHullTextures(d.tex);
  track(tex.albedo);
  track(tex.normal);
  track(tex.orm);
  for (const t of Object.values(tex)) t.repeat.set(4, 1);
  // 同じ画像（Source 共有）を別の繰り返しで使う
  const cloneSet = (u: number, v: number) => {
    const set = {
      albedo: track(tex.albedo.clone()),
      normal: track(tex.normal.clone()),
      orm: track(tex.orm.clone()),
    };
    for (const t of Object.values(set)) t.repeat.set(u, v);
    return set;
  };
  const ringTex = cloneSet(14, 1);
  const frameTex = cloneSet(2, 2);
  const rad = createRadiatorTextures(low ? 64 : 128);
  track(rad.albedo);
  track(rad.normal);
  track(rad.glow);

  // ---- 材質（PBR） ----
  const pbr = (
    set: { albedo: Texture; normal: Texture; orm: Texture },
    color: number,
    metalness: number,
  ) => ({
    color: new Color(color),
    metalness,
    roughness: 1,
    map: set.albedo,
    normalMap: set.normal,
    normalScale: new Vector2(0.9, 0.9),
    roughnessMap: set.orm,
    metalnessMap: set.orm,
    aoMap: set.orm,
    aoMapIntensity: 0.8,
  });
  // 白っぽい塗装の外板（探査船らしい明るい船体）
  const hullParams = pbr(tex, 0xd4d9e1, 0.45);
  const hull: MeshStandardMaterial = track(
    d.clearcoat
      ? new MeshPhysicalMaterial({
          ...hullParams,
          clearcoat: 0.5,
          clearcoatRoughness: 0.25,
        })
      : new MeshStandardMaterial(hullParams),
  );
  const ringMat = track(new MeshStandardMaterial(pbr(ringTex, 0xc8ced8, 0.45)));
  // 骨組み・推進部のガンメタル
  const frame = track(new MeshStandardMaterial(pbr(frameTex, 0x5d6676, 0.85)));
  const dark = track(
    new MeshStandardMaterial({
      color: 0x1a1f2a,
      metalness: 0.85,
      roughness: 0.42,
      normalMap: tex.normal,
      normalScale: new Vector2(0.5, 0.5),
    }),
  );
  // 断熱材（金色の多層断熱フィルム）
  const foil = track(
    new MeshStandardMaterial({
      color: 0xd7a84a,
      metalness: 1,
      roughness: 0.32,
      normalMap: frameTex.normal,
      normalScale: new Vector2(1.6, 1.6),
    }),
  );
  const nozzleMat = track(
    new MeshStandardMaterial({
      color: 0x3a3430,
      metalness: 1,
      roughness: 0.3,
      // 熱で焼けた金属の色むら
      emissive: new Color(0x2a0f04),
      emissiveIntensity: 0.6,
    }),
  );
  const radiatorMat = track(
    new MeshStandardMaterial({
      color: 0xb8bfca,
      metalness: 0.55,
      roughness: 0.48,
      map: rad.albedo,
      normalMap: rad.normal,
      normalScale: new Vector2(1, 1),
      emissive: new Color(0xff5a1f),
      emissiveMap: rad.glow,
      emissiveIntensity: 0.32,
    }),
  );
  addRim(hull, rim, 0.9);
  addRim(ringMat, rim, 0.8);
  addRim(frame, rim, 0.55);
  addRim(dark, rim, 0.45);
  const glass = track(
    new MeshPhysicalMaterial({
      color: 0x0a2230,
      metalness: 0.1,
      roughness: 0.04,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 2.2,
      emissive: new Color(0x0e7490),
      emissiveIntensity: 0.55,
      iridescence: quality === "high" ? 0.35 : 0,
    }),
  );
  const accent = track(
    new MeshStandardMaterial({
      color: 0x22d3ee,
      metalness: 0.4,
      roughness: 0.25,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.1,
    }),
  );
  const mark = track(
    new MeshStandardMaterial({
      color: 0xe879f9,
      metalness: 0.4,
      roughness: 0.3,
      emissive: 0xc026d3,
      emissiveIntensity: 0.9,
    }),
  );
  const engineGlow = track(
    new MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x67e8f9,
      emissiveIntensity: 2.4,
      roughness: 1,
      metalness: 0,
    }),
  );
  // 窓の灯り：光源に依存せず常に灯る。色むらはインスタンス色で付ける
  const windowMat = track(new MeshBasicMaterial({ color: 0xffffff }));
  const dishMat = track(
    new MeshStandardMaterial({
      color: 0xe6e9ee,
      metalness: 0.3,
      roughness: 0.38,
      side: DoubleSide,
    }),
  );
  addRim(dishMat, rim, 0.6);

  const add = (
    geo: BufferGeometry,
    mat: Material,
    pos: [number, number, number] = [0, 0, 0],
    rot: [number, number, number] = [0, 0, 0],
    scale: [number, number, number] = [1, 1, 1],
    parent: Object3D = group,
  ) => {
    track(geo);
    const mesh = new Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  };
  const along: [number, number, number] = [Math.PI / 2, 0, 0];
  const glowSprite = (color: number, size: number) => {
    const s = new Sprite(
      track(
        new SpriteMaterial({
          map: softDot,
          color,
          blending: AdditiveBlending,
          transparent: true,
          depthWrite: false,
          opacity: 0.9,
        }),
      ),
    );
    s.scale.setScalar(size);
    return s;
  };

  // ---- 窓：小さな角丸の板をインスタンスで並べる ----
  const windowGeo = track(new RoundedBoxGeometry(1, 1, 1, 1, 0.2));
  const windowSlots: {
    pos: Vector3;
    rot: [number, number, number];
    size: Vector3;
  }[] = [];
  const winRnd = mulberry32(911);
  const pushWindow = (
    pos: Vector3,
    rot: [number, number, number],
    size: Vector3,
  ) => windowSlots.push({ pos, rot, size });

  // ---- 指令モジュール：丸いドーム型の機首（尖らせない） ----
  const cmdR = 0.19;
  const cmdFront = -0.82;
  const cmdBack = -0.5;
  const cmdProf: Vector2[] = [];
  const domeSteps = Math.max(8, Math.round(d.profile / 3));
  for (let i = 0; i <= domeSteps; i++) {
    const a = (i / domeSteps) * (Math.PI / 2);
    // 楕円のドーム（長さ 0.15）：鈍い丸い先端
    cmdProf.push(
      new Vector2(cmdR * Math.sin(a), cmdFront - 0.15 * Math.cos(a)),
    );
  }
  cmdProf.push(new Vector2(cmdR, cmdBack));
  for (let i = 1; i <= 6; i++) {
    const k = i / 6;
    // 後ろの肩は丸く絞る
    cmdProf.push(
      new Vector2(
        cmdR - (cmdR - 0.09) * (1 - Math.cos((k * Math.PI) / 2)),
        cmdBack + 0.09 * Math.sin((k * Math.PI) / 2),
      ),
    );
  }
  cmdProf.push(new Vector2(0, cmdBack + 0.09));
  cmdProf[0].x = 0;
  add(lathe(cmdProf, d.radial), hull);
  // 継ぎ目の帯
  for (const z of [cmdFront, -0.6]) {
    add(new TorusGeometry(cmdR + 0.002, 0.006, 8, d.radial), dark, [0, 0, z]);
  }
  // 機首のドッキングポート（平たい輪）
  add(
    new TorusGeometry(0.055, 0.012, 10, Math.max(16, d.radial / 2)),
    frame,
    [0, 0, -0.965],
  );
  add(
    new CylinderGeometry(0.05, 0.05, 0.01, Math.max(16, d.radial / 2)),
    dark,
    [0, 0, -0.966],
    along,
  );
  // ブリッジのバイザー（ドーム上半分の帯状ガラス）
  {
    const g = new SphereGeometry(
      1,
      d.radial,
      Math.max(6, Math.round(d.radial / 6)),
      Math.PI * 0.12,
      Math.PI * 0.76,
      0.72,
      0.42,
    );
    g.rotateX(-Math.PI / 2);
    add(
      g,
      glass,
      [0, 0, cmdFront],
      [0, 0, 0],
      [cmdR + 0.004, cmdR + 0.004, 0.154],
    );
  }
  // 指令モジュールの窓（下面は省く）
  {
    const rows = low ? [-0.7] : [-0.74, -0.66, -0.55];
    const per = low ? 10 : quality === "medium" ? 16 : 22;
    for (const z of rows) {
      for (let i = 0; i < per; i++) {
        const a = -0.5 + (i / (per - 1)) * (Math.PI + 1);
        if (z === -0.66 && i % 4 === 1) continue;
        pushWindow(
          new Vector3(
            Math.cos(a) * (cmdR + 0.002),
            Math.sin(a) * (cmdR + 0.002),
            z,
          ),
          [0, 0, a],
          new Vector3(0.008, 0.024, 0.026),
        );
      }
    }
  }

  // ---- 背骨（主構造） ----
  add(
    new CylinderGeometry(0.068, 0.068, 0.92, Math.max(16, d.radial / 2)),
    frame,
    [0, 0, -0.04],
    along,
  );
  if (!low) {
    // トラスの縦材
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      add(
        new CylinderGeometry(0.008, 0.008, 0.36, 8),
        dark,
        [Math.cos(a) * 0.098, Math.sin(a) * 0.098, -0.03],
        along,
      );
    }
  }

  // ---- 居住リング：回転する居住区。外周と後面に灯る窓の列 ----
  const ringZ = -0.25;
  const ringR = 0.44;
  const tube = 0.068;
  const tubeZ = 0.1;
  add(
    new TorusGeometry(
      ringR,
      tube,
      Math.max(10, Math.round(d.radial / 3)),
      Math.round(d.radial * 1.6),
    ),
    ringMat,
    [0, 0, ringZ],
    [0, 0, 0],
    [1, 1, tubeZ / tube],
  );
  // ハブ
  add(
    lathe(
      v2([
        [0, -0.09],
        [0.1, -0.09],
        [0.13, -0.06],
        [0.135, 0],
        [0.13, 0.06],
        [0.1, 0.09],
        [0, 0.09],
      ]),
      d.radial,
    ),
    hull,
    [0, 0, ringZ],
  );
  add(new TorusGeometry(0.136, 0.008, 8, d.radial), accent, [0, 0, ringZ]);
  // スポーク
  const spokes = low ? 3 : 4;
  for (let k = 0; k < spokes; k++) {
    const a = Math.PI / 4 + (k * Math.PI * 2) / spokes;
    const r0 = 0.13;
    const r1 = ringR - tube * 0.8;
    add(
      new CylinderGeometry(0.02, 0.02, r1 - r0, 12),
      frame,
      [Math.cos(a) * ((r0 + r1) / 2), Math.sin(a) * ((r0 + r1) / 2), ringZ],
      [0, 0, a - Math.PI / 2],
    );
    if (!low) {
      // スポーク内のエレベーター筒の継ぎ目
      add(
        new TorusGeometry(0.022, 0.004, 6, 16),
        dark,
        [Math.cos(a) * 0.29, Math.sin(a) * 0.29, ringZ],
        [0, 0, a],
      );
    }
  }
  // 後面の縁取り（追尾カメラから見える光の輪）
  {
    const dr = -0.045;
    const z = ringZ + tubeZ * Math.sqrt(1 - (dr / tube) ** 2) + 0.002;
    add(
      new TorusGeometry(ringR + dr, 0.005, 6, Math.round(d.radial * 1.6)),
      accent,
      [0, 0, z],
    );
  }
  // リングの窓
  {
    const per = low ? 28 : quality === "medium" ? 44 : 64;
    // 外周：2〜3 列
    const outerRows = low
      ? [0]
      : quality === "medium"
        ? [-0.032, 0.032]
        : [-0.048, 0, 0.048];
    for (const dz of outerRows) {
      const r = ringR + tube * Math.sqrt(1 - (dz / tubeZ) ** 2) + 0.002;
      for (let i = 0; i < per; i++) {
        const a = ((i + (dz > 0 ? 0.5 : 0)) / per) * Math.PI * 2;
        pushWindow(
          new Vector3(Math.cos(a) * r, Math.sin(a) * r, ringZ + dz),
          [0, 0, a],
          new Vector3(0.008, 0.026, 0.018),
        );
      }
    }
    // 後面：1 列（追尾カメラ向き）
    const dr = 0.022;
    const z = ringZ + tubeZ * Math.sqrt(1 - (dr / tube) ** 2) + 0.002;
    for (let i = 0; i < per; i++) {
      const a = ((i + 0.25) / per) * Math.PI * 2;
      pushWindow(
        new Vector3(Math.cos(a) * (ringR + dr), Math.sin(a) * (ringR + dr), z),
        [0, 0, a],
        new Vector3(0.016, 0.024, 0.008),
      );
    }
  }

  // ---- 推進剤タンク群と断熱材で包んだ機器部 ----
  const tankZ = 0.13;
  add(
    new CylinderGeometry(0.1, 0.1, 0.34, Math.max(16, d.radial / 2)),
    foil,
    [0, 0, tankZ],
    along,
  );
  const tankCount = low ? 3 : 4;
  for (let k = 0; k < tankCount; k++) {
    const a = Math.PI / 4 + (k * Math.PI * 2) / tankCount;
    add(
      new CapsuleGeometry(
        0.068,
        0.17,
        Math.max(6, d.bevel * 3),
        Math.max(16, d.radial / 2),
      ),
      hull,
      [Math.cos(a) * 0.15, Math.sin(a) * 0.15, tankZ],
      along,
    );
    if (d.greebles) {
      // タンクの締結バンド
      for (const dz of [-0.06, 0.06]) {
        add(
          new TorusGeometry(0.07, 0.005, 6, Math.max(16, d.radial / 2)),
          dark,
          [Math.cos(a) * 0.15, Math.sin(a) * 0.15, tankZ + dz],
        );
      }
    }
  }

  // ---- 放熱板：長い板を外へ張り出す（翼ではなく、冷却管の縞と熱のにじみ） ----
  {
    const segs = low ? 2 : 3;
    const segW = 0.15;
    const gap = 0.012;
    const lenZ = 0.34;
    const thick = 0.008;
    const tilt = 0.2;
    const panelGeo = track(new BoxGeometry(segW, thick, lenZ));
    const frameGeo = track(new BoxGeometry(segW + 0.008, thick * 1.6, 0.012));
    for (const side of [1, -1]) {
      const arm = new Group();
      arm.position.set(side * 0.2, 0.0, tankZ + 0.02);
      arm.rotation.set(0, 0, side * tilt);
      group.add(arm);
      // 背骨から先端まで通るブーム（ヒンジ）
      const boomLen = 0.2 + 0.03 + segs * (segW + gap);
      add(
        new CylinderGeometry(0.012, 0.012, boomLen, 10),
        frame,
        [side * (boomLen / 2 - 0.2), 0, 0],
        [0, 0, Math.PI / 2],
        [1, 1, 1],
        arm,
      );
      for (let s = 0; s < segs; s++) {
        const cx = side * (0.03 + segW / 2 + s * (segW + gap));
        const p = new Mesh(panelGeo, radiatorMat);
        p.position.set(cx, 0.014, 0);
        arm.add(p);
        // 枠（前後の縁）
        for (const fz of [-lenZ / 2, lenZ / 2]) {
          const f = new Mesh(frameGeo, frame);
          f.position.set(cx, 0.014, fz);
          arm.add(f);
        }
      }
      // 先端の航法灯
      const tipX = side * (0.03 + segs * (segW + gap));
      const tip = add(
        new SphereGeometry(0.012, 12, 10),
        side > 0 ? accent : mark,
        [tipX, 0.02, -lenZ / 2],
        [0, 0, 0],
        [1, 1, 1],
        arm,
      );
      tip.add(glowSprite(side > 0 ? 0x67e8f9 : 0xf0abfc, 0.1));
    }
  }

  // ---- エンジン部：推力構造（回転体）＋大きなノズルの束 ----
  const aftZ = 0.58;
  add(
    lathe(
      v2([
        [0.07, 0.3],
        [0.12, 0.33],
        [0.22, 0.4],
        [0.255, 0.43],
        [0.262, 0.46],
        [0.262, 0.54],
        [0.255, 0.565],
        [0.235, aftZ],
        [0, aftZ],
      ]),
      d.radial,
    ),
    hull,
  );
  add(new TorusGeometry(0.263, 0.006, 8, d.radial), dark, [0, 0, 0.47]);
  add(new TorusGeometry(0.258, 0.007, 8, d.radial), accent, [0, 0, 0.552]);
  // 後面の暗い取付板
  add(
    new CylinderGeometry(0.236, 0.236, 0.006, d.radial),
    dark,
    [0, 0, aftZ + 0.002],
    along,
  );
  const engines: Vector3[] = [];
  const bellSteps = Math.max(6, Math.round(d.profile / 4));
  const nozzleRadial = Math.max(16, Math.round(d.radial / 1.5));
  const addNozzle = (
    x: number,
    y: number,
    throat: number,
    exit: number,
    len: number,
  ) => {
    const z0 = aftZ;
    add(
      lathe(bellProfile(throat, exit, len, bellSteps), nozzleRadial),
      nozzleMat,
      [x, y, z0],
    );
    // 取り付けリングと、喉部の明るい炉心
    add(
      new TorusGeometry(throat * 1.3, throat * 0.18, 8, nozzleRadial),
      frame,
      [x, y, z0 + 0.004],
    );
    add(
      new CylinderGeometry(throat * 1.02, throat * 1.02, 0.004, nozzleRadial),
      engineGlow,
      [x, y, z0 + 0.03],
      along,
    );
    if (!low) {
      // 出口の縁の焼け
      add(
        new TorusGeometry(exit - 0.002, 0.003, 6, nozzleRadial),
        engineGlow,
        [x, y, z0 + len],
        [0, 0, 0],
        [1, 1, 1],
      );
    }
    engines.push(new Vector3(x, y, z0 + len + 0.01));
  };
  // 中央の主機
  addNozzle(0, 0, 0.05, 0.09, 0.16);
  const outer = low ? 4 : 6;
  const outerR = low ? 0.15 : 0.163;
  for (let k = 0; k < outer; k++) {
    const a = Math.PI / 2 + (k * Math.PI * 2) / outer;
    addNozzle(
      Math.cos(a) * outerR,
      Math.sin(a) * outerR,
      0.032,
      low ? 0.064 : 0.058,
      0.115,
    );
  }

  // ---- アンテナ ----
  // 高利得パラボラ：背骨の上のマスト。前上方を向く
  {
    const mastZ = -0.04;
    add(new CylinderGeometry(0.009, 0.012, 0.24, 10), frame, [0, 0.18, mastZ]);
    const dish = new Group();
    dish.position.set(0, 0.31, mastZ);
    dish.rotation.set(-0.7, 0, 0);
    group.add(dish);
    const dishR = 0.13;
    const dishPts: Vector2[] = [];
    const dSteps = Math.max(8, Math.round(d.profile / 4));
    for (let i = 0; i <= dSteps; i++) {
      const k = i / dSteps;
      dishPts.push(new Vector2(dishR * k, 0.045 * k * k));
    }
    dishPts.push(new Vector2(dishR + 0.006, 0.05));
    add(
      new LatheGeometry(dishPts, d.radial),
      dishMat,
      [0, 0, 0],
      [0, 0, 0],
      [1, 1, 1],
      dish,
    );
    // 背面の補強リブ
    add(
      new TorusGeometry(dishR * 0.55, 0.006, 6, Math.max(16, d.radial / 2)),
      frame,
      [0, 0.014, 0],
      [Math.PI / 2, 0, 0],
      [1, 1, 1],
      dish,
    );
    // 給電ホーン（3 本の支柱で支える）
    add(
      new CylinderGeometry(0.004, 0.004, 0.11, 6),
      dark,
      [0, 0.055, 0],
      [0, 0, 0],
      [1, 1, 1],
      dish,
    );
    add(
      new SphereGeometry(0.014, 12, 8),
      accent,
      [0, 0.112, 0],
      [0, 0, 0],
      [1, 1, 1],
      dish,
    );
    if (!low) {
      const feed = new Vector3(0, 0.112, 0);
      const up = new Vector3(0, 1, 0);
      for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI * 2) / 3;
        const foot = new Vector3(
          Math.cos(a) * dishR * 0.8,
          0.045 * 0.64,
          Math.sin(a) * dishR * 0.8,
        );
        const dir = feed.clone().sub(foot);
        const strut = add(
          new CylinderGeometry(0.0025, 0.0025, dir.length(), 5),
          dark,
          [0, 0, 0],
          [0, 0, 0],
          [1, 1, 1],
          dish,
        );
        strut.position.copy(foot).add(feed).multiplyScalar(0.5);
        strut.quaternion.copy(
          new Quaternion().setFromUnitVectors(up, dir.normalize()),
        );
      }
    }
  }
  // 指令モジュール上のホイップアンテナ
  const whips = low ? [0] : [-0.07, 0.07];
  for (const x of whips) {
    add(
      new CylinderGeometry(0.0025, 0.004, 0.16, 6),
      dark,
      [x, cmdR + 0.07, -0.68],
      [0.25, 0, x * 3],
    );
    const tipLight = add(new SphereGeometry(0.007, 10, 8), mark, [
      x + x * 0.24,
      cmdR + 0.148,
      -0.7,
    ]);
    tipLight.add(glowSprite(0xf0abfc, 0.06));
  }
  if (d.greebles) {
    // 側面の小型ディッシュ
    const sd = new Group();
    sd.position.set(cmdR + 0.03, 0.06, -0.62);
    sd.rotation.set(0, 0, -1.1);
    group.add(sd);
    const pts: Vector2[] = [];
    for (let i = 0; i <= 8; i++) {
      const k = i / 8;
      pts.push(new Vector2(0.05 * k, 0.018 * k * k));
    }
    add(
      new LatheGeometry(pts, Math.max(16, d.radial / 2)),
      dishMat,
      [0, 0, 0],
      [0, 0, 0],
      [1, 1, 1],
      sd,
    );
    add(
      new CylinderGeometry(0.006, 0.006, 0.05, 6),
      frame,
      [0, -0.02, 0],
      [0, 0, 0],
      [1, 1, 1],
      sd,
    );
    // 姿勢制御スラスターの4連ブロック（指令モジュールとエンジン部）
    const rcsGeo = track(
      new RoundedBoxGeometry(0.035, 0.028, 0.04, d.bevel, 0.008),
    );
    const rcsNozzle = track(new CylinderGeometry(0.005, 0.008, 0.012, 8));
    for (const [rr, z] of [
      [cmdR, -0.58],
      [0.262, 0.5],
    ] as const) {
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2;
        const block = new Mesh(rcsGeo, frame);
        block.position.set(
          Math.cos(a) * (rr + 0.012),
          Math.sin(a) * (rr + 0.012),
          z,
        );
        block.rotation.z = a;
        group.add(block);
        const n = new Mesh(rcsNozzle, dark);
        n.position.set(
          Math.cos(a) * (rr + 0.034),
          Math.sin(a) * (rr + 0.034),
          z,
        );
        n.rotation.z = a - Math.PI / 2;
        group.add(n);
      }
    }
  }

  // ---- 窓をまとめて置く ----
  {
    const win = new InstancedMesh(windowGeo, windowMat, windowSlots.length);
    const dummy = new Object3D();
    const c = new Color();
    windowSlots.forEach((w, i) => {
      dummy.position.copy(w.pos);
      dummy.rotation.set(...w.rot);
      dummy.scale.copy(w.size);
      dummy.updateMatrix();
      win.setMatrixAt(i, dummy.matrix);
      const r = winRnd();
      // 暖色の灯りが主、時々寒色・消灯
      if (r < 0.12) c.setRGB(0.08, 0.1, 0.13);
      else if (r < 0.28) c.setRGB(0.55, 0.9, 1);
      else c.setRGB(1, 0.82 + winRnd() * 0.1, 0.5 + winRnd() * 0.15);
      win.setColorAt(i, c);
    });
    win.castShadow = false;
    win.receiveShadow = false;
    group.add(win);
  }

  group.traverse((o) => {
    if ((o as Mesh).isMesh && (o as Mesh).material !== windowMat) {
      o.castShadow = d.shadows;
      o.receiveShadow = d.shadows;
    }
  });
  return { group, engines };
}

/**
 * 宇宙船・惑星の手続き生成で共有するノイズ（JS と GLSL）。
 * 画像アセットは読まない。three を使う動的チャンク（宇宙船オーバーレイ /
 * 惑星シーン）からだけ import されるので、初期 JS には入らない。
 */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lattice(ix: number, iy: number, seed: number): number {
  let h =
    (Math.imul(ix, 374761393) +
      Math.imul(iy, 668265263) +
      Math.imul(seed, 1442695041)) |
    0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** 0..1 の 2D バリューノイズ */
export function valueNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = lattice(ix, iy, seed);
  const b = lattice(ix + 1, iy, seed);
  const c = lattice(ix, iy + 1, seed);
  const d = lattice(ix + 1, iy + 1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

/** 0..1 の fBm */
export function fbm(
  x: number,
  y: number,
  seed: number,
  octaves: number,
): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(x * freq, y * freq, seed + o * 17);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

/** 尾根状（1 - |n|）の fBm。山脈・峡谷の稜線に使う。0..1 */
export function ridged(
  x: number,
  y: number,
  seed: number,
  octaves: number,
): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  let prev = 1;
  for (let o = 0; o < octaves; o++) {
    const n = valueNoise(x * freq, y * freq, seed + o * 31) * 2 - 1;
    let r = 1 - Math.abs(n);
    r *= r;
    sum += amp * r * prev;
    prev = r;
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return sum / norm;
}

export function smooth(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/**
 * GLSL: 3D バリューノイズ / fBm / 簡易セルノイズ（クレーター用）。
 * FBM_OCTAVES を define で渡すと品質ごとにオクターブ数を変えられる。
 */
export const NOISE_GLSL = /* glsl */ `
  #ifndef FBM_OCTAVES
  #define FBM_OCTAVES 5
  #endif
  float pnHash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float pnNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(pnHash(i + vec3(0, 0, 0)), pnHash(i + vec3(1, 0, 0)), f.x),
          mix(pnHash(i + vec3(0, 1, 0)), pnHash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(pnHash(i + vec3(0, 0, 1)), pnHash(i + vec3(1, 0, 1)), f.x),
          mix(pnHash(i + vec3(0, 1, 1)), pnHash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  float pnFbm(vec3 p) {
    float s = 0.0;
    float a = 0.5;
    float n = 0.0;
    for (int i = 0; i < FBM_OCTAVES; i++) {
      s += a * pnNoise(p);
      n += a;
      a *= 0.5;
      p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    }
    return s / n;
  }
  float pnRidged(vec3 p) {
    float s = 0.0;
    float a = 0.5;
    float n = 0.0;
    for (int i = 0; i < FBM_OCTAVES; i++) {
      float r = 1.0 - abs(pnNoise(p) * 2.0 - 1.0);
      s += a * r * r;
      n += a;
      a *= 0.5;
      p = p * 2.07 + vec3(4.1, 1.3, 7.7);
    }
    return s / n;
  }
  // 最近点までの距離（0..~1）。クレーターの縁に使う
  float pnCell(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    float d = 1.0;
    for (int z = -1; z <= 1; z++)
    for (int y = -1; y <= 1; y++)
    for (int x = -1; x <= 1; x++) {
      vec3 g = vec3(float(x), float(y), float(z));
      vec3 o = vec3(pnHash(i + g), pnHash(i + g + 19.1), pnHash(i + g + 47.3));
      vec3 r = g + o - f;
      d = min(d, dot(r, r));
    }
    return sqrt(d);
  }
  // three の bumpmap と同じ考え方で、スクリーン空間の高さ勾配から法線を揺らす
  vec3 pnPerturb(vec3 surfPos, vec3 surfNorm, float h, float faceDir) {
    vec2 dHdxy = vec2(dFdx(h), dFdy(h));
    vec3 sx = normalize(dFdx(surfPos));
    vec3 sy = normalize(dFdy(surfPos));
    vec3 r1 = cross(sy, surfNorm);
    vec3 r2 = cross(surfNorm, sx);
    float det = dot(sx, r1) * faceDir;
    vec3 grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
    return normalize(abs(det) * surfNorm - grad);
  }
`;

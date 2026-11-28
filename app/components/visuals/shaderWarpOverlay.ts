// ハイパースペース・ワープの全画面遷移（three の素の WebGLRenderer + 全画面三角形 1 枚）。
// このモジュールは app/lib/shaderTransitionLoader.ts から動的 import でのみ読み込む。
import {
  BufferAttribute,
  BufferGeometry,
  Camera,
  Mesh,
  NoBlending,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from "three";

export interface ShaderWarpOverlay {
  /** 加速しながら覆う。終わったら覆ったまま巡航し、playOpen / hide を待つ */
  playClose(durationMs: number): void;
  /** 覆った状態からワープを抜けて新しいページを見せる */
  playOpen(durationMs: number): void;
  /** 戻る/進む用。覆った最高潮から開いて見せる（履歴は遅らせない） */
  playReveal(durationMs: number): void;
  /** 即座に非表示にして描画ループを止める */
  hide(): void;
  dispose(): void;
}

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uTravel;
  uniform float uWarp;
  uniform float uCover;
  uniform float uFlash;

  const float TAU = 6.2831853;
  const vec3 BG = vec3(0.039);
  const vec3 CYAN = vec3(0.404, 0.910, 0.976);
  const vec3 FUCHSIA = vec3(0.910, 0.475, 0.976);

  float hash11(float n) {
    return fract(sin(n * 127.1) * 43758.5453);
  }

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  // 角度方向にセル分割し、各セルに 1 本の星の筋を消失点から外へ走らせる
  vec3 streakLayer(float r, float a, float cells, float seed) {
    float ang = a / TAU * cells;
    float id = floor(ang);
    float fa = fract(ang) - 0.5;
    float h = hash11(id + seed);
    float h2 = hash11(id * 1.37 + seed * 3.1);
    float present = step(0.22, hash11(id * 7.13 + seed * 0.71));

    // 頭の位置。二乗で外側ほど速く（簡易な遠近）
    float z = fract(h2 + uTravel * (0.35 + h * 0.65));
    float head = z * z * 1.7;
    float len = mix(0.01, 0.82, uWarp) * (0.2 + head);
    float along = smoothstep(head - len, head, r) * (1.0 - step(head, r));

    // 角度方向の太さはピクセル基準で揃える
    float px = 1.0 / uResolution.y;
    float arc = abs(fa) * TAU * r / cells;
    float width = px * (1.6 + 2.4 * h) * (0.75 + head);
    float line = 1.0 - smoothstep(width * 0.45, width * 1.7, arc);

    float b = present * along * line * (0.55 + 0.75 * z) * smoothstep(0.01, 0.1, r);
    vec3 tint = vec3(1.0);
    tint = mix(tint, CYAN, step(0.78, h));
    tint = mix(tint, FUCHSIA, step(h, 0.16));
    return tint * b;
  }

  void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    float r = length(p);
    float a = atan(p.y, p.x);

    vec3 streaks =
      streakLayer(r, a, 260.0, 0.0) +
      streakLayer(r, a, 380.0, 11.0) * 0.95 +
      streakLayer(r, a, 170.0, 23.0) * 1.35 +
      streakLayer(r, a, 96.0, 41.0) * 1.6;
    streaks *= smoothstep(0.0, 0.22, uWarp + uCover);

    // ノイズの溶けるベール。外側から覆い、開くときは中心から抜ける
    float rMax = length(0.5 * uResolution / uResolution.y);
    float n = fbm(p * 3.2 + vec2(0.0, uTime * 0.12));
    float v = n * 0.6 + (r / rMax) * 0.5;
    float th = mix(1.15, -0.12, uCover);
    float soft = 0.05;
    float m = smoothstep(th - soft, th + soft, v);
    float inTransit = step(0.001, uCover) * step(uCover, 0.999);
    float edge = (1.0 - smoothstep(0.0, 0.07, abs(v - th))) * inTransit;
    vec3 edgeCol = mix(CYAN, FUCHSIA, 0.5 + 0.5 * sin(a * 2.0 + n * 4.0));

    // 最高潮：光が中心へ収束するコアと、中心へ向かう暈
    float core = uFlash * (
      1.8 * exp(-r * r * 28.0) +
      0.7 * exp(-r * r * 6.0) +
      0.28 * exp(-r * r * 1.4)
    );
    float ring = uFlash * (1.0 - smoothstep(0.0, 0.08 + 0.18 * (1.0 - uFlash), abs(r - 0.12 * (1.0 - uFlash))));
    vec3 coreCol = mix(vec3(1.0), CYAN, 0.18);
    vec3 ringCol = mix(CYAN, FUCHSIA, 0.45);

    vec3 col =
      BG * m +
      streaks * mix(1.15, 0.9, m) +
      edgeCol * edge * 0.65 +
      coreCol * core +
      ringCol * ring * 0.55;
    float alpha = clamp(
      m + max(max(streaks.r, streaks.g), streaks.b) + edge * 0.5 + core + ring * 0.5,
      0.0,
      1.0
    );
    // 乗算済みアルファで出力する
    gl_FragColor = vec4(min(col, vec3(alpha)), alpha);
  }
`;

type Mode = "idle" | "closing" | "covered" | "opening" | "revealing";

const MAX_PIXEL_RATIO = 1.25;

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

/** WebGL が使えない場合は null（呼び出し側は覆わずに切り替える） */
export function createShaderWarpOverlay(
  host: HTMLElement,
  onContextLost: () => void,
): ShaderWarpOverlay | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
      powerPreference: "default",
    });
  } catch {
    return null;
  }

  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;display:block;visibility:hidden;pointer-events:none";
  renderer.setClearColor(0x000000, 0);
  host.appendChild(canvas);

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
  );
  const uniforms = {
    uResolution: { value: new Vector2(1, 1) },
    uTime: { value: 0 },
    uTravel: { value: 0 },
    uWarp: { value: 0 },
    uCover: { value: 0 },
    uFlash: { value: 0 },
  };
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    blending: NoBlending,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.add(mesh);
  const camera = new Camera();

  let mode: Mode = "idle";
  let startAt = 0;
  let duration = 1;
  let coveredAt = 0;
  let lastFrame = 0;
  let rafId = 0;
  let disposed = false;
  let contextLost = false;

  const resize = () => {
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
    );
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.getDrawingBufferSize(uniforms.uResolution.value);
  };

  const stopLoop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    window.removeEventListener("resize", resize);
  };

  const goIdle = () => {
    mode = "idle";
    stopLoop();
    canvas.style.visibility = "hidden";
    if (!contextLost) {
      renderer.clear();
    }
  };

  const frame = (now: number) => {
    rafId = 0;
    if (disposed || contextLost) return;
    const dt = Math.min(now - lastFrame, 50) / 1000;
    lastFrame = now;
    const t = clamp01((now - startAt) / duration);

    let warp = 0;
    let cover = 0;
    let flash = 0;
    if (mode === "closing") {
      warp = t * t;
      // 途中までで覆い切り、残りを中心へ光が集まる最高潮に使う
      cover = smoothstep(0.1, 0.76, t);
      if (t < 0.72) {
        flash = 0.12 * t;
      } else {
        const k = (t - 0.72) / 0.28;
        flash = 0.2 + 0.8 * Math.sin((Math.min(k, 1) * Math.PI) / 2);
      }
      if (t >= 1) {
        mode = "covered";
        coveredAt = now;
      }
    } else if (mode === "covered") {
      // 覆ったまま巡航（経路切り替えを隠す）。最高潮の残光を少し長めに残す
      warp = 0.95;
      cover = 1;
      flash = 0.55 * Math.exp(-(now - coveredAt) / 200);
    } else if (mode === "opening") {
      warp = 0.95 * (1 - t) * (1 - t);
      cover = 1 - smoothstep(0.06, 0.82, t);
      flash = 0.5 * (1 - smoothstep(0, 0.28, t));
    } else if (mode === "revealing") {
      // 戻る/進む：いきなり最高潮で覆い、それから開く
      const hold = 0.24;
      if (t < hold) {
        const k = t / hold;
        warp = 1;
        cover = 1;
        flash = 0.35 + 0.65 * Math.sin(k * Math.PI);
      } else {
        const u = (t - hold) / (1 - hold);
        warp = 0.95 * (1 - u) * (1 - u);
        cover = 1 - smoothstep(0.04, 0.82, u);
        flash = 0.6 * (1 - smoothstep(0, 0.22, u));
      }
    }

    uniforms.uTime.value = now / 1000;
    uniforms.uTravel.value += dt * (0.08 + warp * 3.2);
    uniforms.uWarp.value = warp;
    uniforms.uCover.value = cover;
    uniforms.uFlash.value = flash;
    renderer.render(scene, camera);

    if ((mode === "opening" || mode === "revealing") && t >= 1) {
      goIdle();
      return;
    }
    rafId = requestAnimationFrame(frame);
  };

  const start = (next: Mode, durationMs: number) => {
    if (disposed || contextLost) return;
    const wasIdle = mode === "idle";
    mode = next;
    startAt = performance.now();
    duration = Math.max(1, durationMs);
    if (wasIdle) {
      resize();
      window.addEventListener("resize", resize);
      lastFrame = startAt;
    }
    canvas.style.visibility = "visible";
    if (!rafId) {
      rafId = requestAnimationFrame(frame);
    }
  };

  const handleContextLost = () => {
    contextLost = true;
    stopLoop();
    canvas.style.visibility = "hidden";
    onContextLost();
  };
  canvas.addEventListener("webglcontextlost", handleContextLost);

  // 最初の遷移でシェーダーのコンパイル待ちが出ないように先に済ませる
  try {
    renderer.compile(scene, camera);
  } catch {
    // 失敗しても描画時に再試行される
  }

  return {
    playClose(durationMs) {
      start("closing", durationMs);
    },
    playOpen(durationMs) {
      start("opening", durationMs);
    },
    playReveal(durationMs) {
      start("revealing", durationMs);
    },
    hide() {
      goIdle();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stopLoop();
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (!contextLost) {
        renderer.forceContextLoss();
      }
      canvas.remove();
    },
  };
}

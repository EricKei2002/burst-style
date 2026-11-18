import {
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DynamicDrawUsage,
  EdgesGeometry,
  Group,
  HemisphereLight,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  type Material,
} from "three";
import type { WarpJourney } from "../../lib/planets";

export interface ShaderWarpOverlay {
  /** 加速しながら覆う。終わったら覆ったまま巡航し、playOpen / hide を待つ */
  playClose(durationMs: number): void;
  /** 覆いを開いて新しいページを見せる */
  playOpen(durationMs: number): void;
  /** 戻る/進む：覆った最高潮から開く（履歴は遅らせない） */
  playReveal(durationMs: number): void;
  setJourney(
    journey: WarpJourney,
    atmo: [number, number, number],
    horizon: [number, number, number],
    fromAtmo?: [number, number, number],
    fromHorizon?: [number, number, number],
  ): void;
  hide(): void;
  dispose(): void;
}

type Mode = "idle" | "closing" | "covered" | "opening" | "revealing";
type Quality = "high" | "medium" | "low";

type NavHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

function detectQuality(): {
  quality: Quality;
  dprCap: number;
  stars: number;
  clouds: number;
  exhaust: number;
} {
  const nav = navigator as NavHints;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 768;
  const mobile = coarse || narrow;
  const mem = nav.deviceMemory;
  const cores = navigator.hardwareConcurrency || 8;
  const saveData = nav.connection?.saveData === true;
  const lowEnd =
    saveData || (typeof mem === "number" && mem <= 4) || cores <= 4;
  if (lowEnd) {
    return { quality: "low", dprCap: 1, stars: 280, clouds: 18, exhaust: 28 };
  }
  if (mobile) {
    return {
      quality: "medium",
      dprCap: 1.25,
      stars: 700,
      clouds: 36,
      exhaust: 56,
    };
  }
  return {
    quality: "high",
    dprCap: 1.5,
    stars: 1600,
    clouds: 72,
    exhaust: 110,
  };
}

function journeyCode(journey: WarpJourney): number {
  if (journey === "enter-planet") return 1;
  if (journey === "leave-space") return -1;
  if (journey === "fly-between") return 2;
  return 0;
}

function track<T extends { dispose(): void }>(
  disposables: { dispose(): void }[],
  item: T,
): T {
  disposables.push(item);
  return item;
}

function createShip(
  disposables: { dispose(): void }[],
  quality: Quality,
): {
  group: Group;
  engines: Vector3[];
} {
  const group = new Group();
  const body = new MeshStandardMaterial({
    color: 0x1c2230,
    metalness: 0.88,
    roughness: 0.28,
  });
  const dark = new MeshStandardMaterial({
    color: 0x0b0d14,
    metalness: 0.7,
    roughness: 0.4,
  });
  const glass = new MeshStandardMaterial({
    color: 0x083344,
    metalness: 0.2,
    roughness: 0.08,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.45,
  });
  const accent = new MeshStandardMaterial({
    color: 0x22d3ee,
    metalness: 0.35,
    roughness: 0.25,
    emissive: 0x0891b2,
    emissiveIntensity: 0.7,
  });
  const mark = new MeshStandardMaterial({
    color: 0xe879f9,
    metalness: 0.35,
    roughness: 0.3,
    emissive: 0xa21caf,
    emissiveIntensity: 0.55,
  });
  const glow = new MeshBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.85,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  for (const mat of [body, dark, glass, accent, mark, glow]) {
    track(disposables, mat);
  }

  const add = (
    geo: BufferGeometry,
    mat: Material,
    x = 0,
    y = 0,
    z = 0,
    rx = 0,
    ry = 0,
    rz = 0,
    edges = false,
  ) => {
    track(disposables, geo);
    const mesh = new Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
    if (edges && quality !== "low") {
      const edgeGeo = track(disposables, new EdgesGeometry(geo, 18));
      const line = new LineSegments(
        edgeGeo,
        track(
          disposables,
          new LineBasicMaterial({
            color: 0x8ba0b8,
            transparent: true,
            opacity: 0.42,
          }),
        ),
      );
      mesh.add(line);
    }
    return mesh;
  };

  // 機首を -Z（カメラ前方）へ
  const fuselage = track(
    disposables,
    new CylinderGeometry(0.07, 0.16, 1.05, quality === "low" ? 6 : 8, 1, false),
  );
  add(fuselage, body, 0, 0, 0, Math.PI / 2, 0, 0, true);

  const nose = track(
    disposables,
    new ConeGeometry(0.07, 0.38, quality === "low" ? 6 : 8),
  );
  add(nose, body, 0, 0, -0.7, Math.PI / 2, 0, 0, true);

  const canopy = track(
    disposables,
    new SphereGeometry(0.09, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
  );
  add(canopy, glass, 0, 0.07, -0.18, Math.PI, 0, 0);

  const wing = track(disposables, new BoxGeometry(1.35, 0.03, 0.48));
  add(wing, body, 0, -0.02, 0.08, 0, 0, 0, true);
  const wingSolid = track(
    disposables,
    new CylinderGeometry(0.015, 0.05, 1.28, 4),
  );
  add(wingSolid, dark, 0, -0.03, 0.12, 0, 0, Math.PI / 2);

  add(
    track(disposables, new CylinderGeometry(0.02, 0.05, 0.36, 4)),
    body,
    0,
    0.16,
    0.28,
    0.35,
    0,
    0,
    true,
  );

  add(
    track(disposables, new CylinderGeometry(0.018, 0.018, 0.22, 5)),
    accent,
    0.52,
    -0.02,
    0.02,
    0,
    0,
    Math.PI / 2,
  );
  add(
    track(disposables, new CylinderGeometry(0.018, 0.018, 0.22, 5)),
    mark,
    -0.52,
    -0.02,
    0.02,
    0,
    0,
    Math.PI / 2,
  );

  // 双発エンジン
  const engineShell = (x: number) => {
    add(
      track(disposables, new CylinderGeometry(0.055, 0.07, 0.28, 8)),
      dark,
      x,
      -0.02,
      0.58,
      Math.PI / 2,
    );
    add(
      track(disposables, new CylinderGeometry(0.032, 0.032, 0.08, 8)),
      glow,
      x,
      -0.02,
      0.72,
      Math.PI / 2,
    );
  };
  engineShell(0.13);
  engineShell(-0.13);

  const chin = track(disposables, new CylinderGeometry(0.012, 0.012, 0.5, 4));
  add(chin, accent, 0, -0.08, -0.15, Math.PI / 2);

  return {
    group,
    engines: [new Vector3(0.13, -0.02, 0.74), new Vector3(-0.13, -0.02, 0.74)],
  };
}

function createStars(
  count: number,
  disposables: { dispose(): void }[],
): Points {
  const geo = new BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 160;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 90;
    pos[i * 3 + 2] = -Math.random() * 180;
  }
  geo.setAttribute("position", new BufferAttribute(pos, 3));
  track(disposables, geo);
  const mat = track(
    disposables,
    new PointsMaterial({
      color: 0xe8f4ff,
      size: 0.18,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
  );
  return new Points(geo, mat);
}

function createHUD(host: HTMLElement): {
  root: HTMLElement;
  set: (lines: string[]) => void;
  show: () => void;
  hide: () => void;
  dispose: () => void;
} {
  const root = document.createElement("div");
  root.setAttribute("aria-hidden", "true");
  root.style.cssText =
    "position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity 160ms linear;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;";
  const corners = [
    "8px 12px auto auto",
    "auto 12px 10px auto",
    "auto auto 10px 12px",
    "8px auto auto 12px",
  ];
  const borders = [
    "2px solid rgba(103,232,249,0.55)",
    "2px solid rgba(232,121,249,0.45)",
    "2px solid rgba(103,232,249,0.45)",
    "2px solid rgba(232,121,249,0.4)",
  ];
  const radii = ["0 0 0 8px", "8px 0 0 0", "0 8px 0 0", "0 0 8px 0"];
  for (let i = 0; i < 4; i++) {
    const c = document.createElement("div");
    c.style.cssText = `position:absolute;${["top", "right", "bottom", "left"][i] === "top" ? "" : ""}width:28px;height:28px;border:${borders[i]};border-radius:${radii[i]};inset:${corners[i]};clip-path:none;opacity:0.9;`;
    // simpler L brackets
    c.style.background = "transparent";
    c.style.width = "22px";
    c.style.height = "22px";
    if (i === 0) {
      c.style.top = "12px";
      c.style.left = "14px";
      c.style.borderRight = "none";
      c.style.borderBottom = "none";
      c.style.borderRadius = "0";
    } else if (i === 1) {
      c.style.top = "12px";
      c.style.right = "14px";
      c.style.left = "auto";
      c.style.borderLeft = "none";
      c.style.borderBottom = "none";
      c.style.borderRadius = "0";
    } else if (i === 2) {
      c.style.bottom = "12px";
      c.style.right = "14px";
      c.style.top = "auto";
      c.style.left = "auto";
      c.style.borderLeft = "none";
      c.style.borderTop = "none";
      c.style.borderRadius = "0";
    } else {
      c.style.bottom = "12px";
      c.style.left = "14px";
      c.style.top = "auto";
      c.style.borderRight = "none";
      c.style.borderTop = "none";
      c.style.borderRadius = "0";
    }
    root.appendChild(c);
  }
  const panel = document.createElement("div");
  panel.style.cssText =
    "position:absolute;left:18px;bottom:22px;color:#7deeff;font-size:11px;line-height:1.55;letter-spacing:0.14em;text-shadow:0 0 10px rgba(34,211,238,0.45);white-space:pre;";
  root.appendChild(panel);
  host.appendChild(root);
  return {
    root,
    set(lines) {
      panel.textContent = lines.join("\n");
    },
    show() {
      root.style.visibility = "visible";
      root.style.opacity = "1";
    },
    hide() {
      root.style.transition = "none";
      root.style.opacity = "0";
      root.style.visibility = "hidden";
      // 次に出すときのためにトランジションを戻す
      requestAnimationFrame(() => {
        root.style.transition = "opacity 160ms linear";
      });
    },
    dispose() {
      root.remove();
    },
  };
}

/** WebGL が使えない場合は null（呼び出し側はハンガー扉に戻す） */
export function createShaderWarpOverlay(
  host: HTMLElement,
  onContextLost: () => void,
): ShaderWarpOverlay | null {
  const cfg = detectQuality();
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      antialias: cfg.quality === "high",
      alpha: true,
      premultipliedAlpha: true,
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
    "position:absolute;inset:0;width:100%;height:100%;display:block;visibility:hidden;pointer-events:none";
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = true;
  host.appendChild(canvas);

  const disposables: { dispose(): void }[] = [];
  const scene = new Scene();
  const camera = new PerspectiveCamera(55, 1, 0.08, 400);
  camera.position.set(0, 0.42, 3.35);

  const hemi = new HemisphereLight(0x9bd7ff, 0x1a1020, 0.7);
  scene.add(hemi);
  const key = new DirectionalLight(0xffffff, 1.15);
  key.position.set(2.4, 3.2, 2.2);
  scene.add(key);
  const rim = new DirectionalLight(0x67e8f9, 1.4);
  rim.position.set(-2.8, 0.6, -3.4);
  scene.add(rim);
  const heatLight = new PointLight(0xff6a1a, 0, 12, 2);
  scene.add(heatLight);
  const engineLight = new PointLight(0x67e8f9, 1.4, 8, 2);
  engineLight.position.set(0, 0, 1.1);
  scene.add(engineLight);

  const ship = createShip(disposables, cfg.quality);
  scene.add(ship.group);

  const stars = createStars(cfg.stars, disposables);
  scene.add(stars);

  const planetGeo = track(
    disposables,
    new SphereGeometry(
      8,
      cfg.quality === "low" ? 20 : 36,
      cfg.quality === "low" ? 14 : 24,
    ),
  );
  const planetMat = track(
    disposables,
    new MeshStandardMaterial({
      color: 0x226688,
      roughness: 0.86,
      metalness: 0.08,
    }),
  );
  const planet = new Mesh(planetGeo, planetMat);
  planet.position.set(0, -2, -60);
  scene.add(planet);

  const atmoGeo = track(
    disposables,
    new SphereGeometry(
      8.55,
      cfg.quality === "low" ? 16 : 28,
      cfg.quality === "low" ? 12 : 20,
    ),
  );
  const atmoMat = track(
    disposables,
    new MeshBasicMaterial({
      color: 0x4ecfff,
      transparent: true,
      opacity: 0.22,
      side: BackSide,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  const atmoShell = new Mesh(atmoGeo, atmoMat);
  planet.add(atmoShell);

  const groundGeo = track(disposables, new PlaneGeometry(80, 80, 1, 1));
  const groundMat = track(
    disposables,
    new MeshStandardMaterial({
      color: 0x1a2030,
      roughness: 1,
      metalness: 0,
    }),
  );
  const ground = new Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -6, -12);
  scene.add(ground);

  // 雲（カメラ前方の薄い板をインスタンス）
  const cloudGeo = track(disposables, new PlaneGeometry(3.4, 1.6));
  const cloudMat = track(
    disposables,
    new MeshBasicMaterial({
      color: 0xf2f4ff,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  );
  const clouds = new InstancedMesh(cloudGeo, cloudMat, cfg.clouds);
  clouds.instanceMatrix.setUsage(DynamicDrawUsage);
  scene.add(clouds);
  const dummy = new Object3D();
  const cloudPos: { x: number; y: number; z: number; s: number }[] = [];
  const seedClouds = () => {
    cloudPos.length = 0;
    for (let i = 0; i < cfg.clouds; i++) {
      cloudPos.push({
        x: (Math.random() - 0.5) * 28,
        y: (Math.random() - 0.5) * 10,
        z: -4 - Math.random() * 70,
        s: 0.7 + Math.random() * 1.8,
      });
    }
  };
  seedClouds();

  // 排気の軌跡
  const exGeo = new BufferGeometry();
  const exPos = new Float32Array(cfg.exhaust * 3);
  const exCol = new Float32Array(cfg.exhaust * 3);
  exGeo.setAttribute("position", new BufferAttribute(exPos, 3));
  exGeo.setAttribute("color", new BufferAttribute(exCol, 3));
  track(disposables, exGeo);
  const exMat = track(
    disposables,
    new PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  const exhaust = new Points(exGeo, exMat);
  scene.add(exhaust);
  let exHead = 0;

  // 大気圏突入のプラズマ鞘
  const plasmaGeo = track(
    disposables,
    new ConeGeometry(0.42, 1.5, 12, 1, true),
  );
  const plasmaMat = track(
    disposables,
    new MeshBasicMaterial({
      color: 0xff7a2a,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
  const plasma = new Mesh(plasmaGeo, plasmaMat);
  plasma.rotation.x = Math.PI / 2;
  plasma.position.set(0, 0, -0.95);
  ship.group.add(plasma);

  const veilGeo = track(disposables, new PlaneGeometry(2, 2));
  const veilMat = track(
    disposables,
    new MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
    }),
  );
  const veil = new Mesh(veilGeo, veilMat);
  veil.frustumCulled = false;
  veil.renderOrder = 10;
  camera.add(veil);
  veil.position.set(0, 0, -0.25);
  scene.add(camera);

  const hud = createHUD(host);

  let mode: Mode = "idle";
  let startAt = 0;
  let duration = 1;
  let coveredAt = 0;
  let lastFrame = 0;
  let rafId = 0;
  let disposed = false;
  let contextLost = false;
  let journey: WarpJourney = "neutral";
  const atmo = new Color(0.15, 0.82, 0.88);
  const horizon = new Color(0.9, 0.2, 0.85);
  const atmoPrev = new Color(0.15, 0.82, 0.88);
  const horizonPrev = new Color(0.9, 0.2, 0.85);
  let travel = 0;
  const worldEngine = new Vector3();

  const resize = () => {
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, cfg.dprCap);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = Math.max(0.5, w / Math.max(1, h));
    camera.updateProjectionMatrix();
    const vh = 2 * Math.tan((camera.fov * Math.PI) / 360) * 0.25;
    const vw = vh * camera.aspect;
    veil.scale.set(vw * 1.15, vh * 1.15, 1);
  };

  const goIdle = () => {
    mode = "idle";
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    canvas.style.visibility = "hidden";
    hud.hide();
    renderer.setClearColor(0x000000, 0);
    window.removeEventListener("resize", resize);
  };

  const stopLoop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  const mixColors = (a: Color, b: Color, t: number, out: Color) => {
    out.r = a.r + (b.r - a.r) * t;
    out.g = a.g + (b.g - a.g) * t;
    out.b = a.b + (b.b - a.b) * t;
    return out;
  };

  const currentAtmo = new Color();
  const currentHoriz = new Color();

  const layoutClouds = (
    speed: number,
    dt: number,
    density: number,
    climb: number,
  ) => {
    for (let i = 0; i < cloudPos.length; i++) {
      const c = cloudPos[i];
      c.z += speed * dt;
      c.y += climb * dt;
      if (c.z > 4) {
        c.z = -8 - Math.random() * 50;
        c.x = (Math.random() - 0.5) * 28;
        c.y = (Math.random() - 0.5) * 10;
      }
      dummy.position.set(c.x, c.y, c.z);
      dummy.lookAt(camera.position);
      dummy.scale.set(c.s * (0.7 + density), c.s * 0.5 * (0.7 + density), 1);
      dummy.updateMatrix();
      clouds.setMatrixAt(i, dummy.matrix);
    }
    clouds.instanceMatrix.needsUpdate = true;
    cloudMat.opacity = 0.08 + density * 0.32;
  };

  const writeExhaust = (heat: number, throttle: number) => {
    if (throttle <= 0.02) return;
    for (const local of ship.engines) {
      worldEngine.copy(local);
      ship.group.localToWorld(worldEngine);
      const i = exHead % cfg.exhaust;
      exPos[i * 3] = worldEngine.x + (Math.random() - 0.5) * 0.04;
      exPos[i * 3 + 1] = worldEngine.y + (Math.random() - 0.5) * 0.04;
      exPos[i * 3 + 2] = worldEngine.z + Math.random() * 0.06;
      const hot = heat > 0.35;
      exCol[i * 3] = hot ? 1 : 0.45;
      exCol[i * 3 + 1] = hot ? 0.45 + Math.random() * 0.2 : 0.9;
      exCol[i * 3 + 2] = hot ? 0.12 : 1;
      exHead += 1;
    }
    // 古い点を少し後方へ流し、色を落とす
    for (let i = 0; i < cfg.exhaust; i++) {
      exPos[i * 3 + 2] += 0.06;
      exCol[i * 3] *= 0.96;
      exCol[i * 3 + 1] *= 0.96;
      exCol[i * 3 + 2] *= 0.96;
    }
    (exGeo.attributes.position as BufferAttribute).needsUpdate = true;
    (exGeo.attributes.color as BufferAttribute).needsUpdate = true;
  };

  const frame = (now: number) => {
    if (disposed || contextLost) return;
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    const t = duration <= 0 ? 1 : clamp01((now - startAt) / duration);

    let cover = 0;
    let flash = 0;
    let warp = 0;
    if (mode === "closing") {
      warp = t * t;
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
      warp = 0.95;
      cover = 1;
      flash = 0.55 * Math.exp(-(now - coveredAt) / 280);
    } else if (mode === "opening") {
      warp = 0.95 * (1 - t) * (1 - t);
      cover = 1 - smoothstep(0.06, 0.82, t);
      flash = 0.5 * (1 - smoothstep(0, 0.28, t));
    } else if (mode === "revealing") {
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

    const code = journeyCode(journey);
    const enter = code === 1 ? 1 : 0;
    const leave = code === -1 ? 1 : 0;
    const fly = code === 2 ? 1 : 0;
    const morph = smoothstep(0.12, 0.78, cover);
    mixColors(atmoPrev, atmo, fly ? morph : 1, currentAtmo);
    mixColors(horizonPrev, horizon, fly ? morph : 1, currentHoriz);

    // ステージ進行。closing は接近、opening は通過後
    let stage = 0;
    if (mode === "closing") stage = t;
    else if (mode === "covered") stage = 1;
    else if (mode === "opening") stage = 1 + t;
    else if (mode === "revealing") stage = t < 0.24 ? 1 : 1 + (t - 0.24) / 0.76;

    travel += dt * (6 + warp * 42);

    // 惑星の位置：突入では近づき飲み込まれ、離脱では足元から遠ざかる
    if (enter) {
      const approach = smoothstep(0, 0.82, Math.min(stage, 1));
      planet.position.set(3.5, -3.2, MathUtils.lerp(-78, -11, approach));
      planet.scale.setScalar(MathUtils.lerp(1, 2.4, approach));
      ground.position.set(
        0,
        MathUtils.lerp(-18, -3.2, smoothstep(0.55, 1, stage)),
        -8,
      );
      ground.visible = stage > 0.55;
    } else if (leave) {
      const climb = Math.min(stage, 1);
      planet.position.set(
        0,
        MathUtils.lerp(-14, -28, climb),
        MathUtils.lerp(-16, -50, climb),
      );
      planet.scale.setScalar(MathUtils.lerp(3.2, 1.1, climb));
      ground.position.set(0, MathUtils.lerp(-2.6, -22, climb), -6);
      ground.visible = climb < 0.85;
    } else if (fly) {
      const hop = Math.min(stage, 1);
      if (hop < 0.45) {
        const u = hop / 0.45;
        planet.position.set(
          -2,
          MathUtils.lerp(-14, -26, u),
          MathUtils.lerp(-18, -55, u),
        );
        planet.scale.setScalar(MathUtils.lerp(2.6, 1.05, u));
        ground.visible = u < 0.7;
        ground.position.set(0, MathUtils.lerp(-2.8, -18, u), -6);
      } else {
        const u = (hop - 0.45) / 0.55;
        planet.position.set(3.2, -3.4, MathUtils.lerp(-70, -12, u));
        planet.scale.setScalar(MathUtils.lerp(1, 2.3, u));
        ground.visible = u > 0.55;
        ground.position.set(
          0,
          MathUtils.lerp(-18, -3.2, smoothstep(0.55, 1, u)),
          -8,
        );
      }
    } else {
      planet.position.set(4, -4, -40);
      planet.scale.setScalar(1.2);
      ground.visible = false;
    }
    planet.rotation.y = travel * 0.02;
    planetMat.color.copy(currentHoriz);
    atmoMat.color.copy(currentAtmo);
    groundMat.color.copy(currentHoriz).multiplyScalar(0.35);
    atmoMat.opacity = 0.16 + cover * 0.2;

    const heat =
      enter *
        smoothstep(0.08, 0.45, Math.min(stage, 1)) *
        (1 - smoothstep(0.78, 1.05, stage)) +
      leave *
        smoothstep(0.0, 0.2, Math.min(stage, 1)) *
        (1 - smoothstep(0.45, 0.85, Math.min(stage, 1))) *
        0.45 +
      fly *
        smoothstep(0.5, 0.72, Math.min(stage, 1)) *
        (1 - smoothstep(0.88, 1.15, stage)) *
        0.7;

    const punch =
      enter * smoothstep(0.42, 0.72, Math.min(stage, 1)) +
      leave * smoothstep(0.18, 0.48, Math.min(stage, 1)) +
      fly * smoothstep(0.55, 0.82, Math.min(stage, 1));

    const cloudDensity =
      (enter + fly * 0.8 + leave) *
      (smoothstep(0.25, 0.6, Math.min(stage, 1)) *
        (1 - smoothstep(0.78, 1.15, stage)) +
        punch * 0.35);
    const climbDir = leave ? 8 : enter ? -2 : 0;
    layoutClouds(8 + warp * 55, dt, cloudDensity, climbDir * dt * 20);
    clouds.visible = cloudDensity > 0.04;

    plasmaMat.opacity =
      heat * (0.35 + 0.5 * (0.5 + 0.5 * Math.sin(now * 0.04)));
    plasmaMat.color.setRGB(1, 0.42 + (1 - heat) * 0.3, 0.1 + leave * 0.4);
    plasma.scale.set(1 + heat * 0.5, 1 + heat * 0.9, 1);
    heatLight.intensity = heat * 4.5;
    heatLight.color.setRGB(1, 0.4, 0.12);
    heatLight.position.set(0, 0.1, -1.2);
    engineLight.intensity = 1.2 + warp * 2.2;

    // 機体の姿勢
    if (enter) {
      ship.group.rotation.set(
        MathUtils.lerp(0.08, 0.22, smoothstep(0.3, 0.7, Math.min(stage, 1))),
        Math.sin(travel * 0.15) * 0.04,
        Math.sin(travel * 0.21) * 0.08,
      );
    } else if (leave) {
      ship.group.rotation.set(
        MathUtils.lerp(-0.55, -0.08, smoothstep(0.15, 0.8, Math.min(stage, 1))),
        0,
        Math.sin(travel * 0.18) * 0.06,
      );
    } else if (fly) {
      const hop = Math.min(stage, 1);
      const bank =
        hop < 0.45
          ? MathUtils.lerp(0, 0.55, hop / 0.45)
          : MathUtils.lerp(0.55, -0.15, (hop - 0.45) / 0.55);
      ship.group.rotation.set(hop < 0.45 ? -0.25 : 0.16, bank * 0.4, bank);
    } else {
      ship.group.rotation.set(0.05, 0, 0);
    }
    const shake = heat * 0.05;
    ship.group.position.set(
      Math.sin(now * 0.031) * shake,
      0.02 + Math.sin(now * 0.023) * shake,
      0,
    );

    writeExhaust(heat, 0.4 + warp);

    // 星は宇宙にいるときだけ
    const inSpace =
      leave * smoothstep(0.35, 0.8, Math.min(stage, 1)) +
      enter * (1 - smoothstep(0.45, 0.75, Math.min(stage, 1))) +
      fly *
        (smoothstep(0.15, 0.4, Math.min(stage, 1)) *
          (1 - smoothstep(0.58, 0.82, Math.min(stage, 1)))) +
      (enter + leave + fly === 0 ? 1 : 0);
    stars.visible = inSpace > 0.08;
    (stars.material as PointsMaterial).opacity = 0.15 + inSpace * 0.85;
    stars.position.z = (travel * 1.6) % 40;

    const camShake = heat * 0.06;
    const camY =
      0.42 + (leave ? smoothstep(0, 0.5, Math.min(stage, 1)) * 0.15 : 0);
    const camZ = 3.35 - warp * 0.25;
    camera.position.set(
      Math.sin(now * 0.05) * camShake,
      camY + Math.cos(now * 0.07) * camShake,
      camZ,
    );
    camera.lookAt(0, 0.05, -1.2);
    camera.fov = 55 + warp * 8 + heat * 4;
    camera.updateProjectionMatrix();

    veilMat.color.copy(currentAtmo).lerp(currentHoriz, 0.4 + flash * 0.2);
    // 中盤は機体・炎・雲を見せ、閉じ終わり近くでページを完全に覆う
    const veilAmt = smoothstep(0.58, 0.97, cover);
    veilMat.opacity = clamp01(veilAmt * 0.96 + flash * 0.06);
    renderer.setClearColor(currentAtmo, clamp01(veilAmt * 0.88));

    const alt = enter
      ? Math.max(0.3, 240 * (1 - Math.min(stage, 1)) + 0.4)
      : leave
        ? 2 + Math.min(stage, 1) * 260
        : fly
          ? 8 + Math.sin(Math.min(stage, 1) * Math.PI) * 120
          : 100;
    const vel = 4 + warp * 22 + heat * 6;
    const hdg = (247 + travel * 3) % 360;
    hud.set([
      `ALT  ${alt.toFixed(1).padStart(6, " ")} KM`,
      `HDG  ${hdg.toFixed(1).padStart(6, " ")} DEG`,
      `VEL  ${vel.toFixed(1).padStart(6, " ")} KM/S`,
      `HEAT ${String(Math.round(heat * 100)).padStart(6, " ")} %`,
    ]);

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
      seedClouds();
    }
    canvas.style.visibility = "visible";
    hud.show();
    if (!rafId) {
      rafId = requestAnimationFrame(frame);
    }
  };

  const handleContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    stopLoop();
    canvas.style.visibility = "hidden";
    hud.hide();
    onContextLost();
  };
  canvas.addEventListener("webglcontextlost", handleContextLost);

  try {
    resize();
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
    setJourney(next, nextAtmo, nextHorizon, fromAtmo, fromHorizon) {
      journey = next;
      atmo.set(nextAtmo[0], nextAtmo[1], nextAtmo[2]);
      horizon.set(nextHorizon[0], nextHorizon[1], nextHorizon[2]);
      const prevA = fromAtmo ?? nextAtmo;
      const prevH = fromHorizon ?? nextHorizon;
      atmoPrev.set(prevA[0], prevA[1], prevA[2]);
      horizonPrev.set(prevH[0], prevH[1], prevH[2]);
    },
    hide() {
      goIdle();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stopLoop();
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      window.removeEventListener("resize", resize);
      hud.dispose();
      for (const item of disposables) item.dispose();
      renderer.dispose();
      if (!contextLost) {
        renderer.forceContextLoss();
      }
      canvas.remove();
    },
  };
}

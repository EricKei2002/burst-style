import {
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  DirectionalLight,
  DynamicDrawUsage,
  Group,
  HemisphereLight,
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  Vector3,
  WebGLRenderer,
  type Texture,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { WarpJourney } from "../../lib/planets";
import { createPlanetBody } from "./planetBody";
import { fbm, ridged } from "./proceduralNoise";
import { createShipModel } from "./shipModel";
import {
  createCloudAtlas,
  createCloudMaterial,
  createGlowShellMaterial,
  createSoftDot,
  createSoftPointsMaterial,
} from "./spaceshipFx";

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
  cloudTex: number;
  exhaust: number;
  /** 1 フレームにエンジン 1 基あたり出す排気粒の数 */
  exEmit: number;
  /** 影マップの解像度（0 なら影なし） */
  shadowMap: number;
  /** 地表メッシュの分割数 */
  groundSeg: number;
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
    return {
      quality: "low",
      dprCap: 1,
      stars: 280,
      clouds: 14,
      cloudTex: 128,
      exhaust: 64,
      exEmit: 1,
      shadowMap: 0,
      groundSeg: 40,
    };
  }
  if (mobile) {
    return {
      quality: "medium",
      dprCap: 1.25,
      stars: 700,
      clouds: 30,
      cloudTex: 256,
      exhaust: 130,
      exEmit: 1,
      shadowMap: 512,
      groundSeg: 72,
    };
  }
  return {
    quality: "high",
    dprCap: 1.5,
    stars: 1600,
    clouds: 60,
    cloudTex: 256,
    exhaust: 260,
    exEmit: 2,
    shadowMap: 1024,
    groundSeg: 128,
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

/** 降下先 / 離陸元の地表。fBm と尾根ノイズで起伏させた高分割の面 */
function createGround(
  seg: number,
  disposables: { dispose(): void }[],
): { mesh: Mesh; mat: MeshStandardMaterial } {
  const geo = track(disposables, new PlaneGeometry(90, 90, seg, seg));
  const pos = geo.attributes.position as BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const hills = fbm(x * 0.05, y * 0.05, 3, 5);
    const ridge = ridged(x * 0.03 + 7, y * 0.03, 11, 4);
    pos.setZ(i, (hills - 0.5) * 2.2 + ridge * ridge * 3.4);
  }
  geo.computeVertexNormals();
  const mat = track(
    disposables,
    new MeshStandardMaterial({
      color: 0x1a2030,
      roughness: 0.92,
      metalness: 0.04,
    }),
  );
  const mesh = new Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  return { mesh, mat };
}

function createStars(
  count: number,
  disposables: { dispose(): void }[],
  dot: Texture,
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
      size: 0.26,
      map: dot,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      toneMapped: false,
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
  // PBR のハイライトを白飛びさせず、ブランド色の色相は保つ
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  if (cfg.shadowMap > 0) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
  }
  host.appendChild(canvas);

  const disposables: { dispose(): void }[] = [];
  const scene = new Scene();
  const camera = new PerspectiveCamera(55, 1, 0.08, 400);
  camera.position.set(0, 0.42, 3.35);

  // 環境光：手続き生成の部屋を PMREM で畳み込み、金属・ガラスに映り込ませる
  let envTex: Texture | null = null;
  try {
    const pmrem = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    envTex = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    scene.environment = envTex;
    scene.environmentIntensity = 0.55;
    track(disposables, envTex);
  } catch {
    // 環境マップなしでもライトとリムで見える
  }

  const hemi = new HemisphereLight(0x9bd7ff, 0x1a1020, 0.55);
  scene.add(hemi);
  const key = new DirectionalLight(0xffffff, 2.2);
  key.position.set(2.4, 3.2, 2.2);
  if (cfg.shadowMap > 0) {
    // 機体だけを囲む狭い影カメラ（翼→ナセル、背骨→胴体の自己影）
    key.castShadow = true;
    key.shadow.mapSize.set(cfg.shadowMap, cfg.shadowMap);
    const sc = key.shadow.camera;
    sc.left = -1.3;
    sc.right = 1.3;
    sc.top = 1.3;
    sc.bottom = -1.3;
    sc.near = 0.5;
    sc.far = 9;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.012;
    key.shadow.radius = cfg.quality === "high" ? 3 : 1.5;
  }
  scene.add(key);
  scene.add(key.target);
  const rim = new DirectionalLight(0x67e8f9, 2.4);
  rim.position.set(-2.8, 0.6, -3.4);
  scene.add(rim);
  const heatLight = new PointLight(0xff6a1a, 0, 12, 2);
  scene.add(heatLight);
  const engineLight = new PointLight(0x67e8f9, 1.4, 8, 2);
  engineLight.position.set(0, 0, 1.1);
  scene.add(engineLight);

  const rimColor = { value: new Color(0x67e8f9) };
  const softDot = track(disposables, createSoftDot(32));
  const ship = createShipModel(cfg.quality, rimColor, softDot, disposables);
  // 居住リングと放熱板が画面に収まる大きさ（スマホ縦でも放熱板の先が切れない）
  ship.group.scale.setScalar(0.9);
  scene.add(ship.group);

  const stars = createStars(cfg.stars, disposables, softDot);
  scene.add(stars);

  // 目的地の惑星：高分割の球に、シェーダーの大陸・起伏・雲の殻・大気
  const planetBody = createPlanetBody({
    radius: 8,
    kind: "planet",
    quality: cfg.quality,
    seed: 2.3,
    cloudLayers: cfg.quality === "high" ? 2 : 1,
  });
  disposables.push(planetBody);
  const planet = planetBody.group;
  planet.position.set(0, -2, -60);
  scene.add(planet);
  // 惑星を回る衛星（低品質では省く）
  const moonBody =
    cfg.quality === "low"
      ? null
      : createPlanetBody({
          radius: 1.5,
          kind: "moon",
          quality: cfg.quality === "high" ? "medium" : "low",
          seed: 5.1,
        });
  if (moonBody) {
    disposables.push(moonBody);
    moonBody.group.position.set(-15, 6, 6);
    planet.add(moonBody.group);
    moonBody.setColors(
      new Color(0.16, 0.15, 0.15),
      new Color(0.55, 0.53, 0.5),
      new Color(0.5, 0.6, 0.7),
    );
  }
  const planetLow = new Color();
  const GRAY = new Color(0.32, 0.3, 0.3);
  const planetHigh = new Color();

  const groundParts = createGround(cfg.groundSeg, disposables);
  const ground = groundParts.mesh;
  const groundMat = groundParts.mat;
  ground.position.set(0, -6, -12);
  scene.add(ground);

  // 雲：ノイズで削った柔らかいパフ（2x2 アトラス）のビルボード。
  // 近づくと溶けるので、突き抜けるときも板の縁が見えない。
  const cloudAtlas = track(disposables, createCloudAtlas(cfg.cloudTex));
  const cloudGeo = track(disposables, new PlaneGeometry(3.6, 2.3));
  const cloudAlphaAttr = new InstancedBufferAttribute(
    new Float32Array(cfg.clouds),
    1,
  );
  const cloudVariantAttr = new InstancedBufferAttribute(
    new Float32Array(cfg.clouds),
    1,
  );
  cloudAlphaAttr.setUsage(DynamicDrawUsage);
  cloudVariantAttr.setUsage(DynamicDrawUsage);
  cloudGeo.setAttribute("aAlpha", cloudAlphaAttr);
  cloudGeo.setAttribute("aVariant", cloudVariantAttr);
  const cloudMat = track(disposables, createCloudMaterial(cloudAtlas));
  const clouds = new InstancedMesh(cloudGeo, cloudMat, cfg.clouds);
  clouds.instanceMatrix.setUsage(DynamicDrawUsage);
  clouds.frustumCulled = false;
  scene.add(clouds);
  const dummy = new Object3D();
  type CloudPuff = {
    x: number;
    y: number;
    z: number;
    s: number;
    roll: number;
    variant: number;
    alpha: number;
  };
  const cloudPos: CloudPuff[] = [];
  const respawnCloud = (c: CloudPuff, z: number) => {
    c.x = (Math.random() - 0.5) * 30;
    c.y = (Math.random() - 0.5) * 10;
    c.z = z;
    c.s = 0.8 + Math.random() * 2;
    c.roll = (Math.random() - 0.5) * 0.5;
    c.variant = Math.floor(Math.random() * 4);
    c.alpha = 0.55 + Math.random() * 0.45;
  };
  const seedClouds = () => {
    cloudPos.length = 0;
    for (let i = 0; i < cfg.clouds; i++) {
      const c: CloudPuff = {
        x: 0,
        y: 0,
        z: 0,
        s: 1,
        roll: 0,
        variant: 0,
        alpha: 1,
      };
      respawnCloud(c, -4 - Math.random() * 70);
      cloudPos.push(c);
    }
  };
  seedClouds();
  const byDepth = (a: CloudPuff, b: CloudPuff) => a.z - b.z;

  // 排気：丸いソフト粒子（加算）。古い粒ほど広がって薄くなり、尾を引く
  const exGeo = new BufferGeometry();
  // ノズルの数に比例して粒を確保する（多発でも尾が途中で切れない）
  const exCount = Math.round(
    cfg.exhaust * Math.max(1, ship.engines.length / 2),
  );
  const exPos = new Float32Array(exCount * 3);
  const exVel = new Float32Array(exCount * 3);
  const exCol = new Float32Array(exCount * 3);
  const exLife = new Float32Array(exCount).fill(1);
  const exSize = new Float32Array(exCount);
  const exSpan = new Float32Array(exCount).fill(1);
  const exPosAttr = new BufferAttribute(exPos, 3);
  const exColAttr = new BufferAttribute(exCol, 3);
  const exLifeAttr = new BufferAttribute(exLife, 1);
  const exSizeAttr = new BufferAttribute(exSize, 1);
  for (const attr of [exPosAttr, exColAttr, exLifeAttr, exSizeAttr]) {
    attr.setUsage(DynamicDrawUsage);
  }
  exGeo.setAttribute("position", exPosAttr);
  exGeo.setAttribute("aColor", exColAttr);
  exGeo.setAttribute("aLife", exLifeAttr);
  exGeo.setAttribute("aSize", exSizeAttr);
  track(disposables, exGeo);
  const exMat = track(disposables, createSoftPointsMaterial());
  const exhaust = new Points(exGeo, exMat);
  exhaust.frustumCulled = false;
  scene.add(exhaust);
  let exHead = 0;
  const prevEngine = ship.engines.map(() => new Vector3());
  let prevEngineValid = false;

  // ノズルの芯の光（機体に追従するソフト粒）
  const coreGeo = new BufferGeometry();
  const corePos = new Float32Array(ship.engines.length * 3);
  ship.engines.forEach((e, i) => {
    corePos[i * 3] = e.x;
    corePos[i * 3 + 1] = e.y;
    corePos[i * 3 + 2] = e.z + 0.02;
  });
  coreGeo.setAttribute("position", new BufferAttribute(corePos, 3));
  coreGeo.setAttribute(
    "aColor",
    new BufferAttribute(
      new Float32Array(ship.engines.flatMap(() => [0.45, 0.9, 1])),
      3,
    ),
  );
  coreGeo.setAttribute(
    "aLife",
    new BufferAttribute(new Float32Array(ship.engines.length), 1),
  );
  coreGeo.setAttribute(
    "aSize",
    // 多発では芯の光が重なって白飛びしないよう小さく
    new BufferAttribute(
      new Float32Array(ship.engines.length).fill(
        ship.engines.length > 2 ? 0.26 : 0.42,
      ),
      1,
    ),
  );
  track(disposables, coreGeo);
  const coreMat = track(disposables, createSoftPointsMaterial());
  const engineCore = new Points(coreGeo, coreMat);
  engineCore.frustumCulled = false;
  ship.group.add(engineCore);

  // ノズルから伸びる炎（縁はフレネルで溶ける）
  const plumeGeo = track(
    disposables,
    new ConeGeometry(0.048, 0.6, cfg.quality === "low" ? 8 : 14, 1, true),
  );
  const plumeMat = track(
    disposables,
    createGlowShellMaterial({ color: 0x22d3ee, mode: 0 }),
  );
  plumeMat.uniforms.uCore.value.setRGB(0.85, 0.97, 1);
  const plumes: Group[] = ship.engines.map((e) => {
    const holder = new Group();
    holder.position.set(e.x, e.y, e.z - 0.01);
    const cone = new Mesh(plumeGeo, plumeMat);
    // 先端（+Y）を後方 +Z へ
    cone.rotation.x = Math.PI / 2;
    cone.position.z = 0.3;
    holder.add(cone);
    ship.group.add(holder);
    return holder;
  });

  // 大気圏突入のプラズマ鞘：機首を先端に機体を包むように後方へ広がる
  const plasmaGeo = track(
    disposables,
    new ConeGeometry(1.25, 2.1, cfg.quality === "low" ? 16 : 40, 1, true),
  );
  const plasmaMat = track(
    disposables,
    createGlowShellMaterial({ color: 0xff7a2a, mode: 1 }),
  );
  plasmaMat.uniforms.uCore.value.setRGB(1, 0.92, 0.72);
  const plasma = new Mesh(plasmaGeo, plasmaMat);
  plasma.rotation.x = -Math.PI / 2;
  plasma.position.set(0, 0.01, -0.08);
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
      // 大気色そのままでページを覆う（トーンマップで色がずれない）
      toneMapped: false,
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
    exMat.uniforms.uViewportH.value = h * dpr;
    coreMat.uniforms.uViewportH.value = h * dpr;
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

  const hot = new Color(1, 0.48, 0.16);
  const cool = new Color(0.36, 0.86, 1);
  const exTint = new Color();
  const shipBack = new Vector3();
  const lerpVec = new Vector3();

  const layoutClouds = (
    speed: number,
    dt: number,
    density: number,
    climb: number,
    heat: number,
  ) => {
    for (let i = 0; i < cloudPos.length; i++) {
      const c = cloudPos[i];
      c.z += speed * dt;
      c.y += climb * dt;
      if (c.z > 4 || Math.abs(c.y) > 16) {
        // 遠方（フェードの外側）で生まれ直すので、ポップインしない
        respawnCloud(c, -46 - Math.random() * 28);
      }
    }
    // 半透明の重なりが破綻しないよう奥から描く
    cloudPos.sort(byDepth);
    const grow = 0.75 + density * 0.9;
    for (let i = 0; i < cloudPos.length; i++) {
      const c = cloudPos[i];
      dummy.position.set(c.x, c.y, c.z);
      dummy.lookAt(camera.position);
      dummy.rotateZ(c.roll);
      dummy.scale.set(c.s * grow, c.s * grow, 1);
      dummy.updateMatrix();
      clouds.setMatrixAt(i, dummy.matrix);
      cloudAlphaAttr.setX(i, c.alpha);
      cloudVariantAttr.setX(i, c.variant);
    }
    clouds.instanceMatrix.needsUpdate = true;
    cloudAlphaAttr.needsUpdate = true;
    cloudVariantAttr.needsUpdate = true;
    const u = cloudMat.uniforms;
    u.uOpacity.value = Math.min(0.95, 0.14 + density * 0.8);
    // 日の当たる上面は白寄り、陰は地平色へ。突入中は下面が炎で照らされる
    (u.uLit.value as Color).setRGB(1, 1, 1).lerp(currentAtmo, 0.18);
    (u.uShade.value as Color)
      .copy(currentHoriz)
      .multiplyScalar(0.38)
      .lerp(currentAtmo, 0.3);
    (u.uGlow.value as Color).copy(hot).multiplyScalar(heat * 0.6);
  };

  const writeExhaust = (heat: number, throttle: number, dt: number) => {
    // 既存の粒を進める（フレームレートに依存しない）
    for (let i = 0; i < exCount; i++) {
      if (exLife[i] >= 1) continue;
      exLife[i] = Math.min(1, exLife[i] + dt / exSpan[i]);
      exPos[i * 3] += exVel[i * 3] * dt;
      exPos[i * 3 + 1] += exVel[i * 3 + 1] * dt;
      exPos[i * 3 + 2] += exVel[i * 3 + 2] * dt;
    }
    if (throttle > 0.02) {
      shipBack.set(0, 0, 1).applyQuaternion(ship.group.quaternion);
      const speed = 1.6 + throttle * 2.6;
      exTint.copy(cool).lerp(hot, smoothstep(0.2, 0.6, heat));
      const spanScale = cfg.quality === "low" ? 0.6 : 1;
      ship.engines.forEach((local, e) => {
        worldEngine.copy(local);
        ship.group.localToWorld(worldEngine);
        for (let k = 0; k < cfg.exEmit; k++) {
          const i = exHead % exCount;
          exHead += 1;
          // 前フレームの位置との間に撒いて、点ではなく連続した尾にする
          const f = (k + Math.random()) / cfg.exEmit;
          if (prevEngineValid) {
            lerpVec.copy(prevEngine[e]).lerp(worldEngine, f);
          } else {
            lerpVec.copy(worldEngine);
          }
          exPos[i * 3] = lerpVec.x + (Math.random() - 0.5) * 0.02;
          exPos[i * 3 + 1] = lerpVec.y + (Math.random() - 0.5) * 0.02;
          exPos[i * 3 + 2] = lerpVec.z + Math.random() * 0.03;
          exVel[i * 3] = shipBack.x * speed + (Math.random() - 0.5) * 0.18;
          exVel[i * 3 + 1] = shipBack.y * speed + (Math.random() - 0.5) * 0.18;
          exVel[i * 3 + 2] = shipBack.z * speed + Math.random() * 0.4;
          const j = 0.85 + Math.random() * 0.15;
          exCol[i * 3] = exTint.r * j;
          exCol[i * 3 + 1] = exTint.g * j;
          exCol[i * 3 + 2] = exTint.b * j;
          exSize[i] = (0.045 + Math.random() * 0.03) * (1 + heat * 0.4);
          exSpan[i] = (0.4 + Math.random() * 0.35) * spanScale;
          exLife[i] = 0;
        }
        prevEngine[e].copy(worldEngine);
      });
      prevEngineValid = true;
    } else {
      prevEngineValid = false;
    }
    exPosAttr.needsUpdate = true;
    exColAttr.needsUpdate = true;
    exLifeAttr.needsUpdate = true;
    exSizeAttr.needsUpdate = true;
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

    // 閉じ始めの約 0.6 秒は機体をはっきり見せる。覆いと雲を遅らせ、
    // 閉じ終わり（duration の 96%）までには必ず全面を覆う
    const earlyHold =
      mode === "closing"
        ? smoothstep(
            Math.min(600, duration * 0.55),
            duration * 0.96,
            now - startAt,
          )
        : 1;

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
    // 低地は地平色を暗く、高地は地平色と大気色の中間
    // 強い光が当たるので彩度と明度を抑え、色は大気と雲に任せる
    planetLow.copy(currentHoriz).multiplyScalar(0.07).lerp(currentAtmo, 0.06);
    planetHigh
      .copy(currentHoriz)
      .lerp(currentAtmo, 0.3)
      .lerp(GRAY, 0.35)
      .multiplyScalar(0.38);
    planetBody.setColors(planetLow, planetHigh, currentAtmo);
    planetBody.setAtmosphere(0.75 + cover * 0.25);
    planetBody.update(now / 1000);
    if (moonBody) moonBody.update(now / 1000);
    groundMat.color
      .copy(currentHoriz)
      .multiplyScalar(0.55)
      .lerp(currentAtmo, 0.15);

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
        punch * 0.35) *
      (0.45 + 0.55 * earlyHold);
    const climbDir = leave ? 8 : enter ? -2 : 0;
    clouds.visible = cloudDensity > 0.04;
    if (clouds.visible) {
      layoutClouds(8 + warp * 55, dt, cloudDensity, climbDir * dt * 20, heat);
    }

    const secs = now / 1000;
    plasma.visible = heat > 0.01;
    plasmaMat.uniforms.uTime.value = secs;
    plasmaMat.uniforms.uOpacity.value =
      heat * (0.7 + 0.3 * (0.5 + 0.5 * Math.sin(now * 0.04)));
    (plasmaMat.uniforms.uColor.value as Color).setRGB(
      1,
      0.38 + (1 - heat) * 0.3,
      0.1 + leave * 0.4,
    );
    plasma.scale.set(1 + heat * 0.18, 1 + heat * 0.35, 1 + heat * 0.18);
    // 機体の縁は大気色、突入中は炎の色で照らされる
    rimColor.value
      .copy(currentAtmo)
      .multiplyScalar(0.55)
      .lerp(hot, clamp01(heat * 1.2));
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

    ship.group.updateMatrixWorld(true);
    const throttle = 0.4 + warp;
    writeExhaust(heat, throttle, dt);
    const flicker = 0.88 + 0.12 * Math.sin(now * 0.09) * Math.sin(now * 0.031);
    plumeMat.uniforms.uTime.value = secs;
    plumeMat.uniforms.uOpacity.value = (0.5 + throttle * 0.35) * flicker;
    for (const p of plumes) {
      p.scale.set(1, 1, 0.55 + throttle * 0.7 + (flicker - 0.88) * 1.5);
    }
    coreMat.uniforms.uOpacity.value = (0.75 + warp * 0.25) * flicker;

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
    const veilAmt = smoothstep(0.58, 0.97, cover) * earlyHold;
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
      exLife.fill(1);
      prevEngineValid = false;
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

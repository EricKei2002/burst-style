import {
  AnimationMixer,
  LoopOnce,
  LoopRepeat,
  TextureLoader,
  type AnimationAction,
  type AnimationClip,
  type AnimationMixerEventMap,
  type Material,
  type Mesh,
  type Object3D,
} from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  nextBlinkDelay,
  SONTA_CLIPS,
  SONTA_GLB_URL,
} from "../../lib/sontaMotion";

/**
 * Sontaくん GLB の共通ローダーと、アニメーションの組み立て。
 * 作品ページ（SontaShowcaseCanvas）とトップの宇宙背景（SontaDrift）の両方がここを使う。
 * - GLTFLoader は使うときに動的 import し、GLB の取得はページ内で 1 回だけ（Promise を共有）
 * - 材質は KHR_materials_unlit → MeshBasicMaterial。toneMapped=false にして、
 *   どのレンダラー（ACES / Neutral / トーンマップなし）でも GLB の色のまま出す
 */

let gltfPromise: Promise<GLTF> | null = null;

export function loadSontaGltf(): Promise<GLTF> {
  if (!gltfPromise) {
    const pending = (async () => {
      const { GLTFLoader } =
        await import("three/examples/jsm/loaders/GLTFLoader.js");
      const loader = new GLTFLoader();
      // GLB に埋め込まれた JPEG は blob: URL になる。既定の ImageBitmapLoader は fetch(blob:) を使い、
      // サイトの CSP（connect-src に blob: なし）で止まるので、<img> で読む TextureLoader に替える
      // （img-src は blob: を許可済み。CSP は緩めない）。色空間・flipY は GLTFLoader の既定のまま
      loader.register((parser) => {
        const textures = new TextureLoader(parser.options.manager);
        textures.setCrossOrigin(parser.options.crossOrigin);
        parser.textureLoader = textures;
        return { name: "sonta_img_textures" };
      });
      return loader.loadAsync(SONTA_GLB_URL);
    })();
    gltfPromise = pending;
    // 失敗したら次の呼び出しでやり直せるようにする
    pending.catch(() => {
      if (gltfPromise === pending) gltfPromise = null;
    });
  }
  return gltfPromise;
}

export type SontaRigOptions = {
  /** false：Idle の最初のフレームで止める（動きを減らす設定） */
  animate: boolean;
  /** 不定期の瞬きを重ねる */
  blink: boolean;
};

export type SontaRig = {
  root: Object3D;
  /** 毎フレーム呼ぶ（dt は秒） */
  update(dt: number): void;
  /** サムズアップを 1 回再生して Idle に戻る。再生を始めたら true */
  thumbsUp(): boolean;
  dispose(): void;
};

const FADE_IN_S = 0.25;
const FADE_BACK_S = 0.4;
/** 画面外から戻ったときなどに、アニメーションが一気に飛ばないようにする上限 */
const MAX_DT_S = 0.1;

function findClip(clips: AnimationClip[], name: string): AnimationClip | null {
  return clips.find((c) => c.name === name) ?? null;
}

/** 読み込み済みの GLB から、独立して動かせる Sontaくんを 1 体作る */
export async function createSontaRig(opts: SontaRigOptions): Promise<SontaRig> {
  const [gltf, { clone }] = await Promise.all([
    loadSontaGltf(),
    import("three/examples/jsm/utils/SkeletonUtils.js"),
  ]);
  // スキン付きなので SkeletonUtils で複製する（形状・材質・テクスチャは共有）
  const root = clone(gltf.scene);
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    // アニメーションで境界から外れても消えないように（1 体だけなので負荷は小さい）
    mesh.frustumCulled = false;
    const mats: Material[] = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const m of mats) m.toneMapped = false;
  });

  const mixer = new AnimationMixer(root);
  const idleClip = findClip(gltf.animations, SONTA_CLIPS.idle);
  const thumbsClip = findClip(gltf.animations, SONTA_CLIPS.thumbsUp);
  const blinkClip = findClip(gltf.animations, SONTA_CLIPS.blink);

  const idle = idleClip ? mixer.clipAction(idleClip) : null;
  idle?.setLoop(LoopRepeat, Infinity).play();

  if (!opts.animate) {
    // 最初のフレームの姿勢を当てたまま、以後は時間を進めない
    mixer.update(0);
    return {
      root,
      update() {},
      thumbsUp: () => false,
      dispose() {
        mixer.stopAllAction();
        mixer.uncacheRoot(root);
      },
    };
  }

  let thumbs: AnimationAction | null = null;
  if (thumbsClip) {
    thumbs = mixer.clipAction(thumbsClip);
    thumbs.setLoop(LoopOnce, 1);
    thumbs.clampWhenFinished = true;
  }
  let blink: AnimationAction | null = null;
  const blinkLength = blinkClip?.duration ?? 0;
  if (blinkClip && opts.blink) {
    blink = mixer.clipAction(blinkClip);
    blink.setLoop(LoopOnce, 1);
    // 終わったらまぶたは元の状態に戻る（Idle はまぶたを動かさないので重ねても干渉しない）
    blink.clampWhenFinished = false;
  }

  let thumbsPlaying = false;
  const onFinished = (e: AnimationMixerEventMap["finished"]) => {
    if (e.action !== thumbs || !thumbs || !idle) return;
    // 止めたままの最後の姿勢から Idle へなめらかに戻す
    idle.reset().play();
    thumbs.crossFadeTo(idle, FADE_BACK_S, false);
    thumbsPlaying = false;
  };
  mixer.addEventListener("finished", onFinished);

  // 最初の瞬きは少し早めに
  let blinkIn = nextBlinkDelay() * 0.5;

  return {
    root,
    update(dt) {
      const step = Math.min(Math.max(dt, 0), MAX_DT_S);
      if (blink) {
        blinkIn -= step;
        if (blinkIn <= 0) {
          blink.reset().play();
          blinkIn = nextBlinkDelay() + blinkLength;
        }
      }
      mixer.update(step);
    },
    thumbsUp() {
      if (!thumbs || !idle || thumbsPlaying) return false;
      thumbsPlaying = true;
      thumbs.reset().play();
      idle.crossFadeTo(thumbs, FADE_IN_S, false);
      return true;
    },
    dispose() {
      mixer.removeEventListener("finished", onFinished);
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
    },
  };
}

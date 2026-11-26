import {
  AnimationMixer,
  Euler,
  LoopOnce,
  LoopRepeat,
  Quaternion,
  TextureLoader,
  Vector3,
  type AnimationAction,
  type AnimationClip,
  type AnimationMixerEventMap,
  type Material,
  type Mesh,
  type Object3D,
} from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  createLookState,
  nextBlinkDelay,
  POINTER_IDLE_S,
  SONTA_CLIPS,
  SONTA_GLB_URL,
  SONTA_STATIC_LOOK,
  stepLook,
  THUMBS_ARM_GAIN,
  thumbsUpEnvelope,
  type SontaLook,
} from "../../lib/sontaMotion";

/**
 * Sontaくん GLB の共通ローダーと、アニメーションの組み立て。
 * 作品ページ（SontaShowcaseCanvas）とトップの宇宙背景（SontaDrift）の両方がここを使う。
 * - GLTFLoader は使うときに動的 import し、GLB の取得はページ内で 1 回だけ（Promise を共有）
 * - 材質は KHR_materials_unlit → MeshBasicMaterial。toneMapped=false にして、
 *   どのレンダラー（ACES / Neutral / トーンマップなし）でも GLB の色のまま出す
 */

let gltfPromise: Promise<GLTF> | null = null;

function loadSontaGltf(): Promise<GLTF> {
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

/** ポインターの位置（中心 0・端 ±1、x は右・y は上が正）。入力がなければ null */
export type SontaPointer = { nx: number; ny: number } | null;

export type SontaRig = {
  root: Object3D;
  /**
   * 毎フレーム呼ぶ（dt は秒）。向き（斜め 3/4＋スイング＋ポインター追従）と
   * サムズアップの強調もここで当てる（root の回転・位置・拡大率と、頭のボーン）
   */
  update(dt: number, pointer?: SontaPointer): void;
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

const amplified = new WeakMap<AnimationClip, AnimationClip>();

/**
 * A_ThumbsUp の右腕の回転を、クリップの最初の姿勢からのずれごと THUMBS_ARM_GAIN 倍にした複製。
 * キーの時刻はそのままなので、タイミングと Idle への戻りは元のクリップと同じ。GLB は変えない
 */
function amplifyThumbsClip(clip: AnimationClip): AnimationClip {
  const cached = amplified.get(clip);
  if (cached) return cached;
  const out = clip.clone();
  const q0 = new Quaternion();
  const qi = new Quaternion();
  const delta = new Quaternion();
  const axis = new Vector3();
  for (const track of out.tracks) {
    const dot = track.name.lastIndexOf(".");
    const bone = track.name.slice(0, dot);
    const gain = THUMBS_ARM_GAIN[bone];
    if (!gain || track.name.slice(dot + 1) !== "quaternion") continue;
    const v = track.values;
    q0.fromArray(v, 0);
    const q0inv = q0.clone().invert();
    for (let i = 0; i < v.length; i += 4) {
      qi.fromArray(v, i);
      delta.copy(q0inv).multiply(qi);
      if (delta.w < 0) delta.set(-delta.x, -delta.y, -delta.z, -delta.w);
      const angle = 2 * Math.acos(Math.min(1, delta.w));
      const s = Math.sqrt(Math.max(0, 1 - delta.w * delta.w));
      if (angle < 1e-5 || s < 1e-6) continue;
      axis.set(delta.x / s, delta.y / s, delta.z / s);
      delta.setFromAxisAngle(axis, angle * gain);
      qi.copy(q0).multiply(delta).toArray(v, i);
    }
  }
  amplified.set(clip, out);
  return out;
}

/**
 * ページ全体のポインター（マウス・ペン）を受け、最後の位置を覚えておく。
 * - リスナーは passive。React の再描画はしない（毎フレーム read で読む）
 * - タッチは acceptTouch が true を返したときだけ受ける（作品ページの枠の中だけ、など）
 * - 窓の外へ出た・タブを離れた・POINTER_IDLE_S 秒動かない、のどれかで null に戻る
 */
export function trackPointer(opts: {
  acceptTouch?(e: PointerEvent): boolean;
}): { read(): { x: number; y: number } | null; dispose(): void } {
  let x = 0;
  let y = 0;
  let at = -Infinity;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch" && !opts.acceptTouch?.(e)) return;
    x = e.clientX;
    y = e.clientY;
    at = performance.now();
  };
  const onOut = (e: PointerEvent) => {
    if (!e.relatedTarget && e.pointerType !== "touch") at = -Infinity;
  };
  const onBlur = () => {
    at = -Infinity;
  };
  const passive = { passive: true } as const;
  window.addEventListener("pointermove", onMove, passive);
  window.addEventListener("pointerdown", onMove, passive);
  document.addEventListener("pointerout", onOut, passive);
  window.addEventListener("blur", onBlur);
  return {
    read() {
      if (performance.now() - at > POINTER_IDLE_S * 1000) return null;
      return { x, y };
    },
    dispose() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.removeEventListener("pointerout", onOut);
      window.removeEventListener("blur", onBlur);
    },
  };
}

function applyLook(root: Object3D, look: SontaLook) {
  // Euler の XYZ 順：先に左右を向けてから、カメラに対して前へ傾ける
  root.rotation.set(look.pitch, look.bodyYaw, 0);
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
    // 最初のフレームの姿勢を当て、斜め 3/4 の向きで止める（正面にはしない）。以後は時間を進めない
    mixer.update(0);
    applyLook(root, SONTA_STATIC_LOOK);
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
    thumbs = mixer.clipAction(amplifyThumbsClip(thumbsClip));
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

  const head = root.getObjectByName("Head") ?? null;
  const look = createLookState();
  const headTurn = new Quaternion();
  const headEuler = new Euler(0, 0, 0, "YXZ");
  // スイングの位相。0 から始めると最初は基本の向き（27°）から振り始める
  let elapsed = 0;

  return {
    root,
    update(dt, pointer = null) {
      const step = Math.min(Math.max(dt, 0), MAX_DT_S);
      elapsed += step;
      if (blink) {
        blinkIn -= step;
        if (blinkIn <= 0) {
          blink.reset().play();
          blinkIn = nextBlinkDelay() + blinkLength;
        }
      }
      mixer.update(step);

      const env = thumbsUpEnvelope(
        thumbsPlaying && thumbs ? thumbs.time : null,
      );
      const l = stepLook(
        look,
        { t: elapsed, pointer, twist: env.twist, thumbs: env.amount },
        step,
      );
      applyLook(root, l);
      // サムズアップ：足元を支点に跳ね、縦に伸び縮み（横は体積をおおむね保つ）
      root.position.y = env.hop;
      const side = 1 / Math.sqrt(env.squashY);
      root.scale.set(side, env.squashY, side);
      if (head) {
        // ミキサーが当てた頭の回転に、追従ぶん（体より少し多め）と、かしげ・うなずきを足す。
        // 頭のボーンの軸はモデルの軸とそろっている（Y が上、Z が正面）
        headEuler.set(l.headPitch + env.headNod, l.headYaw, env.headRoll);
        head.quaternion.multiply(headTurn.setFromEuler(headEuler));
      }
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

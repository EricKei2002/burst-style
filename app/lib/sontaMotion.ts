/**
 * Sontaくん（3D モデル）の共通定義と、描画に依存しない動きの計算。
 * three を読み込まないので、テストやサーバー側からも安全に import できる。
 */

/** 作品ページとトップの宇宙背景で共用する GLB（public/models） */
export const SONTA_GLB_URL = "/models/sonta_v3.glb";

/** GLB に入っているアニメーション名 */
export const SONTA_CLIPS = {
  idle: "A_Idle",
  thumbsUp: "A_ThumbsUp",
  /** まぶた（Lid ボーン）だけを動かすので、Idle と同時に重ねて再生できる */
  blink: "A_Blink",
} as const;

/** モデルの高さ（GLB の頂点範囲 y=0〜1.22 から） */
export const SONTA_MODEL_HEIGHT = 1.22;

/** 瞬きの間隔（秒）。毎回この範囲で乱数にする */
export const BLINK_MIN_S = 2.5;
export const BLINK_MAX_S = 6;

/** 次の瞬きまでの秒数。random は 0 以上 1 未満（テスト用に差し替えられる） */
export function nextBlinkDelay(random: () => number = Math.random): number {
  const r = Math.min(Math.max(random(), 0), 1);
  return BLINK_MIN_S + (BLINK_MAX_S - BLINK_MIN_S) * r;
}

/** 線形 RGB（0..1）を sRGB の 0..255 にする（色の確認用） */
export function linearToSrgb255(c: number): number {
  const v = Math.min(Math.max(c, 0), 1);
  const s = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return Math.round(s * 255);
}

// ---------------------------------------------------------------------------
// 向き（斜め 3/4・左右のスイング・ポインター追従）
//
// 角度はすべてラジアン。yaw は「カメラの方を向いた正面」からの左右のずれで、正は
// 顔が画面の右を向く向き（モデルの右手＝サムズアップの手が手前に来る）。pitch は正で
// 頭の上がカメラ側へ傾く（ヘルメットの上面が見える）。
//
// v3 の顔テクスチャは正面 28° までが正確な正面投影で、それより横は引き伸ばされ、
// 75° を超えると崩れる。なので基本の向きは 27°、どんな入力でも 45° を超えないように切る。
// 一回転は横・後ろの崩れた顔が見えるので行わず、基本の向きを中心に左右へ振る。
// ---------------------------------------------------------------------------

const DEG = Math.PI / 180;

/** 基本の向き（斜め 3/4）。右手のサムズアップが手前に見える側 */
export const SONTA_BASE_YAW = 27 * DEG;
/** 体・頭とも、正面からこの角度より横は向かない（顔テクスチャが伸びすぎない範囲） */
export const SONTA_YAW_LIMIT = 45 * DEG;
/** 基本の前傾（ヘルメットの上面の丸みを見せる） */
export const SONTA_BASE_PITCH = 6 * DEG;
export const SONTA_PITCH_MIN = -6 * DEG;
export const SONTA_PITCH_MAX = 16 * DEG;
/** 左右のスイング：基本の向き ±15°、1 往復 8 秒（正弦なので両端で減速する） */
export const SWING_AMPLITUDE = 15 * DEG;
export const SWING_PERIOD_S = 8;
/** ポインター追従で足せる角度の上限 */
export const POINTER_YAW_CAP = 18 * DEG;
export const POINTER_PITCH_CAP = 10 * DEG;
/** 頭はポインターの方へ、体の向きにさらにこの割合だけ多く向く */
export const HEAD_FOLLOW_RATIO = 0.45;
/** 最後の入力からこの秒数たつか、ポインターが外へ出たら、自動のスイングへ戻る */
export const POINTER_IDLE_S = 2.5;
/** 減衰の速さ（1/秒。大きいほど速く追う）。フレームレートによらない指数の減衰 */
export const POINTER_LAMBDA = 6;
export const FOLLOW_IN_LAMBDA = 4;
export const FOLLOW_OUT_LAMBDA = 1.6;
/** 追従中はスイングをこの割合まで弱める（追従の向きを読みやすくする） */
const SWING_WHILE_FOLLOW = 0.35;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

/** yaw を ±limit に収める。数でない入力は基本の向きにする */
export function clampYaw(yaw: number, limit = SONTA_YAW_LIMIT): number {
  if (!Number.isFinite(yaw)) return clamp(SONTA_BASE_YAW, -limit, limit);
  return clamp(yaw, -limit, limit);
}

/** 基本の向きからの左右のずれ（t は秒） */
export function swingOffset(t: number): number {
  if (!Number.isFinite(t)) return 0;
  return SWING_AMPLITUDE * Math.sin((t / SWING_PERIOD_S) * Math.PI * 2);
}

/**
 * ポインターの位置 → 足す角度。nx / ny は対象の中心を 0、端を ±1 とした位置
 * （x は右、y は上が正。外側は ±1 で頭打ち）。右にあれば右を、上にあれば上を向く
 */
export function pointerToLook(
  nx: number,
  ny: number,
): { yaw: number; pitch: number } {
  const x = Number.isFinite(nx) ? clamp(nx, -1, 1) : 0;
  const y = Number.isFinite(ny) ? clamp(ny, -1, 1) : 0;
  return { yaw: POINTER_YAW_CAP * x, pitch: -POINTER_PITCH_CAP * y };
}

/** フレームレートによらない指数の減衰（THREE.MathUtils.damp と同じ式） */
export function damp(
  current: number,
  target: number,
  lambda: number,
  dt: number,
): number {
  if (!Number.isFinite(dt) || dt <= 0) return current;
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export type SontaLook = {
  /** 体（モデル全体）の向き */
  bodyYaw: number;
  pitch: number;
  /** 頭のボーンに、体の向きに加えて足す角度 */
  headYaw: number;
  headPitch: number;
};

export type SontaLookState = {
  /** なめらかにしたポインター由来の角度 */
  yaw: number;
  pitch: number;
  /** 追従の効き（0＝自動のスイングだけ、1＝追従） */
  weight: number;
};

export function createLookState(): SontaLookState {
  return { yaw: 0, pitch: 0, weight: 0 };
}

export type SontaLookInput = {
  /** 経過秒（スイングの位相） */
  t: number;
  /** ポインターの位置（pointerToLook と同じ座標）。入力がない・止まっている間は null */
  pointer: { nx: number; ny: number } | null;
  /** サムズアップ中のひねり（thumbsUpEnvelope の twist） */
  twist?: number;
  /** サムズアップの効き（0..1）。この間はスイングを弱める */
  thumbs?: number;
};

/** 動きを減らす設定の、静止した斜めの姿勢 */
export const SONTA_STATIC_LOOK: SontaLook = {
  bodyYaw: SONTA_BASE_YAW,
  pitch: SONTA_BASE_PITCH,
  headYaw: 0,
  headPitch: 0,
};

/**
 * 1 フレームぶん向きを進める（state を更新して、その時点の向きを返す）。
 * 体・頭とも、正面から SONTA_YAW_LIMIT を超えない
 */
export function stepLook(
  state: SontaLookState,
  input: SontaLookInput,
  dt: number,
): SontaLook {
  const active = input.pointer !== null;
  if (input.pointer) {
    const target = pointerToLook(input.pointer.nx, input.pointer.ny);
    state.yaw = damp(state.yaw, target.yaw, POINTER_LAMBDA, dt);
    state.pitch = damp(state.pitch, target.pitch, POINTER_LAMBDA, dt);
  }
  state.weight = damp(
    state.weight,
    active ? 1 : 0,
    active ? FOLLOW_IN_LAMBDA : FOLLOW_OUT_LAMBDA,
    dt,
  );
  // 途中で NaN などが入っても、次のフレームから戻れるようにする
  if (!Number.isFinite(state.yaw)) state.yaw = 0;
  if (!Number.isFinite(state.pitch)) state.pitch = 0;
  if (!Number.isFinite(state.weight)) state.weight = 0;
  state.yaw = clamp(state.yaw, -POINTER_YAW_CAP, POINTER_YAW_CAP);
  state.pitch = clamp(state.pitch, -POINTER_PITCH_CAP, POINTER_PITCH_CAP);
  state.weight = clamp(state.weight, 0, 1);
  return composeLook(state, input);
}

/** 基本の向き＋スイング＋追従＋ひねりを合わせ、上限で切る */
export function composeLook(
  state: SontaLookState,
  input: Pick<SontaLookInput, "t" | "twist" | "thumbs">,
): SontaLook {
  const w = clamp(Number.isFinite(state.weight) ? state.weight : 0, 0, 1);
  const thumbs = Number.isFinite(input.thumbs)
    ? clamp(input.thumbs ?? 0, 0, 1)
    : 0;
  const twist = Number.isFinite(input.twist) ? (input.twist ?? 0) : 0;
  const swing =
    swingOffset(input.t) *
    (1 - (1 - SWING_WHILE_FOLLOW) * w) *
    (1 - 0.5 * thumbs);
  const sy = Number.isFinite(state.yaw) ? state.yaw : 0;
  const sp = Number.isFinite(state.pitch) ? state.pitch : 0;
  const followYaw = clamp(sy, -POINTER_YAW_CAP, POINTER_YAW_CAP) * w;
  const followPitch = clamp(sp, -POINTER_PITCH_CAP, POINTER_PITCH_CAP) * w;
  const bodyYaw = clampYaw(SONTA_BASE_YAW + swing + followYaw + twist);
  // 頭は体よりもう少しポインターの方へ。ただし頭の向きも上限を超えない
  const headWorld = clampYaw(bodyYaw + followYaw * HEAD_FOLLOW_RATIO);
  return {
    bodyYaw,
    pitch: clamp(
      SONTA_BASE_PITCH + followPitch,
      SONTA_PITCH_MIN,
      SONTA_PITCH_MAX,
    ),
    headYaw: headWorld - bodyYaw,
    headPitch: followPitch * HEAD_FOLLOW_RATIO,
  };
}

// ---------------------------------------------------------------------------
// サムズアップの強調（GLB の A_ThumbsUp に、コード側で重ねる）
// ---------------------------------------------------------------------------

/** A_ThumbsUp の長さ（秒）。GLB のキーは 0〜2 秒 */
export const THUMBS_CLIP_S = 2;
/** 腕の回転を、クリップの最初の姿勢からのずれの何倍にするか */
export const THUMBS_ARM_GAIN: Readonly<Record<string, number>> = {
  UpperArm_R: 1.8,
  Forearm_R: 1.8,
  Hand_R: 1.5,
  Thumb_R: 1.5,
};
/** ぴょんと跳ねる高さ（モデルの高さ 1.22 に対して） */
export const THUMBS_HOP = 0.07;
/** 体をカメラの方へひねる角度（基本の向き 27° → 正面寄りへ） */
export const THUMBS_TWIST = -12 * DEG;
/** 頭をかしげる角度・うなずく角度 */
export const THUMBS_HEAD_ROLL = 9 * DEG;
export const THUMBS_HEAD_NOD = 5 * DEG;

export type ThumbsUpEnvelope = {
  /** 0..1。腕を上げてから下ろすまでの効き */
  amount: number;
  /** 体を持ち上げる高さ（モデルの単位） */
  hop: number;
  /** 縦の拡大率（1＝そのまま）。横は 1/√squashY で体積をおおむね保つ */
  squashY: number;
  twist: number;
  headRoll: number;
  headNod: number;
};

export const THUMBS_REST: ThumbsUpEnvelope = {
  amount: 0,
  hop: 0,
  squashY: 1,
  twist: 0,
  headRoll: 0,
  headNod: 0,
};

function smoothstep(e0: number, e1: number, x: number): number {
  const u = clamp((x - e0) / (e1 - e0), 0, 1);
  return u * u * (3 - 2 * u);
}

/** e0〜e1 の区間だけ山になる（両端で 0、中央で 1） */
function bump(e0: number, e1: number, x: number): number {
  if (x <= e0 || x >= e1) return 0;
  return Math.sin(((x - e0) / (e1 - e0)) * Math.PI);
}

/**
 * サムズアップの強調の量。t はクリップの再生時間（秒、null は再生していない）。
 * クリップの動き（0.25 秒で沈み、0.5 秒で腕が上がり、1.5 秒まで保ち、1.9 秒で戻る）に合わせる。
 * 0 秒と 2 秒では何も足さないので、Idle からも Idle へも途切れずにつながる
 */
export function thumbsUpEnvelope(t: number | null): ThumbsUpEnvelope {
  if (t === null || !Number.isFinite(t) || t <= 0 || t >= THUMBS_CLIP_S) {
    return THUMBS_REST;
  }
  const amount = smoothstep(0.15, 0.55, t) * (1 - smoothstep(1.4, 1.9, t));
  // 0.1〜0.4 秒で少し縮んでため、0.35〜0.85 秒で跳ねて伸び、0.8〜1.1 秒の着地で少し縮む
  const crouch = bump(0.1, 0.4, t);
  const hop = bump(0.35, 0.85, t);
  const land = bump(0.8, 1.1, t);
  return {
    amount,
    hop: THUMBS_HOP * hop,
    squashY: 1 - 0.05 * crouch + 0.035 * hop - 0.03 * land,
    twist: THUMBS_TWIST * amount,
    headRoll: THUMBS_HEAD_ROLL * amount,
    headNod: THUMBS_HEAD_NOD * bump(0.4, 1.5, t),
  };
}

// ---------------------------------------------------------------------------
// トップの宇宙背景で漂う位置
// ---------------------------------------------------------------------------

export type SontaDriftPose = {
  /** 画面上の位置（-1..1 の正規化座標。x は右、y は上が正） */
  ndcX: number;
  ndcY: number;
  /** 画面の高さに対するモデルの高さの割合 */
  heightFrac: number;
  /** 漂いに合わせた小さな揺れ（ラジアン）。左右の向きは stepLook が受け持つ */
  rotX: number;
  rotZ: number;
};

export type SontaDriftArea = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  height: number;
};

/**
 * 横長と縦長（スマホ）の漂う範囲。本文のパネルは中央（1440 幅で x≈±0.7 まで）に来るので、
 * 横長は右の余白を縦に行き来する。縦長（390×844）は、本文のカードの下・「My Skills」の左・
 * 「Skip to work index」とボトムナビの上の、すき間（CSS で x≈30〜108、y≈660〜750）に小さく置く
 */
const WIDE: SontaDriftArea = {
  xMin: 0.79,
  xMax: 0.85,
  yMin: -0.62,
  yMax: 0.45,
  height: 0.15,
};
const TALL: SontaDriftArea = {
  xMin: -0.68,
  xMax: -0.655,
  yMin: -0.69,
  yMax: -0.65,
  height: 0.07,
};

/** ゆっくり漂う周期（秒）。互いに割り切れない値で、同じ軌跡を繰り返しにくくする */
const DRIFT_X_PERIOD_S = 47;
const DRIFT_Y_PERIOD_S = 31;
const BOB_PERIOD_S = 4.2;

/** 画面の縦横比に応じた漂う範囲 */
export function sontaDriftArea(aspect: number): SontaDriftArea {
  return aspect < 1 ? TALL : WIDE;
}

/**
 * 宇宙背景の Sontaくんの姿勢。t は経過秒、aspect は画面の幅 / 高さ。
 * - 範囲の中をリサジュー曲線でゆっくり行き来し、上下に小さく揺れる（左右の向きは stepLook）
 * - reduced（動きを減らす設定）のときは t を無視して、範囲の中ほどに静止させる
 */
export function sontaDriftPose(
  t: number,
  aspect: number,
  reduced = false,
): SontaDriftPose {
  const area = sontaDriftArea(aspect);
  const midX = (area.xMin + area.xMax) / 2;
  const midY = (area.yMin + area.yMax) / 2;
  const halfX = (area.xMax - area.xMin) / 2;
  const halfY = (area.yMax - area.yMin) / 2;
  if (reduced) {
    return {
      ndcX: midX,
      ndcY: midY,
      heightFrac: area.height,
      rotX: 0,
      rotZ: 0,
    };
  }
  const tau = Math.PI * 2;
  // 上下の揺れの分（halfY の 12%）を残して漂うので、範囲の外へははみ出さない
  const bob = Math.sin((t / BOB_PERIOD_S) * tau) * halfY * 0.12;
  return {
    ndcX: midX + Math.sin((t / DRIFT_X_PERIOD_S) * tau) * halfX,
    ndcY:
      midY + Math.sin((t / DRIFT_Y_PERIOD_S) * tau + 0.9) * halfY * 0.88 + bob,
    heightFrac: area.height,
    rotX: Math.sin((t / BOB_PERIOD_S) * tau + 1.3) * 0.03,
    rotZ: Math.sin((t / DRIFT_X_PERIOD_S) * tau * 2) * 0.1,
  };
}

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

export type SontaDriftPose = {
  /** 画面上の位置（-1..1 の正規化座標。x は右、y は上が正） */
  ndcX: number;
  ndcY: number;
  /** 画面の高さに対するモデルの高さの割合 */
  heightFrac: number;
  /** 回転（ラジアン）。rotY は「カメラの方を向く向き」からのずれ（負で画面の中央側を向く） */
  rotX: number;
  rotY: number;
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
 * 横長は右の余白を縦に行き来し、縦長は下の角を使う
 */
const WIDE: SontaDriftArea = {
  xMin: 0.79,
  xMax: 0.85,
  yMin: -0.62,
  yMax: 0.45,
  height: 0.15,
};
const TALL: SontaDriftArea = {
  xMin: 0.62,
  xMax: 0.74,
  yMin: -0.84,
  yMax: -0.68,
  height: 0.09,
};

/** ゆっくり漂う周期（秒）。互いに割り切れない値で、同じ軌跡を繰り返しにくくする */
const DRIFT_X_PERIOD_S = 47;
const DRIFT_Y_PERIOD_S = 31;
const BOB_PERIOD_S = 4.2;
const SPIN_PERIOD_S = 23;

/** 画面の縦横比に応じた漂う範囲 */
export function sontaDriftArea(aspect: number): SontaDriftArea {
  return aspect < 1 ? TALL : WIDE;
}

/**
 * 宇宙背景の Sontaくんの姿勢。t は経過秒、aspect は画面の幅 / 高さ。
 * - 範囲の中をリサジュー曲線でゆっくり行き来し、上下に小さく揺れ、ゆっくり向きを変える
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
      rotX: 0.08,
      rotY: -0.25,
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
    rotX: 0.08 + Math.sin((t / BOB_PERIOD_S) * tau + 1.3) * 0.05,
    rotY: -0.25 + Math.sin((t / SPIN_PERIOD_S) * tau) * 0.45,
    rotZ: Math.sin((t / DRIFT_X_PERIOD_S) * tau * 2) * 0.12,
  };
}

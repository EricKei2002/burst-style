import { HANGAR_NAVIGATE_AFTER_CLOSE_MS } from "./hangarTransitionTiming";

/** ページ遷移で画面を覆う演出の種類（none は覆わずにそのまま切り替える） */
export type PageTransitionOverlay = "hangar" | "shader" | "none";

/** ワープで閉じる（加速して覆う）長さ（ms） */
export const SHADER_WARP_CLOSE_MS = 1400;

/** 覆い終わってから router.push するまでの待機（ワープ + 小さな余白） */
export const SHADER_NAVIGATE_AFTER_CLOSE_MS = SHADER_WARP_CLOSE_MS + 180;

/** 遷移先で開き始める前に覆ったまま待つ時間 */
export const SHADER_OPEN_PAUSE_MS = 280;

/** ワープから抜けて新しいページを見せる長さ（ms） */
export const SHADER_WARP_OPEN_MS = 1200;

/** opening フェーズから idle に戻るまで */
export const SHADER_OPEN_TO_IDLE_MS = SHADER_WARP_OPEN_MS + 60;

/** 戻る/進む（popstate など）で、覆った状態から開く演出の長さ */
export const SHADER_WARP_REVEAL_MS = 1400;

/** 惑星同士を飛び移るときの閉じる長さ（突入より短く） */
export const SHADER_FLY_CLOSE_MS = 900;

export const SHADER_FLY_NAVIGATE_AFTER_CLOSE_MS = SHADER_FLY_CLOSE_MS + 140;

export const SHADER_FLY_OPEN_MS = 800;

export const SHADER_FLY_OPEN_TO_IDLE_MS = SHADER_FLY_OPEN_MS + 60;

/**
 * シェーダーが使えて動きが許可されているときだけワープを選ぶ。
 * それ以外は fallback（既定はハンガー扉、ワープ単独のときは none = 普通の切り替え）。
 */
export function pickPageTransitionOverlay(opts: {
  shaderReady: boolean;
  reducedMotion: boolean;
  fallback?: Exclude<PageTransitionOverlay, "shader">;
}): PageTransitionOverlay {
  if (opts.shaderReady && !opts.reducedMotion) return "shader";
  return opts.fallback ?? "hangar";
}

/** 閉じ始めてから router.push するまでの待機 */
export function navigateDelayFor(overlay: PageTransitionOverlay): number {
  if (overlay === "shader") return SHADER_NAVIGATE_AFTER_CLOSE_MS;
  if (overlay === "hangar") return HANGAR_NAVIGATE_AFTER_CLOSE_MS;
  return 0;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

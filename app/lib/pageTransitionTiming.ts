import { HANGAR_NAVIGATE_AFTER_CLOSE_MS } from "./hangarTransitionTiming";

/** ページ遷移で画面を覆う演出の種類 */
export type PageTransitionOverlay = "hangar" | "shader";

/** ワープで閉じる（加速して覆う）長さ（ms） */
export const SHADER_WARP_CLOSE_MS = 700;

/** 覆い終わってから router.push するまでの待機（ワープ + 小さな余白） */
export const SHADER_NAVIGATE_AFTER_CLOSE_MS = SHADER_WARP_CLOSE_MS + 40;

/** 遷移先で開き始める前に覆ったまま待つ時間 */
export const SHADER_OPEN_PAUSE_MS = 180;

/** ワープから抜けて新しいページを見せる長さ（ms） */
export const SHADER_WARP_OPEN_MS = 700;

/** opening フェーズから idle に戻るまで */
export const SHADER_OPEN_TO_IDLE_MS = SHADER_WARP_OPEN_MS + 40;

/** 戻る/進む（popstate など）で経路が変わったときの短い開き演出 */
export const SHADER_WARP_REVEAL_MS = 480;

/** シェーダーが使えて動きが許可されているときだけワープを選ぶ */
export function pickPageTransitionOverlay(opts: {
  shaderReady: boolean;
  reducedMotion: boolean;
}): PageTransitionOverlay {
  return opts.shaderReady && !opts.reducedMotion ? "shader" : "hangar";
}

/** 閉じ始めてから router.push するまでの待機 */
export function navigateDelayFor(overlay: PageTransitionOverlay): number {
  return overlay === "shader"
    ? SHADER_NAVIGATE_AFTER_CLOSE_MS
    : HANGAR_NAVIGATE_AFTER_CLOSE_MS;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

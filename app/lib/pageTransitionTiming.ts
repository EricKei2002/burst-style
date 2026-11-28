/** ページ遷移の演出（shader はワープ、none は覆わずにそのまま切り替える） */
export type PageTransitionOverlay = "shader" | "none";

/** ワープで閉じる（加速して覆う）長さ（ms） */
export const SHADER_WARP_CLOSE_MS = 1000;

/** 覆い終わってから router.push するまでの待機（ワープ + 小さな余白） */
export const SHADER_NAVIGATE_AFTER_CLOSE_MS = SHADER_WARP_CLOSE_MS + 120;

/** 遷移先で開き始める前に覆ったまま待つ時間 */
export const SHADER_OPEN_PAUSE_MS = 200;

/** ワープから抜けて新しいページを見せる長さ（ms） */
export const SHADER_WARP_OPEN_MS = 850;

/** opening フェーズから idle に戻るまで */
export const SHADER_OPEN_TO_IDLE_MS = SHADER_WARP_OPEN_MS + 60;

/** シェーダーが使えて動きが許可されているときだけワープを選ぶ */
export function pickPageTransitionOverlay(opts: {
  shaderReady: boolean;
  reducedMotion: boolean;
}): PageTransitionOverlay {
  return opts.shaderReady && !opts.reducedMotion ? "shader" : "none";
}

/** 閉じ始めてから router.push するまでの待機 */
export function navigateDelayFor(overlay: PageTransitionOverlay): number {
  return overlay === "shader" ? SHADER_NAVIGATE_AFTER_CLOSE_MS : 0;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

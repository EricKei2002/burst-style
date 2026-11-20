// three・ワープのシェーダーは動的 import のみで読み込む（初期 JS に含めない）。
// 宇宙船シーンのローダーは SpaceshipPageTransition 側に置き、フラグが false なら読み込まれない
type ShaderWarpModule =
  typeof import("../components/visuals/shaderWarpOverlay");

let modulePromise: Promise<ShaderWarpModule> | null = null;
const intentListeners = new Set<(urgent: boolean) => void>();

/** ワープ遷移モジュールを読み込む（多重呼び出し可・失敗時は再試行可能） */
export function loadShaderTransitionModule(): Promise<ShaderWarpModule> {
  if (!modulePromise) {
    modulePromise = import("../components/visuals/shaderWarpOverlay").catch(
      (error: unknown) => {
        modulePromise = null;
        throw error;
      },
    );
  }
  return modulePromise;
}

/**
 * 遷移の意図（メニューやカードへのポインター接近・フォーカス・押下・キー）で
 * 遷移演出の準備を前倒しする。urgent=true なら空き時間を待たずに分割初期化を急ぐ。
 * 実際の初期化は ShaderPageTransition が受け持つ。
 */
export function preloadShaderTransition(urgent = true): void {
  if (typeof window === "undefined") {
    return;
  }
  intentListeners.forEach((listener) => listener(urgent));
}

/** ShaderPageTransition が先読み要求を受け取るための購読 */
export function onShaderTransitionIntent(
  listener: (urgent: boolean) => void,
): () => void {
  intentListeners.add(listener);
  return () => {
    intentListeners.delete(listener);
  };
}

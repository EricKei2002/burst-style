// three・宇宙船シーン本体は動的 import のみで読み込む（初期 JS に含めない）
type ShaderWarpModule = typeof import("../components/visuals/spaceshipOverlay");

let modulePromise: Promise<ShaderWarpModule> | null = null;
const intentListeners = new Set<() => void>();

/** 宇宙船遷移モジュールを読み込む（多重呼び出し可・失敗時は再試行可能） */
export function loadShaderTransitionModule(): Promise<ShaderWarpModule> {
  if (!modulePromise) {
    modulePromise = import("../components/visuals/spaceshipOverlay").catch(
      (error: unknown) => {
        modulePromise = null;
        throw error;
      },
    );
  }
  return modulePromise;
}

/**
 * 遷移の意図（カードやボタンへのポインター進入）で宇宙船演出を先読みする。
 * 実際の初期化は ShaderPageTransition が受け持つ。
 */
export function preloadShaderTransition(): void {
  if (typeof window === "undefined") {
    return;
  }
  intentListeners.forEach((listener) => listener());
}

/** ShaderPageTransition が先読み要求を受け取るための購読 */
export function onShaderTransitionIntent(listener: () => void): () => void {
  intentListeners.add(listener);
  return () => {
    intentListeners.delete(listener);
  };
}

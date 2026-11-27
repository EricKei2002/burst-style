import { create } from "zustand";
import {
  SHADER_NAVIGATE_AFTER_CLOSE_MS,
  SHADER_OPEN_PAUSE_MS,
  SHADER_OPEN_TO_IDLE_MS,
  navigateDelayFor,
  pickPageTransitionOverlay,
  prefersReducedMotion,
  type PageTransitionOverlay,
} from "./pageTransitionTiming";

type TransitionPhase = "idle" | "closing" | "closed" | "opening";

interface TransitionState {
  phase: TransitionPhase;
  setPhase: (phase: TransitionPhase) => void;
  /** シェーダー遷移の読み込み・初期化が済み、すぐ再生できる */
  shaderReady: boolean;
  setShaderReady: (ready: boolean) => void;
  /** WebGL が使えずシェーダー遷移を作れないと分かった（以後は待たない） */
  shaderUnavailable: boolean;
  setShaderUnavailable: () => void;
  /** 現在（直近）の遷移で画面を覆う演出。closing 開始時に決める */
  overlay: PageTransitionOverlay;
  setOverlay: (overlay: PageTransitionOverlay) => void;
}

export const useTransitionStore = create<TransitionState>((set) => ({
  phase: "idle",
  setPhase: (phase) => set({ phase }),
  shaderReady: false,
  setShaderReady: (shaderReady) => set({ shaderReady }),
  shaderUnavailable: false,
  setShaderUnavailable: () => set({ shaderUnavailable: true }),
  overlay: "none",
  setOverlay: (overlay) => set({ overlay }),
}));

/** クリック時点で未準備なら、この時間まで読み込み完了を待つ */
export const SHADER_READY_WAIT_MS = 1000;

/**
 * shaderReady になるまで待つ。timeout 後は現在値を返す。
 * 使えないと分かっているときは待たない。
 */
export function waitForShaderReady(
  timeoutMs = SHADER_READY_WAIT_MS,
): Promise<boolean> {
  const { shaderReady, shaderUnavailable } = useTransitionStore.getState();
  if (shaderReady || shaderUnavailable) {
    return Promise.resolve(shaderReady);
  }
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      unsubscribe();
      resolve(useTransitionStore.getState().shaderReady);
    }, timeoutMs);
    const unsubscribe = useTransitionStore.subscribe((state) => {
      if (state.shaderReady || state.shaderUnavailable) {
        window.clearTimeout(timeout);
        unsubscribe();
        resolve(state.shaderReady);
      }
    });
  });
}

/**
 * ページ離脱の演出を開始し、router.push までの待機（ms）を返す。
 * シェーダーがまだなら短い時間だけ待ち、使えなければ覆わずに切り替える。
 */
export async function beginLeaveTransition(): Promise<number> {
  let { shaderReady } = useTransitionStore.getState();
  if (!shaderReady && !prefersReducedMotion()) {
    shaderReady = await waitForShaderReady(SHADER_READY_WAIT_MS);
  }
  const { setOverlay, setPhase } = useTransitionStore.getState();
  const overlay = pickPageTransitionOverlay({
    shaderReady,
    reducedMotion: prefersReducedMotion(),
  });
  setOverlay(overlay);
  setPhase("closing");
  return navigateDelayFor(overlay);
}

/** ホーム内セクション切り替え用。shaderReady 前提。履歴は遅らせない。 */
export function startSectionWarp(): number {
  const { setOverlay, setPhase } = useTransitionStore.getState();
  setOverlay("shader");
  setPhase("closing");
  return SHADER_NAVIGATE_AFTER_CLOSE_MS;
}

/** セクションを差し替えたあと、覆いから開いて idle に戻す。 */
export function scheduleSectionWarpOpen(): { openAt: number; idleAt: number } {
  return { openAt: SHADER_OPEN_PAUSE_MS, idleAt: SHADER_OPEN_TO_IDLE_MS };
}

export function beginSectionWarpOpen(): void {
  useTransitionStore.getState().setPhase("opening");
}

export function endSectionWarp(): void {
  useTransitionStore.getState().setPhase("idle");
}

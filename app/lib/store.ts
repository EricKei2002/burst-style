import { create } from "zustand";
import {
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
  /** 現在（直近）の遷移で画面を覆う演出。closing 開始時に決める */
  overlay: PageTransitionOverlay;
  setOverlay: (overlay: PageTransitionOverlay) => void;
}

export const useTransitionStore = create<TransitionState>((set) => ({
  phase: "idle",
  setPhase: (phase) => set({ phase }),
  shaderReady: false,
  setShaderReady: (shaderReady) => set({ shaderReady }),
  overlay: "hangar",
  setOverlay: (overlay) => set({ overlay }),
}));

/** クリック時点で未準備なら、この時間まで読み込み完了を待つ */
export const SHADER_READY_WAIT_MS = 1000;

/**
 * shaderReady になるまで待つ。timeout 後は現在値を返す。
 */
export function waitForShaderReady(
  timeoutMs = SHADER_READY_WAIT_MS,
): Promise<boolean> {
  if (useTransitionStore.getState().shaderReady) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      unsubscribe();
      resolve(useTransitionStore.getState().shaderReady);
    }, timeoutMs);
    const unsubscribe = useTransitionStore.subscribe((state) => {
      if (state.shaderReady) {
        window.clearTimeout(timeout);
        unsubscribe();
        resolve(true);
      }
    });
  });
}

/**
 * ページ離脱の演出を開始し、router.push までの待機（ms）を返す。
 * シェーダーがまだなら短い時間だけ待ち、使えなければ従来どおりハンガー扉。
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

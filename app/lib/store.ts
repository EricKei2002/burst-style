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

/**
 * ページ離脱の演出を開始し、router.push までの待機（ms）を返す。
 * シェーダーが使えなければ従来どおりハンガー扉。
 */
export function beginLeaveTransition(): number {
  const { shaderReady, setOverlay, setPhase } = useTransitionStore.getState();
  const overlay = pickPageTransitionOverlay({
    shaderReady,
    reducedMotion: prefersReducedMotion(),
  });
  setOverlay(overlay);
  setPhase("closing");
  return navigateDelayFor(overlay);
}

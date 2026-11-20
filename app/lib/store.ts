import { create } from "zustand";
import { SPACESHIP_TRANSITIONS_ENABLED } from "./featureFlags";
import {
  SHADER_FLY_NAVIGATE_AFTER_CLOSE_MS,
  SHADER_FLY_OPEN_TO_IDLE_MS,
  SHADER_NAVIGATE_AFTER_CLOSE_MS,
  SHADER_OPEN_PAUSE_MS,
  SHADER_OPEN_TO_IDLE_MS,
  navigateDelayFor,
  pickPageTransitionOverlay,
  prefersReducedMotion,
  type PageTransitionOverlay,
} from "./pageTransitionTiming";
import type { WarpJourney } from "./planets";

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
  /** ホーム↔惑星の突入 / 離脱 / 惑星間の飛び移り。closing 開始時に決める */
  warpJourney: WarpJourney;
  warpPlanetId: string | null;
  warpFromPlanetId: string | null;
  setWarpContext: (
    journey: WarpJourney,
    planetId: string | null,
    fromPlanetId?: string | null,
  ) => void;
}

export const useTransitionStore = create<TransitionState>((set) => ({
  phase: "idle",
  setPhase: (phase) => set({ phase }),
  shaderReady: false,
  setShaderReady: (shaderReady) => set({ shaderReady }),
  overlay: "hangar",
  setOverlay: (overlay) => set({ overlay }),
  warpJourney: "neutral",
  warpPlanetId: null,
  warpFromPlanetId: null,
  setWarpContext: (warpJourney, warpPlanetId, warpFromPlanetId = null) =>
    set({ warpJourney, warpPlanetId, warpFromPlanetId }),
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
 * ワープが使えないときの代わり。宇宙船を止めている間は覆わずに普通に切り替える
 * （ハンガー扉は宇宙船の遷移と組で使っていたため、フラグを戻したときだけ出す）。
 */
const LEAVE_FALLBACK = SPACESHIP_TRANSITIONS_ENABLED ? "hangar" : "none";

/**
 * ページ離脱の演出を開始し、router.push までの待機（ms）を返す。
 * シェーダーがまだなら短い時間だけ待ち、使えなければ LEAVE_FALLBACK。
 */
export async function beginLeaveTransition(opts?: {
  journey?: WarpJourney;
  planetId?: string | null;
  fromPlanetId?: string | null;
}): Promise<number> {
  let { shaderReady } = useTransitionStore.getState();
  if (!shaderReady && !prefersReducedMotion()) {
    shaderReady = await waitForShaderReady(SHADER_READY_WAIT_MS);
  }
  const { setOverlay, setPhase, setWarpContext } =
    useTransitionStore.getState();
  setWarpContext(
    opts?.journey ?? "neutral",
    opts?.planetId ?? null,
    opts?.fromPlanetId ?? null,
  );
  const overlay = pickPageTransitionOverlay({
    shaderReady,
    reducedMotion: prefersReducedMotion(),
    fallback: LEAVE_FALLBACK,
  });
  setOverlay(overlay);
  setPhase("closing");
  return navigateDelayFor(overlay);
}

/** ホーム内セクション切り替え用。shaderReady 前提。履歴は遅らせない。 */
export function startSectionWarp(opts: {
  journey: WarpJourney;
  planetId: string | null;
  fromPlanetId?: string | null;
}): number {
  const { setOverlay, setPhase, setWarpContext } =
    useTransitionStore.getState();
  setWarpContext(opts.journey, opts.planetId, opts.fromPlanetId ?? null);
  setOverlay("shader");
  setPhase("closing");
  return opts.journey === "fly-between"
    ? SHADER_FLY_NAVIGATE_AFTER_CLOSE_MS
    : SHADER_NAVIGATE_AFTER_CLOSE_MS;
}

/** セクションを差し替えたあと、覆いから開いて idle に戻す。 */
export function scheduleSectionWarpOpen(journey: WarpJourney): {
  openAt: number;
  idleAt: number;
} {
  const openToIdle =
    journey === "fly-between"
      ? SHADER_FLY_OPEN_TO_IDLE_MS
      : SHADER_OPEN_TO_IDLE_MS;
  return { openAt: SHADER_OPEN_PAUSE_MS, idleAt: openToIdle };
}

export function beginSectionWarpOpen(): void {
  useTransitionStore.getState().setPhase("opening");
}

export function endSectionWarp(): void {
  useTransitionStore.getState().setPhase("idle");
}

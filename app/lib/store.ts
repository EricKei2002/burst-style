import { create } from 'zustand';

type TransitionPhase = 'idle' | 'closing' | 'closed' | 'opening';

interface TransitionState {
  phase: TransitionPhase;
  setPhase: (phase: TransitionPhase) => void;
}

export const useTransitionStore = create<TransitionState>((set) => ({
  phase: 'idle',
  setPhase: (phase) => set({ phase }),
}));

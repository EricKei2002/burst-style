/** ハンガー扉 CSS transform の長さ（ms） */
export const HANGAR_DOOR_CLOSE_MS = 550;

/** 扉が閉まってから router.push するまでの待機（扉アニメ + 小さな余白） */
export const HANGAR_NAVIGATE_AFTER_CLOSE_MS = HANGAR_DOOR_CLOSE_MS + 80;

/** 遷移先で扉を開く前に黒画面を維持する時間 */
export const HANGAR_OPEN_PAUSE_MS = 200;

/** opening フェーズから idle に戻るまで（開扉 CSS と同期） */
export const HANGAR_OPEN_TO_IDLE_MS = HANGAR_DOOR_CLOSE_MS + 80;

export const hangarDoorTransitionStyle = {
  transitionDuration: `${HANGAR_DOOR_CLOSE_MS}ms`,
} as const;

import { SPACESHIP_AISLE_VIDEO_SRC } from "./spaceshipVideo";

const WARMUP_VIDEO_ID = "spaceship-aisle-warmup";

let preloadStarted = false;

/** 宇宙船通路動画の取得・デコードを早める（ホーム以外では呼ばない想定） */
export function preloadSpaceshipAisleVideo(): void {
  if (typeof document === "undefined" || preloadStarted) {
    return;
  }
  preloadStarted = true;

  // <link rel="preload" as="video"> は主要ブラウザで未実装のため使わず、
  // 隠し video 要素（preload="auto"）で取得とデコードを先行させる
  let video = document.getElementById(
    WARMUP_VIDEO_ID,
  ) as HTMLVideoElement | null;

  if (!video) {
    video = document.createElement("video");
    video.id = WARMUP_VIDEO_ID;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("playsinline", "");
    video.style.cssText =
      "position:fixed;width:0;height:0;opacity:0;pointer-events:none;left:-9999px";
    const source = document.createElement("source");
    source.src = SPACESHIP_AISLE_VIDEO_SRC;
    source.type = "video/mp4";
    video.appendChild(source);
    document.body.appendChild(video);
  }

  void video.play().catch(() => {
    video.load();
  });
}

/** ウォームアップ済み video 要素を SpaceshipInterior が引き継ぐ */
export function takeSpaceshipWarmupVideo(): HTMLVideoElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const video = document.getElementById(
    WARMUP_VIDEO_ID,
  ) as HTMLVideoElement | null;
  if (!video) {
    return null;
  }
  video.removeAttribute("id");
  return video;
}

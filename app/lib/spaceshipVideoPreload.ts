import { SPACESHIP_AISLE_VIDEO_SRC } from "./spaceshipVideo";

const WARMUP_VIDEO_ID = "spaceship-aisle-warmup";
const PRELOAD_LINK_ATTR = "data-spaceship-aisle-preload";

let preloadStarted = false;

/** 宇宙船通路動画の取得・デコードを早める（ホーム以外では呼ばない想定） */
export function preloadSpaceshipAisleVideo(): void {
  if (typeof document === "undefined" || preloadStarted) {
    return;
  }
  preloadStarted = true;

  if (!document.querySelector(`link[${PRELOAD_LINK_ATTR}]`)) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = SPACESHIP_AISLE_VIDEO_SRC;
    link.type = "video/mp4";
    link.setAttribute(PRELOAD_LINK_ATTR, "true");
    document.head.appendChild(link);
  }

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

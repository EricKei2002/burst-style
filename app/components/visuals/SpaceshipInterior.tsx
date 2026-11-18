"use client";

import { useEffect, useRef } from "react";
import { SPACESHIP_AISLE_VIDEO_SRC } from "../../lib/spaceshipVideo";
import { takeSpaceshipWarmupVideo } from "../../lib/spaceshipVideoPreload";

export default function SpaceshipInterior() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const warm = takeSpaceshipWarmupVideo();
    if (!container || !warm) {
      if (videoRef.current) {
        videoRef.current.playbackRate = 1.0;
      }
      return;
    }

    const fallback = container.querySelector("video[data-spaceship-fallback]");
    fallback?.remove();

    warm.className = "absolute inset-0 h-full w-full object-cover opacity-100";
    warm.style.cssText = "";
    warm.autoplay = true;
    warm.loop = true;
    warm.muted = true;
    warm.playsInline = true;
    warm.playbackRate = 1.0;
    container.prepend(warm);
    void warm.play().catch(() => {});
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-50 h-full w-full bg-[#000000] overflow-hidden"
    >
      <video
        ref={videoRef}
        data-spaceship-fallback
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover opacity-100"
      >
        <source src={SPACESHIP_AISLE_VIDEO_SRC} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
    </div>
  );
}

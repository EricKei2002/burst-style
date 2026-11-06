"use client";

import { useRef, useEffect } from "react";
import { SPACESHIP_AISLE_VIDEO_SRC } from "../../lib/spaceshipVideo";

export default function SpaceshipInterior() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.0;
    }
  }, []);

  return (
    <div className="fixed inset-0 -z-50 h-full w-full bg-[#000000] overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
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

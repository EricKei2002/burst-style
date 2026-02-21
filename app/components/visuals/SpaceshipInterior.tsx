"use client";

import { useRef, useEffect } from "react";

export default function SpaceshipInterior() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.playbackRate = 1.0;
    }
  }, []);

  return (
    <div className="fixed inset-0 -z-50 h-full w-full bg-[#000000] overflow-hidden">
      {/* 
        ビデオ背景
        ファイル名内の特殊文字を安全に処理するためにencodeURIを使用 
      */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-100"
      >
        <source src={`/videos/${encodeURIComponent("Spaceship aisle.mp4")}`} type="video/mp4" />
        <track kind="captions" srcLang="ja" label="日本語" default src="data:text/vtt,WEBVTT" />
        Your browser does not support the video tag.
      </video>
      
      {/* 映画のようなフィールと、圧縮アーティファクトを隠すためのオーバーレイ */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ProjectIntro
 * プロジェクトページを開いた直後に動画を全画面で表示し、
 * 一定時間後またはクリック/タップでフェードアウトしてコンテンツを表示する。
 */
export default function ProjectIntro() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<"intro" | "fading" | "done">("intro");

  // 動画を設定し、一定時間後に自動でフェードアウトを開始
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = 1.0;
    }

    // 2.5秒後に自動でフェードアウト開始
    const timer = setTimeout(() => {
      setPhase("fading");
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // フェードアウトが終わったらdoneにしてDOMから除去
  const handleTransitionEnd = () => {
    if (phase === "fading") {
      setPhase("done");
    }
  };

  // クリック/タップで即座にスキップ
  const handleSkip = () => {
    setPhase("fading");
  };

  if (phase === "done") return null;

  return (
    <div
      role="presentation"
      aria-hidden="true"
      onClick={handleSkip}
      onTransitionEnd={handleTransitionEnd}
      style={{
        transition: "opacity 0.8s ease-out",
        opacity: phase === "fading" ? 0 : 1,
        pointerEvents: phase === "fading" ? "none" : "auto",
      }}
      className="fixed inset-0 z-9999 cursor-pointer overflow-hidden bg-black"
    >
      {/* 宇宙船の通路動画 */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source
          src={`/videos/${encodeURIComponent("Spaceship aisle.mp4")}`}
          type="video/mp4"
        />
        <track kind="captions" srcLang="ja" label="日本語" default src="data:text/vtt,WEBVTT" />
      </video>

      {/* 映画的なオーバーレイ */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* スキップヒント */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{
          animation: "pulse-hint 1.5s ease-in-out infinite",
        }}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes pulse-hint {
              0%, 100% { opacity: 0.5; transform: translateX(-50%) translateY(0); }
              50% { opacity: 1; transform: translateX(-50%) translateY(-4px); }
            }
          `
        }} />
        <span className="font-mono text-xs text-zinc-400 tracking-widest uppercase">
          tap to enter
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-zinc-500"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}

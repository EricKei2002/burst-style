"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { preloadShaderTransition } from "../../lib/shaderTransitionLoader";
import { preloadSpaceshipAisleVideo } from "../../lib/spaceshipVideoPreload";
import { beginLeaveTransition, useTransitionStore } from "../../lib/store";
import MagneticButton from "./MagneticButton";
export default function BackButton() {
  const router = useRouter();
  const { setPhase } = useTransitionStore();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    preloadSpaceshipAisleVideo();
    preloadShaderTransition();
    // 未準備なら短く待ってからワープ。使えなければハンガー扉。
    void beginLeaveTransition().then((navigateDelayMs) => {
      setTimeout(() => {
        setPhase("closed");
        router.push("/#projects");
      }, navigateDelayMs);
    });
  };

  return (
    <div className="fixed top-6 left-6 z-50 mix-blend-difference">
      <MagneticButton>
        <Link
          href="/#projects"
          onClick={handleBack}
          onPointerEnter={preloadShaderTransition}
          onFocus={preloadShaderTransition}
          className="group relative flex items-center gap-3 px-5 py-3 rounded-full bg-zinc-900/40 backdrop-blur-md border border-white/10 hover:border-white/20 transition-[border-color] duration-200 ease-out"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/5 group-hover:bg-fuchsia-500/20 transition-colors">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-zinc-400 group-hover:text-fuchsia-400 transition-[color,translate] duration-200 ease-out group-hover:-translate-x-0.5"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </div>
          <span className="text-sm font-mono text-zinc-300 group-hover:text-white transition-colors tracking-wide pr-1">
            Back to Projects
          </span>

          {/* Hover Glow */}
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 bg-fuchsia-500/10 blur-md transition-opacity duration-200 ease-out -z-10" />
        </Link>
      </MagneticButton>
    </div>
  );
}

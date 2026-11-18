"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { preloadSpaceshipAisleVideo } from "../../lib/spaceshipVideoPreload";
import { useTransitionStore } from "../../lib/store";

/**
 * プロジェクト遷移の扉が閉じ始めたタイミングで背景動画の取得を開始する。
 * 全ページ常時 preload はしない。
 */
export default function SpaceshipVideoWarmup() {
  const pathname = usePathname();
  const phase = useTransitionStore((s) => s.phase);

  useEffect(() => {
    if (pathname.startsWith("/projects/")) {
      return;
    }
    if (phase === "closing" || phase === "closed") {
      preloadSpaceshipAisleVideo();
    }
  }, [pathname, phase]);

  return null;
}

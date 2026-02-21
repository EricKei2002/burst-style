"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// クライアントコンポーネント内でssr:falseのdynamic importを使う
const StarBackground = dynamic(
  () => import("./StarBackground"),
  { ssr: false }
);
const MouseTrail = dynamic(
  () => import("./MouseTrail"),
  { ssr: false }
);
const CustomCursor = dynamic(
  () => import("./CustomCursor"),
  { ssr: false }
);

export default function ClientVisuals() {
  // ready状態にモバイル判定を含めて一回のsetStateで完結させる
  const [config, setConfig] = useState<{ ready: boolean; showStars: boolean }>({
    ready: false,
    showStars: false,
  });

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    // 初期レンダリング後にビジュアルを有効化（LCP計測後）
    const timer = setTimeout(() => {
      setConfig({ ready: true, showStars: !isMobile });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!config.ready) return null;

  return (
    <>
      {config.showStars && <StarBackground />}
      <MouseTrail />
      <CustomCursor />
    </>
  );
}

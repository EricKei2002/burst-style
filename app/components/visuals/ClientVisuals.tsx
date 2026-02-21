"use client";

import dynamic from "next/dynamic";

// クライアントコンポーネント内でssr:falseのdynamic importを使う
// （layout.tsxはサーバーコンポーネントなのでここで分離する）
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
  return (
    <>
      <StarBackground />
      <MouseTrail />
      <CustomCursor />
    </>
  );
}

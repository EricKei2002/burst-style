import { ImageResponse } from "next/og";

import {
  BurstStyleTerminal,
  loadMonoFonts,
} from "../../lib/og/burstStyleTerminal";

// プロジェクト一覧・詳細ページで使う Burst Style のカード画像（16:9）
// OGP画像と同じターミナル風ビジュアルをビルド時に静的生成する
export const dynamic = "force-static";

const WIDTH = 1600;
const HEIGHT = 900;

export async function GET() {
  const fonts = await loadMonoFonts();
  return new ImageResponse(
    <BurstStyleTerminal
      width={WIDTH}
      height={HEIGHT}
      scale={2}
      starCount={90}
    />,
    { width: WIDTH, height: HEIGHT, fonts },
  );
}

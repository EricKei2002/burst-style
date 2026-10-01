import { readFile } from "node:fs/promises";
import path from "node:path";

// Burst Style（このサイト自身）のビジュアル。FVのスクリーンショットの代わりに、
// FVのターミナル風UIを ImageResponse 用に描き起こしたもの。
// OGP画像の右パネルと、プロジェクト一覧のカード画像で共用する。

export async function loadMonoFonts() {
  const dir = path.join(process.cwd(), "app", "fonts");
  const [regular, bold] = await Promise.all([
    readFile(path.join(dir, "JetBrainsMono-Regular.woff")),
    readFile(path.join(dir, "JetBrainsMono-Bold.woff")),
  ]);
  return [
    { name: "JetBrains Mono", data: regular, weight: 400 as const },
    { name: "JetBrains Mono", data: bold, weight: 700 as const },
  ];
}

// 固定シードの擬似乱数で星の配置を決める（ビルドごとに画像が変わらないように）
const STARS = Array.from({ length: 90 }, (_, i) => {
  const r = (n: number) =>
    (((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1) + 1) % 1;
  return {
    x: r(1),
    y: r(2),
    big: r(3) > 0.85,
    o: 0.25 + r(4) * 0.55,
  };
});

export function BurstStyleTerminal({
  width,
  height,
  scale = 1,
  starCount = 46,
  borderLeft = false,
}: {
  width: number;
  height: number;
  // ウィンドウ内の文字・余白の拡大率（OGPの右パネル=1）
  scale?: number;
  starCount?: number;
  borderLeft?: boolean;
}) {
  const px = (n: number) => n * scale;
  const dot = (color: string) => (
    <div
      style={{
        width: px(11),
        height: px(11),
        borderRadius: px(6),
        backgroundColor: color,
      }}
    />
  );

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        ...(borderLeft ? { borderLeft: "1px solid #27272a" } : {}),
        backgroundColor: "#050505",
        backgroundImage:
          "radial-gradient(circle at 70% 85%, rgba(34,211,238,0.14) 0%, rgba(5,5,5,0) 45%), radial-gradient(circle at 15% 10%, rgba(217,70,239,0.12) 0%, rgba(5,5,5,0) 40%)",
        fontFamily: "JetBrains Mono",
      }}
    >
      {STARS.slice(0, starCount).map((star, i) => {
        const s = (star.big ? 3 : 2) * Math.max(1, scale * 0.8);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: star.x * width,
              top: star.y * height,
              width: s,
              height: s,
              borderRadius: s,
              backgroundColor: `rgba(186,230,253,${star.o})`,
            }}
          />
        );
      })}

      <div
        style={{
          width: px(400),
          display: "flex",
          flexDirection: "column",
          borderRadius: px(14),
          border: "1px solid rgba(94,234,212,0.35)",
          backgroundColor: "rgba(10,10,10,0.92)",
          boxShadow: `0 0 ${px(40)}px rgba(217,70,239,0.18)`,
        }}
      >
        {/* ウィンドウのタイトルバー */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: px(8),
            padding: `${px(14)}px ${px(18)}px`,
            borderBottom: "1px solid #27272a",
          }}
        >
          {dot("#f87171")}
          {dot("#fbbf24")}
          {dot("#4ade80")}
          <div
            style={{ marginLeft: px(12), fontSize: px(15), color: "#a1a1aa" }}
          >
            Eric Kei@Burst Style~&gt;ls
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: `${px(30)}px ${px(28)}px ${px(34)}px`,
            gap: px(6),
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: px(15),
              color: "#71717a",
              marginBottom: px(14),
            }}
          >
            /Projects&nbsp;&nbsp;/About&nbsp;&nbsp;/Contact
          </div>
          <div
            style={{
              display: "flex",
              fontSize: px(50),
              fontWeight: 700,
              color: "#fafafa",
            }}
          >
            <span style={{ color: "#f0abfc" }}>&gt;</span>Hello, I&apos;m
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              fontSize: px(58),
              fontWeight: 700,
              color: "#fafafa",
            }}
          >
            Eric Kei.
            <div
              style={{
                width: px(34),
                height: px(7),
                marginLeft: px(6),
                marginBottom: px(14),
                backgroundColor: "#c084fc",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              marginTop: px(18),
              fontSize: px(16),
              color: "#86efac",
            }}
          >
            &gt; system status: online_
          </div>
        </div>
      </div>
    </div>
  );
}

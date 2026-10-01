import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { projectsData } from "../../lib/data";
import {
  BurstStyleTerminal,
  loadMonoFonts,
} from "../../lib/og/burstStyleTerminal";
import { getLocalizedProject, getProjectTitleEn } from "../../lib/projectEn";

// プロジェクト個別ページ用のOGP画像（1200x630）
// ImageResponseの既定フォントは日本語を描画できないため、英語のタイトル・説明を使う
export const alt = "Burst Style project";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return projectsData.map((project) => ({ slug: project.slug }));
}

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

async function loadPublicImage(src: string): Promise<string | null> {
  const mime = MIME_BY_EXT[path.extname(src).toLowerCase()];
  if (!mime) return null;
  try {
    const buf = await readFile(path.join(process.cwd(), "public", src));
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function ProjectOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const raw = projectsData.find((p) => p.slug === slug);
  const title = raw ? getProjectTitleEn(raw) : "Burst Style";
  const description = raw ? getLocalizedProject(raw, "en").description : "";
  const isSelf = slug === "burst-style";
  const image = raw && !isSelf ? await loadPublicImage(raw.image) : null;
  const fonts = isSelf ? await loadMonoFonts() : undefined;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#0a0a0a",
        backgroundImage:
          "radial-gradient(circle at 90% 10%, rgba(217,70,239,0.3) 0%, rgba(10,10,10,0) 45%)",
        color: "#fafafa",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 56px 64px 72px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 24,
            color: "#e879f9",
            letterSpacing: 4,
          }}
        >
          <div style={{ width: 40, height: 2, background: "#e879f9" }} />
          PROJECT
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: title.length > 20 ? 56 : 72,
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#d4d4d8",
              lineHeight: 1.4,
              // 長い説明は3行で切る
              display: "block",
              lineClamp: 3,
            }}
          >
            {description}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#a1a1aa" }}>
          <span style={{ color: "#d946ef", marginRight: 12 }}>&gt;</span>
          burst.style
        </div>
      </div>

      {isSelf && <BurstStyleTerminal width={480} height={630} borderLeft />}

      {image && (
        <div
          style={{
            width: 480,
            height: "100%",
            display: "flex",
            borderLeft: "1px solid #27272a",
          }}
        >
          <img
            src={image}
            alt=""
            width={480}
            height={630}
            style={{ width: 480, height: 630, objectFit: "cover" }}
          />
        </div>
      )}
    </div>,
    { ...size, fonts },
  );
}

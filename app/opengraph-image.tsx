import { ImageResponse } from "next/og";

// SNSシェア用のOGP画像（1200x630）をビルド時に生成する
// twitter:image は未指定時に og:image へフォールバックするため、このファイルだけで両方を賄う
export const alt = "Burst Style — Eric Kei's Web Developer Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        backgroundColor: "#0a0a0a",
        backgroundImage:
          "radial-gradient(circle at 80% 20%, rgba(217,70,239,0.35) 0%, rgba(10,10,10,0) 45%), radial-gradient(circle at 10% 90%, rgba(59,130,246,0.25) 0%, rgba(10,10,10,0) 40%)",
        color: "#fafafa",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 28,
          color: "#e879f9",
          letterSpacing: 4,
        }}
      >
        <div style={{ width: 48, height: 2, background: "#e879f9" }} />
        ERIC KEI / PORTFOLIO
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            fontSize: 120,
            fontWeight: 900,
            letterSpacing: -4,
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#d946ef", marginRight: 24 }}>&gt;</span>
          BURST STYLE
        </div>
        <div style={{ fontSize: 36, color: "#d4d4d8", lineHeight: 1.4 }}>
          Creative web engineering with Next.js, React & Three.js
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 26,
          color: "#a1a1aa",
        }}
      >
        <span>burst.style</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: "#22c55e",
            }}
          />
          SYSTEM STATUS: ONLINE
        </div>
      </div>
    </div>,
    size,
  );
}

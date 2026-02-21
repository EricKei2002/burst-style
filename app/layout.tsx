import type { Metadata } from "next";
import "./globals.css";

import SmoothScroll from "./components/SmoothScroll";
import HangarDoorTransition from "./components/visuals/HangarDoorTransition";
// StarBackground・MouseTrail・CustomCursorはクライアントラッパー内でdynamic（ssr:false）取り込み
import ClientVisuals from "./components/visuals/ClientVisuals";

export const metadata: Metadata = {
  metadataBase: new URL("https://burst.style"),
  title: {
    default: "Burst Style | Web Developer Portfolio",
    template: "%s | Burst Style",
  },
  description: "Eric Keiのポートフォリオサイト(Burst Style)。Webエンジニアとして、Next.js, React, Three.jsを用いたクリエイティブなWeb制作を行っています。創造性を爆発させ、未知の体験を形にします。",
  keywords: ["Webエンジニア", "フロントエンド", "React", "Next.js", "Three.js", "Portfolio", "Web制作", "Creative Coding", "Eric Kei", "Burst Style"],
  authors: [{ name: "Eric Kei" }],
  creator: "Eric Kei",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://burst.style",
    title: "Burst Style | Web Developer Portfolio",
    description: "Eric Keiのポートフォリオサイト。Next.jsとThree.jsを駆使した没入型Web体験。",
    siteName: "Burst Style",
    images: [
      {
        url: "/icon.jpg",
        width: 1200,
        height: 630,
        alt: "Burst Style Portfolio",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-[#0a0a0a] text-zinc-100 antialiased font-mono">
        <ClientVisuals />
        <HangarDoorTransition />
        <SmoothScroll>
          <main className="min-h-screen w-full">
            {children}
          </main>
        </SmoothScroll>
      </body>
    </html>
  );
}

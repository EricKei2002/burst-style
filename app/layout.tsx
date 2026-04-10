import type { Metadata } from "next";
import "./globals.css";

import SmoothScroll from "./components/SmoothScroll";
import HangarDoorTransition from "./components/visuals/HangarDoorTransition";
// StarBackground・MouseTrail・CustomCursorはクライアントラッパー内でdynamic（ssr:false）取り込み
import ClientVisuals from "./components/visuals/ClientVisuals";
import { LocaleProvider } from "./lib/locale";

export const metadata: Metadata = {
  metadataBase: new URL("https://burst.style"),
  title: {
    default: "Burst Style | Web Developer Portfolio",
    template: "%s | Burst Style",
  },
  description:
    "Eric Kei's portfolio (Burst Style)—creative web engineering with Next.js, React, and Three.js. / Eric Keiのポートフォリオ。没入型Web体験とクリエイティブコーディング。",
  keywords: [
    "Web Developer",
    "Frontend",
    "React",
    "Next.js",
    "Three.js",
    "Portfolio",
    "Creative Coding",
    "Eric Kei",
    "Burst Style",
    "Webエンジニア",
    "フロントエンド",
    "Web制作",
  ],
  authors: [{ name: "Eric Kei" }],
  creator: "Eric Kei",
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["ja_JP"],
    url: "https://burst.style",
    title: "Burst Style | Web Developer Portfolio",
    description:
      "Immersive portfolio by Eric Kei—Next.js, Three.js, and creative engineering. 日本語UI切替あり。",
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#0a0a0a] text-zinc-100 antialiased font-mono">
        <ClientVisuals />
        <HangarDoorTransition />
        <SmoothScroll>
          <LocaleProvider>
            <main className="min-h-screen w-full">{children}</main>
          </LocaleProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}

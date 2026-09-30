import type { Metadata } from "next";
import "./globals.css";

import SmoothScroll from "./components/SmoothScroll";
import HangarDoorTransition from "./components/visuals/HangarDoorTransition";
// StarBackground・MouseTrailはクライアントラッパー内でdynamic（ssr:false）取り込み
import ClientVisuals from "./components/visuals/ClientVisuals";
import { LocaleProvider } from "./lib/locale";
import { LOCALE_STORAGE_KEY } from "./lib/localeConstants";

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
    // images は app/opengraph-image.tsx から自動で付与される
  },
  twitter: {
    card: "summary_large_image",
    title: "Burst Style | Web Developer Portfolio",
    description:
      "Immersive portfolio by Eric Kei—Next.js, Three.js, and creative engineering.",
  },
  alternates: {
    canonical: "/",
  },
};

// 検索エンジン向けの人物情報（構造化データ）
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Eric Kei",
  url: "https://burst.style",
  image: "https://burst.style/profile-new.jpg",
  jobTitle: "Frontend Engineer",
  knowsAbout: ["React", "Next.js", "TypeScript", "Three.js", "Web Development"],
  sameAs: [
    "https://github.com/EricKei2002",
    "https://www.wantedly.com/id/eric0216",
  ],
};

// LocaleProviderのuseEffectより前（初回描画前）にhtml[lang]を確定させ、
// 日本語表示中なのに lang="en" のまま読み上げ・翻訳判定される時間をなくす
const localeInitScript = `try{var l=localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)});if(l!=="en"&&l!=="ja"){l=navigator.language.toLowerCase().indexOf("ja")===0?"ja":"en"}document.documentElement.lang=l}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
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

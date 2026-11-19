import type { Metadata } from "next";
import "./globals.css";

import SmoothScroll from "./components/SmoothScroll";
import HangarDoorTransition from "./components/visuals/HangarDoorTransition";
// three / 宇宙船演出は ShaderPageTransition 内で動的 import（初期 JS に含めない）
import ShaderPageTransition from "./components/visuals/ShaderPageTransition";
// StarBackground・MouseTrailはクライアントラッパー内でdynamic（ssr:false）取り込み
import ClientVisuals from "./components/visuals/ClientVisuals";
import LocalSky from "./components/visuals/LocalSky";
import SkipToWork from "./components/ui/SkipToWork";
import { homeSectionInitScript } from "./lib/homeSections";
import { LocaleProvider } from "./lib/locale";
import { LOCALE_STORAGE_KEY } from "./lib/localeConstants";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.burst.style"),
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
    url: "https://www.burst.style",
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
  url: "https://www.burst.style",
  image: "https://www.burst.style/profile-new.jpg",
  jobTitle: "Frontend Engineer",
  knowsAbout: ["React", "Next.js", "TypeScript", "Three.js", "Web Development"],
  sameAs: [
    "https://github.com/EricKei2002",
    "https://www.wantedly.com/id/eric0216",
  ],
};

// 復元されたスクロール位置が先頭でなければ、描画前に不透明バーにする
const headerSolidInitScript = `try{var s=function(){var r=document.documentElement;if(window.scrollY>4)r.dataset.headerSolid="";else delete r.dataset.headerSolid};s();window.addEventListener("pageshow",s);}catch(e){}`;

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
        {/* トップの直リンク（#projects など）で、最初から該当セクションだけを表示する */}
        <script dangerouslySetInnerHTML={{ __html: homeSectionInitScript }} />
        {/* スクロール位置の復元より前に、ずれていたら不透明バーを付ける（水和前の透明ちらつきを防ぐ） */}
        <script dangerouslySetInnerHTML={{ __html: headerSolidInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#0a0a0a] text-zinc-100 antialiased font-mono">
        <ClientVisuals />
        <HangarDoorTransition />
        <ShaderPageTransition />
        <SmoothScroll>
          <LocaleProvider>
            <SkipToWork />
            <main className="min-h-screen w-full">{children}</main>
          </LocaleProvider>
        </SmoothScroll>
        {/* 空のレイヤーは z-index が負なので DOM の位置は見た目に関係しない。
            左下の計器ボタンが Tab 順でスキップリンクより先に来ないよう、末尾に置く */}
        <LocalSky />
      </body>
    </html>
  );
}

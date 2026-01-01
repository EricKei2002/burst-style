import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

import SmoothScroll from "./components/SmoothScroll";
import StarBackground from "./components/StarBackground";
import MouseTrail from "./components/MouseTrail";

import CustomCursor from "./components/CustomCursor";

export const metadata: Metadata = {
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
        url: "/icon.jpg", // Using the icon as fallback OG image if no specific OG image yet
        width: 1200,
        height: 630,
        alt: "Burst Style Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Burst Style | Web Developer Portfolio",
    description: "Eric Keiのポートフォリオサイト。創造性を爆発させるWeb体験。",
    // creator: "@your_twitter_handle", // User removed twitter link, so maybe omit or keep generic
    images: ["/icon.jpg"],
  },
  icons: {
    icon: "/icon.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`min-h-screen bg-[#0a0a0a] text-zinc-100 antialiased ${jetbrainsMono.variable} font-mono`}>
        <CustomCursor />
        <MouseTrail />
        <SmoothScroll>
          <StarBackground />
          <main className="min-h-screen w-full">
            {children}
          </main>
        </SmoothScroll>
      </body>
    </html>
  );
}

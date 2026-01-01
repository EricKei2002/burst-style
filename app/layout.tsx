import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

import SmoothScroll from "./components/SmoothScroll";
import StarBackground from "./components/StarBackground";
import MouseTrail from "./components/MouseTrail";

export const metadata: Metadata = {
  title: "Burst Style | Eric Kei Portfolio",
  description: "Web programmer  portfolio by Eric Kei.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`min-h-screen bg-[#0a0a0a] text-zinc-100 antialiased ${jetbrainsMono.variable} font-mono`}>
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

import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Burst Style Studio",
  description:
    "ブランドデザインとデジタルプロダクトに特化したクリエイティブスタジオ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
          <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/70">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 sm:px-12 lg:px-16">
              <Link href="/" className="text-base font-semibold">
                Burst Style
              </Link>
              <nav className="flex items-center gap-6 text-sm font-medium">
                <Link
                  href="/featured-projects"
                  className="transition hover:text-zinc-500 dark:hover:text-zinc-300"
                >
                  Featured Projects
                </Link>
                <Link
                  href="/about"
                  className="transition hover:text-zinc-500 dark:hover:text-zinc-300"
                >
                  自己紹介
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto flex w-full max-w-5xl flex-col gap-24 px-6 py-24 sm:px-12 lg:px-16">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-screen bg-gradient-to-b from-white to-zinc-100 text-zinc-900 antialiased transition-colors duration-300 dark:from-[#0b0c10] dark:to-[#05060a] dark:text-zinc-100">
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-20 px-4 pb-20 pt-12 sm:px-6 lg:px-10">
          {children}
        </main>
      </body>
    </html>
  );
}

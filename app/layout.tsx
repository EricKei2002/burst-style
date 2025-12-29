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
      <body className="min-h-screen bg-[#0a0a0a] text-zinc-100 antialiased">
        <main className="min-h-screen w-full">
          {children}
        </main>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { getServerLocale } from "./lib/getServerLocale";
import { pick } from "./lib/siteCopy";

export const metadata: Metadata = {
  title: "404 — Signal Lost",
  robots: { index: false },
};

export default async function NotFound() {
  const locale = await getServerLocale();

  return (
    <section className="relative flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-black/60 p-8 font-mono backdrop-blur-sm sm:p-10">
        <p className="mb-6 flex items-center gap-2 text-xs tracking-wider text-fuchsia-400 uppercase">
          <span className="h-px w-8 bg-current" />
          Error 404
        </p>

        <h1 className="mb-6 text-4xl font-black tracking-tighter text-white sm:text-6xl">
          SIGNAL LOST
        </h1>

        <div className="mb-8 space-y-1 text-sm text-zinc-300">
          <p>&gt; ping requested_coordinates</p>
          <p className="text-red-400">
            &gt;{" "}
            {pick(locale, {
              en: "No response. This sector is empty space.",
              ja: "応答なし。この座標には何も存在しません。",
            })}
          </p>
          <p>
            &gt;{" "}
            {pick(locale, {
              en: "The page may have moved or never existed.",
              ja: "ページが移動したか、URLが間違っている可能性があります。",
            })}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="flex items-center justify-center rounded-lg border border-fuchsia-500/30 bg-fuchsia-600/10 px-5 py-3 text-xs tracking-wider text-fuchsia-300 uppercase transition-colors hover:bg-fuchsia-600/20"
          >
            {pick(locale, { en: "< Return to base", ja: "< トップへ戻る" })}
          </Link>
          <Link
            href="/#projects"
            className="flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 px-5 py-3 text-xs tracking-wider text-zinc-300 uppercase transition-colors hover:bg-zinc-700"
          >
            {pick(locale, { en: "View projects", ja: "プロジェクトを見る" })}
          </Link>
        </div>
      </div>
    </section>
  );
}

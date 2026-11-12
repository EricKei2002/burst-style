"use client";

import { useMemo } from "react";

import { buildCuratedNowItems } from "../../lib/buildCuratedNowItems";
import { useLocale, useSiteCopy } from "../../lib/locale";
import type { Locale } from "../../lib/siteCopy";
import type { NowItem } from "../../lib/nowTypes";

export type { NowItem } from "../../lib/nowTypes";

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

function formatRelative(date: string, base: number, locale: Locale): string {
  const time = Date.parse(date);
  if (Number.isNaN(time)) return "";

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diffSec = Math.round((time - base) / 1000);
  for (const [unit, sec] of UNITS) {
    if (Math.abs(diffSec) >= sec) {
      return rtf.format(Math.trunc(diffSec / sec), unit);
    }
  }
  return rtf.format(0, "minute");
}

const titleClassName =
  "truncate font-mono text-lg font-bold text-white transition-colors focus-visible:outline-none";

export default function NowSectionView({
  githubItems,
  renderedAt,
}: {
  githubItems: NowItem[];
  renderedAt: number;
}) {
  const { locale } = useLocale();
  const copy = useSiteCopy();

  const items = useMemo(() => {
    const curated = buildCuratedNowItems(locale);
    return [...curated, ...githubItems];
  }, [locale, githubItems]);

  return (
    <section id="now" className="relative w-full py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-12 max-w-2xl rounded-2xl border border-white/10 bg-black/65 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2 text-fuchsia-100">
            <span className="h-px w-8 bg-current"></span>
            <span className="font-mono text-sm font-semibold tracking-wider uppercase">
              {copy.now.label}
            </span>
          </div>
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {copy.now.heading}
          </h2>
          <p className="leading-relaxed text-zinc-50">{copy.now.intro}</p>
        </div>

        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const relative = formatRelative(item.date, renderedAt, locale);
            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-sm transition-colors hover:border-zinc-600 hover:bg-zinc-900/50"
              >
                <div className="flex items-center justify-between gap-3">
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${titleClassName} hover:text-fuchsia-300 focus-visible:text-fuchsia-300`}
                    >
                      {item.name}
                    </a>
                  ) : (
                    <span className={titleClassName}>{item.name}</span>
                  )}
                  {item.badge && (
                    <span className="shrink-0 font-mono text-xs text-fuchsia-200">
                      #{item.badge}
                    </span>
                  )}
                </div>

                <p className="font-mono text-sm leading-relaxed text-zinc-200">
                  <span aria-hidden="true" className="text-fuchsia-300">
                    {"> "}
                  </span>
                  {item.summary && item.summaryHref ? (
                    <a
                      href={item.summaryHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
                    >
                      {item.summary}
                    </a>
                  ) : item.summary ? (
                    <span className="break-words text-zinc-200">
                      {item.summary}
                    </span>
                  ) : (
                    <span className="text-zinc-400">{copy.now.noCommits}</span>
                  )}
                </p>

                {relative && (
                  <time
                    dateTime={item.date}
                    className="mt-auto font-mono text-xs text-zinc-400"
                  >
                    {relative}
                  </time>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

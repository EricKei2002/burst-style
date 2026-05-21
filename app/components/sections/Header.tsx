"use client";

import { useLocale, useSiteCopy } from "../../lib/locale";

export default function Header() {
  const { locale, setLocale } = useLocale();
  const copy = useSiteCopy();

  const linkClass =
    "text-green-100 transition-colors hover:text-fuchsia-200 focus-visible:text-green-50";

  return (
    <header className="sticky inset-x-0 top-0 z-30 mt-4 sm:mt-5">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-stretch gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-stretch lg:justify-between lg:gap-6 lg:px-8">
        <div
          aria-hidden="true"
          className="inline-flex min-h-[68px] w-full items-center rounded-xl border border-green-300/40 bg-zinc-950/95 px-4 py-2.5 font-mono text-sm sm:text-base tracking-wide text-green-100 lg:max-w-[340px]"
        >
          <span className="font-semibold text-green-100">Burst Style</span>
        </div>
        <nav
          aria-label="Primary navigation"
          className="relative min-h-[68px] w-full rounded-xl border border-green-300/40 bg-zinc-950/95 px-4 py-2.5 font-mono text-xs sm:text-sm tracking-wide text-left text-green-100 lg:max-w-[760px]"
        >
          <div className="flex flex-wrap items-center gap-x-0.5 gap-y-0.5">
            <span className="font-semibold text-green-100">Eric Kei</span>
            <span className="text-green-200">@</span>
            <span className="font-semibold text-green-100">Burst Style</span>
            <span className="text-green-200">~</span>
            <span className="text-green-100">&gt;</span>
            <span className="text-green-100">ls</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-6">
            <div
              className="flex shrink-0 items-center gap-0.5 rounded-md border border-green-300/35 bg-black/40 p-0.5"
              role="group"
              aria-label={copy.header.langToggle}
            >
              <button
                type="button"
                aria-pressed={locale === "en"}
                onClick={() => setLocale("en")}
                className={`rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
                  locale === "en"
                    ? "bg-green-500/25 text-green-50"
                    : "text-green-200/80 hover:text-green-100"
                }`}
              >
                {copy.header.langEn}
              </button>
              <button
                type="button"
                aria-pressed={locale === "ja"}
                onClick={() => setLocale("ja")}
                className={`rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
                  locale === "ja"
                    ? "bg-green-500/25 text-green-50"
                    : "text-green-200/80 hover:text-green-100"
                }`}
              >
                {copy.header.langJa}
              </button>
            </div>
            <a
              href="#projects"
              aria-label="Go to Projects section"
              className={linkClass}
            >
              /Projects
            </a>
            <a
              href="#about"
              aria-label="Go to About section"
              className={linkClass}
            >
              /About
            </a>
            <a
              href="#contact"
              aria-label="Go to Contact section"
              className={linkClass}
            >
              /Contact
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}

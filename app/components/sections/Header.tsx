"use client";

import { useEffect, useRef, useState } from "react";

import { useLocale, useSiteCopy } from "../../lib/locale";

export default function Header() {
  const { locale, setLocale } = useLocale();
  const copy = useSiteCopy();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (moreWrapRef.current?.contains(e.target as Node)) return;
      setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

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
            <div className="relative" ref={moreWrapRef}>
              <button
                type="button"
                id="nav-more-button"
                aria-expanded={moreOpen}
                aria-haspopup="true"
                aria-controls="nav-more-menu"
                onClick={() => setMoreOpen((o) => !o)}
                className={`${linkClass} inline-flex items-center gap-1 rounded border border-transparent px-1 py-0.5 hover:border-green-300/30`}
              >
                /More
                <span className="text-[10px] text-green-300" aria-hidden="true">
                  {moreOpen ? "▲" : "▼"}
                </span>
              </button>
              {moreOpen ? (
                <div
                  id="nav-more-menu"
                  role="menu"
                  aria-labelledby="nav-more-button"
                  className="absolute left-0 top-full z-40 mt-1 min-w-44 rounded-lg border border-green-300/35 bg-zinc-950/98 py-1 shadow-lg backdrop-blur-sm"
                >
                  <a
                    role="menuitem"
                    href="#now"
                    className="block px-3 py-2 text-green-100 transition-colors hover:bg-green-900/20 hover:text-fuchsia-200"
                    onClick={() => setMoreOpen(false)}
                  >
                    /Now
                  </a>
                  <a
                    role="menuitem"
                    href="#lab"
                    className="block px-3 py-2 text-green-100 transition-colors hover:bg-green-900/20 hover:text-fuchsia-200"
                    onClick={() => setMoreOpen(false)}
                  >
                    /Lab
                  </a>
                  <a
                    role="menuitem"
                    href="#writing"
                    className="block px-3 py-2 text-green-100 transition-colors hover:bg-green-900/20 hover:text-fuchsia-200"
                    onClick={() => setMoreOpen(false)}
                  >
                    /Writing
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

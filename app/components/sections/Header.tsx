"use client";

import { useLocale, useSiteCopy } from "../../lib/locale";
import {
  HOME_SECTIONS,
  HOME_SECTION_LABELS,
  type HomeSection,
} from "../../lib/homeSections";

const SECTION_HREF: Record<HomeSection, string> = {
  home: "/",
  projects: "#projects",
  about: "#about",
  contact: "#contact",
};

export default function Header({ active }: { active: HomeSection }) {
  const { locale, setLocale } = useLocale();
  const copy = useSiteCopy();

  const linkClass =
    "inline-flex min-h-10 items-center justify-center rounded-md px-1.5 text-green-100 transition-colors hover:text-fuchsia-200 focus-visible:text-green-50 aria-[current=page]:bg-fuchsia-500/15 aria-[current=page]:text-fuchsia-100 aria-[current=page]:underline aria-[current=page]:decoration-fuchsia-300/70 aria-[current=page]:underline-offset-4 sm:min-h-8";

  return (
    <header className="sticky inset-x-0 top-0 z-30 mt-2 sm:mt-5">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-stretch gap-3 px-3 py-2 sm:px-6 sm:py-5 lg:flex-row lg:items-stretch lg:justify-between lg:gap-6 lg:px-8">
        <div
          aria-hidden="true"
          className="hidden min-h-[68px] w-full items-center rounded-xl border border-green-300/40 bg-zinc-950/95 px-4 py-2.5 font-mono text-sm tracking-wide text-green-100 sm:inline-flex sm:text-base lg:max-w-[340px]"
        >
          <span className="font-semibold text-green-100">Burst Style</span>
        </div>
        <nav
          aria-label="Primary navigation"
          className="relative w-full rounded-xl border border-green-300/40 bg-zinc-950/95 px-3 py-2 font-mono text-xs tracking-wide text-left text-green-100 sm:min-h-[68px] sm:px-4 sm:py-2.5 sm:text-sm lg:max-w-[760px]"
        >
          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <div className="flex flex-wrap items-center gap-x-0.5 gap-y-0.5">
              <span className="font-semibold text-green-100">Eric Kei</span>
              <span className="text-green-200">@</span>
              <span className="font-semibold text-green-100">Burst Style</span>
              <span className="text-green-200">~</span>
              <span className="text-green-100">&gt;</span>
              <span className="text-green-100">ls</span>
            </div>
            <div
              className="flex shrink-0 items-center gap-0.5 rounded-md border border-green-300/35 bg-black/40 p-0.5 sm:hidden"
              role="group"
              aria-label={copy.header.langToggle}
            >
              <LangButtons locale={locale} setLocale={setLocale} copy={copy} />
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-6">
            <div
              className="hidden shrink-0 items-center gap-0.5 rounded-md border border-green-300/35 bg-black/40 p-0.5 sm:flex"
              role="group"
              aria-label={copy.header.langToggle}
            >
              <LangButtons locale={locale} setLocale={setLocale} copy={copy} />
            </div>
            <ul className="grid w-full grid-cols-4 gap-1 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-x-6">
              {HOME_SECTIONS.map((section) => (
                <li key={section}>
                  <a
                    href={SECTION_HREF[section]}
                    aria-current={active === section ? "page" : undefined}
                    className={`${linkClass} w-full sm:w-auto`}
                  >
                    /{HOME_SECTION_LABELS[section]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
}

function LangButtons({
  locale,
  setLocale,
  copy,
}: {
  locale: string;
  setLocale: (locale: "en" | "ja") => void;
  copy: ReturnType<typeof useSiteCopy>;
}) {
  const buttonClass = (selected: boolean) =>
    `rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
      selected
        ? "bg-green-500/25 text-green-50"
        : "text-green-200/80 hover:text-green-100"
    }`;
  return (
    <>
      <button
        type="button"
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
        className={buttonClass(locale === "en")}
      >
        {copy.header.langEn}
      </button>
      <button
        type="button"
        aria-pressed={locale === "ja"}
        onClick={() => setLocale("ja")}
        className={buttonClass(locale === "ja")}
      >
        {copy.header.langJa}
      </button>
    </>
  );
}

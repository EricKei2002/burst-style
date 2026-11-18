"use client";

import { useLocale, useSiteCopy } from "../../lib/locale";
import {
  HOME_SECTIONS,
  HOME_SECTION_LABELS,
  sectionPageLabel,
  type HomeSection,
} from "../../lib/homeSections";
import { preloadShaderTransition } from "../../lib/shaderTransitionLoader";

const SECTION_HREF: Record<HomeSection, string> = {
  home: "/",
  projects: "#projects",
  about: "#about",
  contact: "#contact",
};

/**
 * トップのヘッダー。
 * - PC: 従来どおりの 2 枚のパネル（ロゴ / プロンプト＋メニュー）。現在地のページ番号とキー操作のヒントを添える
 * - スマホ: 上は 1 行（ロゴ・現在地・言語）だけにして高さを抑え、メニューは画面下の固定タブバーにする
 * enhanced（JS で切り替え式になっている）ときだけ、ページ番号とヒントを出す
 */
export default function Header({
  active,
  enhanced,
}: {
  active: HomeSection;
  enhanced: boolean;
}) {
  const { locale, setLocale } = useLocale();
  const copy = useSiteCopy();
  const index = HOME_SECTIONS.indexOf(active);

  const linkClass =
    "relative inline-flex h-full w-full items-center justify-center rounded-md px-1.5 text-green-100 transition-colors hover:text-fuchsia-200 focus-visible:text-green-50 max-sm:active:bg-fuchsia-500/10 aria-[current=page]:bg-fuchsia-500/20 aria-[current=page]:font-semibold aria-[current=page]:text-fuchsia-100 sm:h-auto sm:min-h-8 sm:w-auto sm:aria-[current=page]:underline sm:aria-[current=page]:decoration-fuchsia-300/70 sm:aria-[current=page]:underline-offset-4";

  return (
    <header className="sticky inset-x-0 top-0 z-30 sm:mt-5">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-stretch gap-3 px-2 py-1.5 sm:px-6 sm:py-5 lg:flex-row lg:items-stretch lg:justify-between lg:gap-6 lg:px-8">
        <div
          aria-hidden="true"
          className="hidden min-h-[68px] w-full items-center rounded-xl border border-green-300/40 bg-zinc-950/95 px-4 py-2.5 font-mono text-sm tracking-wide text-green-100 sm:inline-flex sm:text-base lg:max-w-[340px]"
        >
          <span className="font-semibold text-green-100">Burst Style</span>
        </div>
        <nav
          aria-label="Primary navigation"
          onPointerEnter={() => {
            preloadShaderTransition();
            void import("../visuals/PlanetInterior");
          }}
          className="relative w-full rounded-xl border border-green-300/40 bg-zinc-950/95 px-3 py-1 font-mono text-xs tracking-wide text-left text-green-100 sm:min-h-[68px] sm:px-4 sm:py-2.5 sm:text-sm lg:max-w-[760px]"
        >
          <div className="flex min-h-10 items-center justify-between gap-2 sm:min-h-0 sm:justify-start">
            <div className="flex min-w-0 flex-wrap items-center gap-x-0.5 gap-y-0.5">
              <span className="hidden font-semibold text-green-100 sm:inline">
                Eric Kei
              </span>
              <span className="hidden text-green-200 sm:inline">@</span>
              <span className="font-semibold text-green-100">Burst Style</span>
              <span className="hidden text-green-200 sm:inline">~</span>
              <span className="hidden text-green-100 sm:inline">&gt;</span>
              <span className="hidden text-green-100 sm:inline">ls</span>
            </div>
            {enhanced && (
              // 現在地（読み上げは切り替え時の通知とメニューの aria-current で伝えるので隠す）
              <p
                aria-hidden="true"
                className="flex min-w-0 items-baseline gap-1.5 truncate text-[11px] text-fuchsia-100 sm:ml-auto sm:text-xs"
              >
                <span className="tabular-nums text-fuchsia-200/90">
                  {sectionPageLabel(active)}
                </span>
                <span className="font-semibold sm:hidden">
                  {HOME_SECTION_LABELS[active]}
                </span>
              </p>
            )}
            <div
              className="flex shrink-0 items-center gap-0.5 rounded-md border border-green-300/35 bg-black/40 p-0.5 sm:hidden"
              role="group"
              aria-label={copy.header.langToggle}
            >
              <LangButtons locale={locale} setLocale={setLocale} copy={copy} />
            </div>
          </div>
          <div className="contents sm:mt-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-1">
            <div
              className="hidden shrink-0 items-center gap-0.5 rounded-md border border-green-300/35 bg-black/40 p-0.5 sm:flex"
              role="group"
              aria-label={copy.header.langToggle}
            >
              <LangButtons locale={locale} setLocale={setLocale} copy={copy} />
            </div>
            {/* スマホでは画面下の固定タブバー（親指で届く位置）。PC ではヘッダー内に並べる */}
            <ul className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(3.5rem+env(safe-area-inset-bottom))] grid-cols-4 gap-1 border-t border-green-300/30 bg-zinc-950/95 px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] backdrop-blur-md sm:static sm:z-auto sm:flex sm:h-auto sm:w-auto sm:flex-wrap sm:items-center sm:gap-x-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
              {HOME_SECTIONS.map((section, i) => (
                <li key={section} className="h-full sm:h-auto">
                  <a
                    href={SECTION_HREF[section]}
                    aria-current={
                      // JS 無し（縦に並ぶ表示）では現在地が決まらないので付けない
                      enhanced && active === section ? "page" : undefined
                    }
                    aria-keyshortcuts={enhanced ? String(i + 1) : undefined}
                    className={linkClass}
                  >
                    /{HOME_SECTION_LABELS[section]}
                  </a>
                </li>
              ))}
            </ul>
            {enhanced && (
              <p
                aria-hidden="true"
                className="ml-auto hidden text-[11px] tracking-wider text-green-200/75 lg:block"
                title={
                  locale === "ja"
                    ? "← → キーか 1〜4 で切り替え"
                    : "Use ← → or 1–4 to switch"
                }
              >
                <kbd className="rounded border border-green-300/30 px-1">←</kbd>{" "}
                <kbd className="rounded border border-green-300/30 px-1">→</kbd>{" "}
                /{" "}
                <kbd className="rounded border border-green-300/30 px-1">1</kbd>
                –
                <kbd className="rounded border border-green-300/30 px-1">4</kbd>
              </p>
            )}
          </div>
          {enhanced && (
            <p className="sr-only">
              {locale === "ja"
                ? `セクション ${index + 1} / ${HOME_SECTIONS.length}。左右の矢印キーか数字の 1〜4 で切り替えられます。`
                : `Section ${index + 1} of ${HOME_SECTIONS.length}. Use the left and right arrow keys or 1–4 to switch.`}
            </p>
          )}
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
    `rounded px-2 py-1 text-[11px] font-semibold transition-[color,background-color,scale] duration-150 ease-out motion-safe:active:scale-[0.96] ${
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

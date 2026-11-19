"use client";

import { Fragment, useLayoutEffect, useRef } from "react";
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

  // 現在地は塗りではなく、下の目盛り（.nav-tick）が滑って示す。文字は白く太くするだけ。
  // スマホの下部タブは 5 区画（320px で約 58px 幅）。12px で読めるよう、スマホだけ短いラベル
  // （copy.header.tabShort: /Work・/Mail など）を出し、PC は元のラベルのまま。読み上げ名は aria-label で元の語にする
  const linkClass =
    "relative inline-flex h-full w-full items-center justify-center whitespace-nowrap rounded-[3px] px-0.5 text-xs tracking-normal text-green-100 sm:px-1.5 sm:text-sm sm:tracking-wide transition-[color,scale] duration-150 ease-out hover:text-white focus-visible:text-white motion-safe:active:scale-[0.97] aria-[current=page]:font-semibold aria-[current=page]:text-white sm:h-auto sm:min-h-8 sm:w-auto";

  const headerRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const tickRef = useRef<HTMLLIElement>(null);

  // 実際のヘッダーの高さを --header-h に入れる。html の scroll-padding-top がこれを使い、
  // アンカー・スキップリンク・フォーカス移動の行き先がヘッダーの下に隠れないようにする。
  // JS 無しのときは globals.css の固定値に戻る
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const root = document.documentElement;
    const write = () => {
      root.style.setProperty(
        "--header-h",
        `${Math.ceil(header.getBoundingClientRect().height)}px`,
      );
    };
    write();
    const ro = new ResizeObserver(write);
    ro.observe(header);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--header-h");
    };
  }, []);

  // 少しでもスクロールしたら <html data-header-solid> を付け、ヘッダーを不透明のバーにする。
  // 透明になるのは CSS 側で「Home セクション かつ data-header-solid 無し」のときだけ
  useLayoutEffect(() => {
    const root = document.documentElement;
    const update = () => {
      if (window.scrollY > 4) root.dataset.headerSolid = "";
      else delete root.dataset.headerSolid;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      delete root.dataset.headerSolid;
    };
  }, []);

  // 目盛りを現在地のリンクの下へ動かす（transform だけを動かす。幅は scaleX で合わせる）
  useLayoutEffect(() => {
    const list = listRef.current;
    const tick = tickRef.current;
    if (!list || !tick || !enhanced) return;
    const place = () => {
      const link = list.querySelector<HTMLElement>('[aria-current="page"]');
      if (!link) {
        tick.dataset.ready = "";
        tick.style.opacity = "0";
        return;
      }
      const l = list.getBoundingClientRect();
      const r = link.getBoundingClientRect();
      // スマホの下部タブ（fixed）は区画より少し短く、PC は文字幅（左右の余白 6px を除く）に合わせる
      const inset =
        getComputedStyle(list).position === "fixed"
          ? Math.min(18, r.width * 0.2)
          : 6;
      const x = r.left - l.left + inset;
      const w = Math.max(8, r.width - inset * 2);
      tick.style.opacity = "1";
      tick.style.transform = `translate3d(${x}px,0,0) scaleX(${w})`;
      // 最初の配置はアニメーションさせない（読み込み直後に横から滑ってこないように）
      if (tick.dataset.ready === undefined) {
        requestAnimationFrame(() => {
          tick.dataset.ready = "";
        });
      }
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(list);
    return () => ro.disconnect();
  }, [active, enhanced, locale]);

  return (
    // 上端から下端まで不透明のバー（.site-header）。外側に余白（margin）を作らず、
    // 2 枚のパネルの間や上の余白から本文が透けないようにする。
    // Home の先頭だけ CSS がバーを透明にし、パネルの周りに星空を見せる
    <header ref={headerRef} className="site-header sticky inset-x-0 top-0 z-30">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-stretch gap-3 px-2 py-1.5 sm:px-6 sm:pt-8 sm:pb-4 md:flex-row md:items-stretch md:justify-between md:gap-4 lg:gap-6 lg:px-8">
        <div
          aria-hidden="true"
          className="hidden min-h-[68px] w-full items-center rounded-[6px] border border-green-300/40 bg-zinc-950/95 px-4 py-2.5 font-mono text-sm tracking-wide text-green-100 sm:inline-flex sm:text-base md:w-auto md:shrink-0 lg:w-full lg:max-w-[340px]"
        >
          <span className="font-semibold text-green-100">Burst Style</span>
        </div>
        <nav
          aria-label="Primary navigation"
          onPointerEnter={() => {
            preloadShaderTransition();
            void import("../visuals/PlanetInterior");
          }}
          className="relative w-full rounded-[6px] border border-green-300/40 bg-zinc-950/95 px-3 py-1 font-mono text-xs tracking-wide text-left text-green-100 sm:min-h-[68px] sm:px-4 sm:py-2.5 sm:text-sm md:min-w-0 md:flex-1 lg:max-w-[760px]"
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
                className="flex min-w-0 items-baseline gap-1.5 truncate text-[11px] text-green-100 sm:ml-auto sm:text-xs"
              >
                <span className="tabular-nums text-green-200/80">
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
          <div className="contents sm:mt-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-1 lg:gap-x-6">
            <div
              className="hidden shrink-0 items-center gap-0.5 rounded-md border border-green-300/35 bg-black/40 p-0.5 sm:flex"
              role="group"
              aria-label={copy.header.langToggle}
            >
              <LangButtons locale={locale} setLocale={setLocale} copy={copy} />
            </div>
            {/* スマホでは画面下の固定タブバー（親指で届く位置）。PC ではヘッダー内に並べる */}
            <ul
              ref={listRef}
              className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(3.5rem+env(safe-area-inset-bottom))] grid-cols-5 gap-1 border-t border-green-300/30 bg-[rgb(7_7_11)] px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] sm:relative sm:z-auto sm:flex sm:h-auto sm:w-auto sm:flex-wrap sm:items-center sm:gap-x-4 sm:border-0 lg:gap-x-6 sm:bg-transparent sm:p-0"
            >
              {enhanced && (
                // 現在地の目盛り。スマホは下部タブの上辺、PC はリンクの下を滑る
                <li ref={tickRef} aria-hidden="true" className="nav-tick" />
              )}
              {HOME_SECTIONS.map((section, i) => (
                <Fragment key={section}>
                  <li className="h-full sm:h-auto">
                    <a
                      href={SECTION_HREF[section]}
                      aria-current={
                        // JS 無し（縦に並ぶ表示）では現在地が決まらないので付けない
                        enhanced && active === section ? "page" : undefined
                      }
                      aria-keyshortcuts={enhanced ? String(i + 1) : undefined}
                      aria-label={HOME_SECTION_LABELS[section]}
                      className={linkClass}
                    >
                      <span className="sm:hidden">
                        {copy.header.tabShort[section]}
                      </span>
                      <span className="hidden sm:inline">
                        /{HOME_SECTION_LABELS[section]}
                      </span>
                    </a>
                  </li>
                  {section === "projects" && (
                    // 作品一覧への常設リンク（タッチでもいつでも届く「作品一覧へスキップ」）。
                    // SkipToWork と同じく素の <a>：HomeSections のハッシュ処理と JS 無しのアンカーを通す。
                    // 現在地の目盛りはセクションの /Projects に残すので aria-current は付けない
                    <li className="h-full sm:h-auto">
                      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                      <a
                        href="/#projects-index"
                        aria-label={copy.header.indexLinkName}
                        className={linkClass}
                      >
                        <span className="sm:hidden">
                          {copy.header.tabShort.index}
                        </span>
                        <span className="hidden sm:inline">
                          {copy.header.indexLink}
                        </span>
                      </a>
                    </li>
                  )}
                </Fragment>
              ))}
            </ul>
            {enhanced && (
              <p
                aria-hidden="true"
                className="ml-auto hidden text-[11px] tracking-wider text-green-200/75 xl:block"
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

"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { useLocale, useSiteCopy } from "../../lib/locale";
import { sectionPageLabel } from "../../lib/homeSections";
import dynamic from "next/dynamic";

const GlitchText = dynamic(() => import("../ui/GlitchText"), {
  ssr: false,
  loading: () => <span>Eric Kei.</span>,
});
const TechCarousel = dynamic(() => import("../ui/TechCarousel"), {
  ssr: false,
});

/**
 * Home の最初の画面。中央に浮かぶカードではなく、左に寄せた計器の読み出しとして組む。
 * - 見出しは大きく字間を詰め、左揃え。PC では右側を宇宙（3D）に空けておく
 * - 本文は行長を決めて左揃え。左に短い計器ラベルの列を置き、罫線と余白だけで区切る
 */
export default function Top() {
  const copy = useSiteCopy();
  const { locale } = useLocale();
  const [descriptionVisible, setDescriptionVisible] = useState(false);
  const [skillsVisible, setSkillsVisible] = useState(false);
  const [showTechCarousel, setShowTechCarousel] = useState(false);

  const carouselTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t2 = setTimeout(() => setSkillsVisible(true), 700);
    return () => clearTimeout(t2);
  }, []);

  useEffect(() => {
    if (showTechCarousel) return;
    const target = carouselTriggerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowTechCarousel(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px 0px 100px 0px", threshold: 0.01 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [showTechCarousel]);

  const showDescription = useCallback(() => {
    setDescriptionVisible(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        ["INPUT", "TEXTAREA", "BUTTON", "SELECT", "A"].includes(target.tagName)
      )
        return;
      if (e.key === "Enter") {
        showDescription();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDescription]);

  const ja = locale === "ja";

  return (
    <section id="top" className="relative min-h-screen w-full">
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8 lg:pt-14 short-phone:pt-2">
        {/* 読み出しの列：PC では左 2/3 ほどだけを使い、右は宇宙に空ける */}
        <div
          data-sonta-avoid=""
          className="instrument-panel px-5 pt-4 pb-7 sm:px-8 sm:pt-5 sm:pb-9 lg:w-[min(100%,56rem)] short-phone:px-4 short-phone:pt-2 short-phone:pb-3"
        >
          <p
            aria-hidden="true"
            className="instrument-label enter-rise flex items-center justify-between gap-4 border-b border-white/10 pb-3 short-phone:pb-1.5"
          >
            <span>[{sectionPageLabel("home")}] ~/home</span>
            <span className="tabular-nums text-zinc-400">
              tty0 · {ja ? "JA" : "EN"}
            </span>
          </p>

          <h1 className="enter-rise mt-8 text-left text-white [--i:1] sm:mt-12 short-phone:mt-2">
            <span className="block font-mono text-lg font-normal tracking-normal text-green-300 sm:text-2xl short-phone:text-sm">
              <span className="text-[rgb(var(--planet-accent))]">&gt;</span>{" "}
              <span className="title-char">Hello, I&apos;m</span>
            </span>
            <span className="mt-2 flex items-end font-sans text-[clamp(3.25rem,12vw,9.5rem)] leading-[0.88] font-black tracking-[-0.055em] sm:mt-3 short-phone:mt-1 short-phone:text-[2.5rem]">
              <span className="inline-block pb-[0.06em]">
                <GlitchText text="Eric Kei." />
              </span>
              <span
                aria-hidden="true"
                className="hero-cursor ml-[0.06em] font-mono text-[0.5em] leading-none text-[rgb(var(--planet-accent))]"
              >
                _
              </span>
            </span>
          </h1>

          {/* 計器ラベル（左）と読み出し（右）の 2 列。スマホではラベルが上に乗る */}
          <dl className="mt-10 grid gap-x-8 gap-y-2 border-t border-white/10 pt-6 font-mono sm:mt-14 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-y-6 short-phone:mt-2 short-phone:pt-2">
            <dt className="instrument-label enter-rise pt-1 [--i:2] short-phone:sr-only">
              {ja ? "接続" : "link"}
            </dt>
            <dd className="loading-text enter-rise text-base leading-relaxed text-green-300 [--i:2] sm:text-xl short-phone:text-[13px] short-phone:leading-normal">
              {copy.hero.establishing}
              <br />
              {copy.hero.question}{" "}
              <button
                type="button"
                onClick={showDescription}
                className={`trigger-btn ml-1 inline-block rounded-[3px] border px-2 py-0.5 align-middle font-mono text-xs transition-[color,background-color,border-color,scale] duration-150 ease-out motion-safe:active:scale-[0.97] ${
                  descriptionVisible
                    ? "pointer-events-none cursor-default border-zinc-700 bg-zinc-900 text-zinc-400"
                    : "hero-enter-key cursor-pointer border-green-300/50 bg-zinc-950 text-green-100 hover:border-[rgb(var(--planet-accent))] hover:text-white"
                }`}
              >
                /Enter
                {/* 読み上げ名に表示テキスト「/Enter」を含めるため、aria-labelではなく補足テキストで説明する */}
                <span className="sr-only"> {copy.hero.enterAria}</span>
              </button>
            </dd>
            <dt className="instrument-label enter-rise mt-4 pt-1 [--i:3] sm:mt-0 short-phone:sr-only">
              {ja ? "概要" : "brief"}
            </dt>
            {/* 行長は和文で 34 字前後、欧文で 65 字前後に収める。
                サーバーは英語で描き、ブラウザが日本語なら描画後に切り替わるので、
                英語の高さ（長いほう）を最小の高さとして確保し、下のカルーセルを動かさない */}
            <dd className="enter-rise min-h-[10.75rem] max-w-[34em] text-[15px] leading-[1.8] text-green-200 [--i:3] sm:min-h-[11.5rem] sm:text-base md:min-h-[8rem] short-phone:min-h-[6.5rem] short-phone:text-xs short-phone:leading-[1.55] short-phone:max-[359px]:min-h-[7.75rem]">
              <span
                className={`desc-char block transition-opacity duration-200 ease-out ${descriptionVisible ? "opacity-100" : "opacity-0"}`}
              >
                {copy.hero.tagline1}
              </span>
              <span
                className={`desc-char mt-2 block transition-opacity duration-200 ease-out ${descriptionVisible ? "opacity-100 delay-75" : "opacity-0"}`}
              >
                {copy.hero.tagline2}
              </span>
            </dd>
          </dl>
        </div>
      </div>

      {/* テックカルーセル（全幅）。見出しは左寄せの計器ラベルと罫線にする */}
      <div className="relative z-10 mt-14 min-h-[320px] w-full sm:mt-20 short-phone:mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            className={`tech-carousel-title flex items-center gap-3 font-mono text-lg text-green-100 transition-opacity duration-200 md:text-xl ${
              skillsVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <span
              data-sonta-avoid=""
              className="rounded-[3px] border border-white/15 bg-[rgb(7_7_11/0.95)] px-2.5 py-1"
            >
              <span className="text-[rgb(var(--planet-accent))]">&gt;</span> My
              Skills
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-white/15" />
          </h2>
        </div>
        <div ref={carouselTriggerRef} className="min-h-[240px]">
          {showTechCarousel ? (
            <TechCarousel />
          ) : (
            <div className="h-[240px]" aria-hidden="true" />
          )}
        </div>
      </div>
    </section>
  );
}

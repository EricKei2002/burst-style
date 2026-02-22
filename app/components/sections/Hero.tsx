"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import MagneticButton from "../ui/MagneticButton";
import Header from "./Header";
import dynamic from "next/dynamic";

const GlitchText = dynamic(() => import("../ui/GlitchText"), {
  ssr: false,
  loading: () => <span>Eric Kei.</span>,
});
const TechCarousel = dynamic(() => import("../ui/TechCarousel"), {
  ssr: false,
});

export default function Top() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const [introVisible] = useState(true);
  const [descriptionVisible, setDescriptionVisible] = useState(false);
  const [skillsVisible, setSkillsVisible] = useState(false);
  const [showTechCarousel, setShowTechCarousel] = useState(false);
  
  useEffect(() => {
    const t2 = setTimeout(() => setSkillsVisible(true), 700);
    return () => clearTimeout(t2);
  }, []);

  useEffect(() => {
    if (!skillsVisible || showTechCarousel) return;
    let activated = false;
    const activate = () => {
      if (activated) return;
      activated = true;
      setShowTechCarousel(true);
    };

    const onFirstInteraction = () => activate();
    window.addEventListener("pointerdown", onFirstInteraction, { once: true, passive: true });
    window.addEventListener("scroll", onFirstInteraction, { once: true, passive: true });
    window.addEventListener("keydown", onFirstInteraction, { once: true });

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(activate, { timeout: 6000 });
      return () => {
        window.cancelIdleCallback(id);
        window.removeEventListener("pointerdown", onFirstInteraction);
        window.removeEventListener("scroll", onFirstInteraction);
        window.removeEventListener("keydown", onFirstInteraction);
      };
    }

    const timer = setTimeout(activate, 6000);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("scroll", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };
  }, [showTechCarousel, skillsVisible]);

  const showDescription = useCallback(() => {
    setDescriptionVisible(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "BUTTON", "SELECT", "A"].includes(target.tagName)) return;
      if (e.key === "Enter") {
        showDescription();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDescription]);

  return (
    <section id="top" ref={containerRef} className="relative flex min-h-screen w-full flex-col overflow-hidden">
      <Header />

      <div className="relative flex flex-1 flex-col pt-8 sm:pt-10 lg:pt-12">
        <div ref={flashRef} className="pointer-events-none fixed inset-0 z-60 bg-white opacity-0 mix-blend-overlay"></div>

        {/* 前景のテキストコンテンツ */}
        <div className="container relative z-10 mx-auto flex w-full flex-1 items-center justify-center px-6">
          <div ref={textRef} className="flex flex-col items-center justify-center space-y-8 text-center bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl ring-1 ring-white/5">
            <h1 className="text-5xl font-black tracking-tighter text-white sm:text-7xl lg:text-9xl flex flex-col items-center gap-2">
              <div className={`flex items-center justify-center transition-opacity duration-500 ${introVisible ? "opacity-100" : "opacity-0"}`}>
                <span className="font-mono text-fuchsia-300 mr-2">&gt;</span>
                <span className="title-char">Hello, I&apos;m</span>
              </div>
              <div className={`flex items-center justify-center transition-opacity duration-500 ${introVisible ? "opacity-100" : "opacity-0"}`}>
                <div className="font-mono pb-2 inline-block">
                  <GlitchText text="Eric Kei." />
                </div>
                <span className="animate-pulse font-mono text-fuchsia-300 ml-1 pb-2">_</span>
              </div>
            </h1>

            <div className="max-w-3xl w-full px-4 mt-8 text-left">
              <div className={`loading-text font-mono text-green-300 text-xl md:text-2xl mb-8 mt-4 transition-opacity duration-500 ${introVisible ? "opacity-100" : "opacity-0"}`}>
                &gt; ESTABLISHING CONNECTION...<br />
                &gt; What is Burst Style ? 
                <MagneticButton className="ml-2 inline-block">
                  {/* アクセシビリティのためspanからbuttonに変更 */}
                  <button
                    type="button"
                    onClick={showDescription}
                    className={`trigger-btn rounded border border-green-300/45 bg-zinc-950/95 px-2 py-0.5 text-green-100 transition-colors inline-block font-mono text-xs ${
                      descriptionVisible ? "opacity-60 cursor-default pointer-events-none" : "cursor-pointer animate-pulse hover:bg-fuchsia-500/20 hover:text-fuchsia-100"
                    }`}
                    aria-label="詳細を表示する"
                  >
                    /Enter
                  </button>
                </MagneticButton>
              </div>
              <p className="text-sm leading-relaxed text-green-300 sm:text-base font-mono mb-6">
                <span className={`desc-char transition-opacity duration-500 ${descriptionVisible ? "opacity-100" : "opacity-0"}`}>
                  &quot;Burst Style&quot; — 創造性を爆発させ、未知の体験を形にする。
                </span>
                <br className="hidden sm:block" />
                <span className={`desc-char transition-opacity duration-500 ${descriptionVisible ? "opacity-100" : "opacity-0"}`}>
                  Webエンジニアとしての情熱を原動力に、既存の枠を打ち破る新しい価値を実装します。
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* テックカルーセル（全幅） */}
        <div className="relative z-10 mt-10 w-full min-h-[320px] sm:mt-12">
          <h2
            className={`mx-auto mb-8 flex w-fit rounded-md border border-green-300/40 bg-zinc-950/95 px-4 py-2 text-center font-mono text-xl text-green-100 tech-carousel-title transition-opacity duration-500 md:text-2xl ${
              skillsVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            &gt; My Skills
          </h2>
          <div className="min-h-[240px]">
            {showTechCarousel ? <TechCarousel /> : <div className="h-[240px]" aria-hidden="true" />}
          </div>
        </div>
      </div>

    </section>
  );
}

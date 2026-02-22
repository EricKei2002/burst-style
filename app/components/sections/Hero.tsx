"use client";

import { useCallback, useRef, useEffect, useMemo, useState } from "react";
import { useTransitionStore } from "../../lib/store";
import MagneticButton from "../ui/MagneticButton";
import Header from "./Header";
import dynamic from "next/dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HeroStarsCanvas = dynamic(() => import("./HeroStarsCanvas") as any, { ssr: false }) as React.ComponentType<{
  isWarping: boolean;
  starCount: number;
  qualityTier: "high" | "mid" | "low";
}>;

const GlitchText = dynamic(() => import("../ui/GlitchText"), {
  ssr: false,
  loading: () => <span>Eric Kei.</span>,
});
const TechCarousel = dynamic(() => import("../ui/TechCarousel"), {
  ssr: false,
});

const SplitText = ({
  children,
  className = "",
  charClassName = "",
  revealed = false,
}: {
  children: string;
  className?: string;
  charClassName?: string;
  revealed?: boolean;
}) => {
  return (
    <span className={`${className}`}>
      {children.split("").map((char, i) => (
        <span key={i} className={`char inline-block transition-opacity duration-300 ${revealed ? "opacity-100" : "opacity-0"} ${charClassName}`}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
};

export default function Top() {
  const containerRef = useRef<HTMLElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const [introVisible, setIntroVisible] = useState(false);
  const [descriptionVisible, setDescriptionVisible] = useState(false);
  const [skillsVisible, setSkillsVisible] = useState(false);
  const [showTechCarousel, setShowTechCarousel] = useState(false);

  // グローバルストアのワープ状態を使用
  const { isWarping, setIsWarping } = useTransitionStore();

  // ページ遷移（戻る）で戻ってきた場合、ワープ状態を解除する（着陸エフェクト）
  useEffect(() => {
    if (isWarping) {
        // 少し遅延させてからワープを解除し、減速して着陸するような演出にする
        const timer = setTimeout(() => {
            setIsWarping(false);
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [isWarping, setIsWarping]);
  
  useEffect(() => {
    const t1 = setTimeout(() => setIntroVisible(true), 120);
    const t2 = setTimeout(() => setSkillsVisible(true), 700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (!skillsVisible || showTechCarousel) return;
    const activate = () => setShowTechCarousel(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(activate, { timeout: 2200 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(activate, 900);
    return () => clearTimeout(timer);
  }, [showTechCarousel, skillsVisible]);

  const [showCanvas, setShowCanvas] = useState(false);
  const [isHeroInView, setIsHeroInView] = useState(false);
  const [deviceProfile] = useState(() => {
    if (typeof window === "undefined") {
      return { canRender3D: false, qualityTier: "low" as const, isMobile3D: false };
    }

    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    const saveData = connection?.saveData ?? false;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const cpuCores = navigator.hardwareConcurrency ?? 8;
    const veryLowSpec = deviceMemory <= 2 || cpuCores <= 2;
    const lowSpec = deviceMemory <= 4 || cpuCores <= 4 || isMobile;
    const isMobile3D = isMobile && !reducedMotion && !saveData && !veryLowSpec;
    const canRender3D = !reducedMotion && !saveData && !veryLowSpec && (!isMobile || isMobile3D);

    return {
      canRender3D,
      isMobile3D,
      qualityTier: canRender3D ? (lowSpec ? "mid" as const : "high" as const) : ("low" as const),
    };
  });

  const canRender3D = deviceProfile.canRender3D;
  const isMobile3D = deviceProfile.isMobile3D;
  const qualityTier = deviceProfile.qualityTier;

  const starCount = useMemo(() => {
    if (isMobile3D) return 220;
    if (qualityTier === "high") return 1400;
    if (qualityTier === "mid") return 900;
    return 500;
  }, [isMobile3D, qualityTier]);

  useEffect(() => {
    const target = canvasHostRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroInView(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!canRender3D || !isHeroInView || showCanvas) return;

    const activate = () => setShowCanvas(true);

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(activate, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = setTimeout(activate, 900);
    return () => clearTimeout(timer);
  }, [canRender3D, isHeroInView, showCanvas]);

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
        {/* 背景の星 */}
        <div ref={canvasHostRef} className="absolute inset-0 z-0">
          {showCanvas && canRender3D && isHeroInView && (
            <HeroStarsCanvas isWarping={isWarping} starCount={starCount} qualityTier={qualityTier} />
          )}
        </div>

        <div ref={flashRef} className="pointer-events-none fixed inset-0 z-60 bg-white opacity-0 mix-blend-overlay"></div>

        {/* 前景のテキストコンテンツ */}
        <div className="container relative z-10 mx-auto flex w-full flex-1 items-center justify-center px-6">
          <div ref={textRef} className="flex flex-col items-center justify-center space-y-8 text-center bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl ring-1 ring-white/5">
            
            <h1 className="text-5xl font-black tracking-tighter text-white sm:text-7xl lg:text-9xl flex flex-col items-center gap-2">
              <div className={`flex items-center justify-center transition-opacity duration-500 ${introVisible ? "opacity-100" : "opacity-0"}`}>
                <span className="font-mono text-fuchsia-300 mr-2">&gt;</span>
                <SplitText revealed={introVisible} charClassName="title-char">Hello, I&apos;m</SplitText>
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
                    className={`trigger-btn px-1 rounded transition-colors inline-block font-mono text-xs ${
                      descriptionVisible ? "opacity-50 cursor-default pointer-events-none" : "cursor-pointer animate-pulse hover:bg-green-500/20"
                    }`}
                    aria-label="詳細を表示する"
                  >
                    /Enter
                  </button>
                </MagneticButton>
              </div>
              <p className="text-sm leading-relaxed text-green-300 sm:text-base font-mono mb-6">
                <SplitText revealed={descriptionVisible} charClassName="desc-char">&quot;Burst Style&quot; — 創造性を爆発させ、未知の体験を形にする。</SplitText>
                <br className="hidden sm:block" />
                <SplitText revealed={descriptionVisible} charClassName="desc-char">Webエンジニアとしての情熱を原動力に、既存の枠を打ち破る新しい価値を実装します。</SplitText>
              </p>
            </div>
          </div>
        </div>

        {/* テックカルーセル（全幅） */}
        <div className="relative z-10 mt-10 w-full min-h-[320px] sm:mt-12">
          <h2
            className={`mb-8 text-center font-mono text-xl text-green-300 tech-carousel-title transition-opacity duration-500 md:text-2xl ${
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

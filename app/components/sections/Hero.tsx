"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTransitionStore } from "../../lib/store";
import TechCarousel from "../ui/TechCarousel";
import DecryptedText from "../ui/DecryptedText";
import GlitchText from "../ui/GlitchText";
import MagneticButton from "../ui/MagneticButton";
import dynamic from "next/dynamic";

// Three.jsのバンドルパースを初期ロードから完全に切り離す
// モバイルではshowCanvas=falseなのでThree.jsが一切読み込まれない
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HeroCanvas = dynamic(() => import("./HeroCanvas") as any, { ssr: false }) as React.ComponentType<{
  isWarping: boolean;
  starCount: number;
  qualityTier: "high" | "mid" | "low";
}>;

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const SplitText = ({ children, className = "", charClassName = "" }: { children: string; className?: string; charClassName?: string }) => {
  return (
    <span className={`${className}`}>
      {children.split("").map((char, i) => (
        <span key={i} className={`char inline-block opacity-0 ${charClassName}`}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
};

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const mainTlRef = useRef<gsap.core.Timeline | null>(null);


  const flashRef = useRef<HTMLDivElement>(null);

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
  
  const { contextSafe } = useGSAP(() => {
    // プリローダー削除後：メインアニメーションを即座に再生
    const tl = gsap.timeline();
    
    tl.to(".title-char", {
      opacity: 1,
      duration: 0.05,
      stagger: 0.08,
      ease: "none",
    })
    .to(".loading-text", {
      opacity: 1,
      duration: 0.1,
    })
    .to([".tech-carousel", ".tech-carousel-title"], {
       opacity: 1,
       duration: 0.8,
       delay: 0.5
    });

    mainTlRef.current = tl;

  }, { scope: containerRef });

  const [showCanvas, setShowCanvas] = useState(false);
  const [isHeroInView, setIsHeroInView] = useState(false);
  const [deviceProfile] = useState(() => {
    if (typeof window === "undefined") {
      return { canRender3D: false, qualityTier: "low" as const };
    }

    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    const saveData = connection?.saveData ?? false;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const cpuCores = navigator.hardwareConcurrency ?? 8;
    const lowSpec = deviceMemory <= 4 || cpuCores <= 4;
    const canRender3D = !(isMobile || reducedMotion || saveData);

    return {
      canRender3D,
      qualityTier: canRender3D ? (lowSpec ? "mid" as const : "high" as const) : ("low" as const),
    };
  });

  const canRender3D = deviceProfile.canRender3D;
  const qualityTier = deviceProfile.qualityTier;

  const starCount = useMemo(() => {
    if (qualityTier === "high") return 1400;
    if (qualityTier === "mid") return 900;
    return 500;
  }, [qualityTier]);

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



  const showDescription = contextSafe(() => {
    const tl = gsap.timeline();

    tl.to(".desc-char", {
      opacity: 1,
      duration: 0.03,
      stagger: 0.02,
      ease: "none",
    })
    
    // 点滅を停止し、アクティブ状態を示すようにスタイルを変更
    .to(".trigger-btn", { 
      opacity: 0.5, 
      pointerEvents: "none",
      className: "trigger-btn font-mono text-xs opacity-50 cursor-default" 
    }, "<")

    // コマンドプロンプトシーケンス
    .to(".command-prompt", {
      opacity: 1,
      duration: 0.1,
      delay: 0.5
    })
    .to(".ls-char", {
      opacity: 1,
      duration: 0.05,
      stagger: 0.1,
      ease: "none",
    })
    .to(".ls-result", {
      opacity: 1,
      duration: 0.1,
      stagger: 0.05,
      delay: 0.2
    });
  });

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
      <header className="sticky inset-x-0 top-0 z-30 border-b border-white/10 bg-black/75 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <a
            href="#top"
            aria-label="ページトップへ移動"
            className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:text-fuchsia-400"
          >
            Burst Style
          </a>
          <nav className="flex items-center gap-5 font-mono text-xs uppercase tracking-wider text-zinc-400">
            <a href="#projects" aria-label="Projectsセクションへ移動" className="transition-colors hover:text-fuchsia-400">
              Projects
            </a>
            <a href="#about" aria-label="Aboutセクションへ移動" className="transition-colors hover:text-fuchsia-400">
              About
            </a>
            <a href="#contact" aria-label="Contactセクションへ移動" className="transition-colors hover:text-fuchsia-400">
              Contact
            </a>
          </nav>
        </div>
      </header>

      <div className="relative flex flex-1 flex-col items-center justify-center">
        {/* 背景の星 */}
        <div ref={canvasHostRef} className="absolute inset-0 z-0">
          {showCanvas && canRender3D && isHeroInView && (
            <HeroCanvas isWarping={isWarping} starCount={starCount} qualityTier={qualityTier} />
          )}
        </div>

        <div ref={flashRef} className="pointer-events-none fixed inset-0 z-60 bg-white opacity-0 mix-blend-overlay"></div>

        {/* 前景のテキストコンテンツ */}
        <div className="container relative z-10 mx-auto px-6">
          <div ref={textRef} className="flex flex-col items-center justify-center space-y-8 text-center bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl ring-1 ring-white/5">
            
            <h1 className="text-5xl font-black tracking-tighter text-white sm:text-7xl lg:text-9xl flex flex-col items-center gap-2">
              <div className="flex items-center justify-center">
                <span className="font-mono text-fuchsia-400 mr-2">&gt;</span>
                <SplitText charClassName="title-char">Hello, I&apos;m</SplitText>
              </div>
              <div className="flex items-center justify-center">
                <div className="font-mono pb-2 title-char inline-block">
                  <GlitchText text="Eric Kei." />
                </div>
                <span className="animate-pulse font-mono text-fuchsia-400 ml-1 pb-2">_</span>
              </div>
            </h1>
            
            <div className="max-w-3xl w-full px-4 mt-8 text-left">
              <div className="loading-text font-mono text-green-500 text-xl md:text-2xl mb-8 mt-4 opacity-0">
                &gt; ESTABLISHING CONNECTION...<br />
                &gt; What is Burst Style ? 
                <MagneticButton className="ml-2 inline-block">
                  {/* アクセシビリティのためspanからbuttonに変更 */}
                  <button
                    type="button"
                    onClick={showDescription}
                    className="trigger-btn cursor-pointer animate-pulse hover:bg-green-500/20 px-1 rounded transition-colors inline-block font-mono text-xs"
                    aria-label="詳細を表示する"
                  >
                    /Enter
                  </button>
                </MagneticButton>
              </div>
              <p className="text-sm leading-relaxed text-green-500 sm:text-base font-mono mb-6">
                <SplitText charClassName="desc-char">&quot;Burst Style&quot; — 創造性を爆発させ、未知の体験を形にする。</SplitText>
                <br className="hidden sm:block" />
                <SplitText charClassName="desc-char">Webエンジニアとしての情熱を原動力に、既存の枠を打ち破る新しい価値を実装します。</SplitText>
              </p>

              {/* コマンドプロンプトエリア */}
              <div className="font-mono text-green-500 text-sm sm:text-base">
                <div className="command-prompt opacity-0 flex items-center gap-2 mb-2 flex-wrap sm:flex-nowrap">
                  <span className="text-fuchsia-400">Eric Kei<span className="text-zinc-400">@</span><span className="text-green-500">Burst Style</span> <span className="text-zinc-400">~ &gt;</span></span>
                  <SplitText charClassName="ls-char">ls</SplitText>
                </div>
                <div className="flex flex-wrap gap-4 sm:gap-6 pl-4">
                  <MagneticButton>
                      <a href="#projects" className="ls-result opacity-0 hover:text-fuchsia-400 hover:underline decoration-fuchsia-400 decoration-2 underline-offset-4 transition-all block p-2">
                          <DecryptedText text="/Projects" animateOnHover speed={30} className="font-bold" />
                      </a>
                  </MagneticButton>
                  <MagneticButton>
                      <a href="#about" className="ls-result opacity-0 hover:text-fuchsia-400 hover:underline decoration-fuchsia-400 decoration-2 underline-offset-4 transition-all block p-2">
                          <DecryptedText text="/About Me" animateOnHover speed={30} className="font-bold" />
                      </a>
                  </MagneticButton>
                  <MagneticButton>
                      <a href="#contact" className="ls-result opacity-0 hover:text-fuchsia-400 hover:underline decoration-fuchsia-400 decoration-2 underline-offset-4 transition-all block p-2">
                          <DecryptedText text="/Contact" animateOnHover speed={30} className="font-bold" />
                      </a>
                  </MagneticButton>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* テックカルーセル（全幅） */}
        <div className="w-full mt-16 relative z-10">
          <h2 className="text-center font-mono text-xl md:text-2xl text-green-500 mb-8 opacity-0 tech-carousel-title">
            &gt; My Skills
          </h2>
          <TechCarousel />
        </div>
      </div>

    </section>
  );
}

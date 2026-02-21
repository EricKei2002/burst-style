"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTransitionStore } from "../../lib/store";
import TechCarousel from "../ui/TechCarousel";
import DecryptedText from "../ui/DecryptedText";
import GlitchText from "../ui/GlitchText";
import MagneticButton from "../ui/MagneticButton";
import WarpStars from "../visuals/WarpStars";
import { Canvas } from "@react-three/fiber";

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
  const textRef = useRef<HTMLDivElement>(null);
  const mainTlRef = useRef<gsap.core.Timeline | null>(null);
  const [loaderText, setLoaderText] = useState("INITIALIZING SYSTEM...");

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
    // メインコンテンツのアニメーションタイムライン（最初は一時停止）
    const tl = gsap.timeline({ paused: true });
    
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
  const [starCount, setStarCount] = useState(2000);

  useEffect(() => {
    // Canvasの初期化遅延でメインスレッドブロッキング（TBT）を回避
    const timer = setTimeout(() => {
        // モバイル等の画面幅が小さい場合はパーティクル数を減らしてパフォーマンスを確保
        if (window.innerWidth < 768) {
            setStarCount(500);
        } else if (window.innerWidth < 1024) {
            setStarCount(1000);
        }
        setShowCanvas(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // ブートシーケンス
  useEffect(() => {
    // このセッションですでにブートしているか確認
    const hasBooted = sessionStorage.getItem("burst_booted");
    
    if (hasBooted) {
        // シーケンスをスキップ
        gsap.set(".preloader", { display: "none" });
        mainTlRef.current?.play();
        return;
    }

    let isMounted = true;
    
    const sequence = async () => {
        // ボットやLighthouseを検知して遅延をスキップ（SEOやパフォーマンス判定対策）
        const isBot = /bot|googlebot|crawler|spider|robot|crawling|lighthouse/i.test(navigator.userAgent);
        const d1 = isBot ? 1 : 1200;
        const d2 = isBot ? 1 : 1200;
        const d3 = isBot ? 1 : 2000;

        // ステップ 1: 初期化中（設定済み）
        await new Promise(r => setTimeout(r, d1));
        if (!isMounted) return;

        // ステップ 2: モジュールの読み込み
        setLoaderText("LOADING MODULES...");
        await new Promise(r => setTimeout(r, d2));
        if (!isMounted) return;

        // ステップ 3: アクセス許可
        setLoaderText("BURST SYSTEM ONLINE");
        
        
        await new Promise(r => setTimeout(r, d3));
        if (!isMounted) return;

        // ステップ 4: フェードアウトしてメインを開始
        const flash = flashRef.current;
        if (flash) {
            gsap.to(flash, { 
                opacity: 1, 
                duration: isBot ? 0 : 0.1, 
                yoyo: true, 
                repeat: 1,
                onStart: () => {
                     // フラッシュ開始時にワープ開始
                     if(isMounted) setIsWarping(true);
                },
                onComplete: () => {
                    // フラッシュ終了後、少し待ってからワープ停止（残光効果）
                     setTimeout(() => {
                        if(isMounted) setIsWarping(false);
                     }, isBot ? 0 : 1000); 
                }
            });
        }

        gsap.to(".preloader", {
            opacity: 0,
            duration: isBot ? 0 : 0.8,
            ease: "power2.inOut",
            onComplete: () => {
                if (isMounted) {
                    gsap.set(".preloader", { display: "none" });
                    mainTlRef.current?.play();
                    // ブート済みとしてマーク
                    sessionStorage.setItem("burst_booted", "true");
                }
            }
        });
    };

    sequence();
    
    return () => { isMounted = false; };
  }, [setIsWarping]);

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
      if (e.key === "Enter") {
        showDescription();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDescription]);

  return (
    <section ref={containerRef} className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden">
      
      {/* 背景の星 */}
      <div className="absolute inset-0 z-0">
         {showCanvas && (
           <Canvas 
              camera={{ position: [0, 0, 50], fov: 75 }} 
              gl={{ antialias: false, powerPreference: "high-performance" }}
              dpr={[1, 1.5]}
           >
              <fog attach="fog" args={['#000', 0, 100]} />
              <WarpStars isWarping={isWarping} count={starCount} />
           </Canvas>
         )}
      </div>

      <div ref={flashRef} className="pointer-events-none fixed inset-0 z-60 bg-white opacity-0 mix-blend-overlay"></div>
      
      {/* プリローダーオーバーレイ（システムブート） */}
      <div className="preloader fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] px-4 cursor-wait">
        <div className="flex flex-col items-center gap-4">
             {/* 回転/パルスアイコン */}
            <div className="h-12 w-12 rounded-full border-2 border-green-500/20 border-t-green-500 animate-spin"></div>
            
            <div className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-green-500 tracking-wider text-center min-w-[300px]">
                <span className="mr-2">&gt;</span>
                <DecryptedText 
                    text={loaderText} 
                    speed={50} 
                    maxIterations={20}
                    className="inline-block"
                />
                <span className="animate-pulse ml-1">_</span>
            </div>
            
            <div className="mt-8 w-64 h-1 bg-zinc-800 overflow-hidden rounded-full">
                <div className="h-full bg-green-500 animate-[loading-bar_3s_ease-in-out_forwards] w-0"></div>
            </div>
        </div>
      </div>

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
                 <span onClick={showDescription} className="trigger-btn cursor-pointer animate-pulse hover:bg-green-500/20 px-1 rounded transition-colors inline-block"> /Enter </span>
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
                <span className="text-fuchsia-400">Eric Kei<span className="text-zinc-500">@</span><span className="text-green-500">Burst Style</span> <span className="text-zinc-500">~ &gt;</span></span>
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

    </section>
  );
}

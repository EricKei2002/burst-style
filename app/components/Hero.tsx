"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TechCarousel from "./TechCarousel";
import DecryptedText from "./DecryptedText";
import GlitchText from "./GlitchText";
import MagneticButton from "./MagneticButton";

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

  const { contextSafe } = useGSAP(() => {
    // Main Content Animation Timeline (Paused initially)
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

  // Boot Sequence
  useEffect(() => {
    let isMounted = true;
    
    const sequence = async () => {
        // Step 1: Initializing (Already set)
        await new Promise(r => setTimeout(r, 1200));
        if (!isMounted) return;

        // Step 2: Loading Modules
        setLoaderText("LOADING MODULES...");
        await new Promise(r => setTimeout(r, 1200));
        if (!isMounted) return;

        // Step 3: Access Granted
        setLoaderText("BURST SYSTEM ONLINE");
        // Trigger Burst Effect right when text appears
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(200);
        }
        
        await new Promise(r => setTimeout(r, 2000));
        if (!isMounted) return;

        // Step 4: Fade out and Start Main
        const flash = flashRef.current;
        if (flash) {
            gsap.to(flash, { opacity: 1, duration: 0.1, yoyo: true, repeat: 1 });
        }
        
        // Shake effect on container
        gsap.fromTo(containerRef.current, 
            { x: -10 },
            { x: 10, duration: 0.05, repeat: 5, yoyo: true, clearProps: "x" }
        );

        gsap.to(".preloader", {
            opacity: 0,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: () => {
                if (isMounted) {
                    gsap.set(".preloader", { display: "none" });
                    mainTlRef.current?.play();
                }
            }
        });
    };

    sequence();
    
    return () => { isMounted = false; };
  }, []);

  const showDescription = contextSafe(() => {
    const tl = gsap.timeline();

    tl.to(".desc-char", {
      opacity: 1,
      duration: 0.03,
      stagger: 0.02,
      ease: "none",
    })
    
    // Stop blinking and change style to indicate active state
    .to(".trigger-btn", { 
      opacity: 0.5, 
      pointerEvents: "none",
      className: "trigger-btn font-mono text-xs opacity-50 cursor-default" 
    }, "<")

    // Command Prompt Sequence
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
      <div ref={flashRef} className="pointer-events-none fixed inset-0 z-60 bg-white opacity-0 mix-blend-overlay"></div>
      
      {/* Preloader Overlay (System Boot) */}
      <div className="preloader fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] px-4 cursor-wait">
        <div className="flex flex-col items-center gap-4">
             {/* Spinning/Pulse Icon */}
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

      {/* Foreground Text Content */}
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

            {/* Command Prompt Area */}
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

      {/* Tech Carousel (Full Width) */}
      <div className="w-full mt-16 relative z-10">
        <h2 className="text-center font-mono text-xl md:text-2xl text-green-500 mb-8 opacity-0 tech-carousel-title">
          &gt; My Skills
        </h2>
        <TechCarousel />
      </div>

    </section>
  );
}

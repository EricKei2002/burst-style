"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TechCarousel from "./TechCarousel";

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

  const { contextSafe } = useGSAP(() => {
    const tl = gsap.timeline();

    // Preloader Sequence
    tl.to(".welcome-char", {
      opacity: 1,
      duration: 0.05,
      stagger: 0.03,
      ease: "none",
    })
    .to(".welcome-char", {
      opacity: 0,
      duration: 0.5,
      delay: 1.0,
    })
    .to(".preloader", {
      opacity: 0,
      duration: 0.8,
      onComplete: () => {
         gsap.set(".preloader", { display: "none" });
      }
    })

    // Typewriter Effect for Title
    .to(".title-char", {
      opacity: 1,
      duration: 0.05,
      stagger: 0.08,
      ease: "none",
    }, "-=0.2")
    // Loading Sequence
    .to(".loading-text", {
      opacity: 1,
      duration: 0.1,
    })
    // Tech Carousel Fade In (Early reveal)
    .to([".tech-carousel", ".tech-carousel-title"], {
       opacity: 1,
       duration: 0.8,
       delay: 0.5
    });
  }, { scope: containerRef });

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

  return (
    <section ref={containerRef} className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden">
      
      {/* Preloader Overlay */}
      <div className="preloader fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a] px-4">
        <div className="text-4xl sm:text-6xl md:text-8xl font-black font-mono text-green-500 tracking-tighter text-center">
          <SplitText charClassName="welcome-char">
            &gt; Welcome to my portfolio website.
          </SplitText>
        </div>
      </div>

      {/* Foreground Text Content */}
      <div className="container relative z-10 mx-auto px-6">
        <div ref={textRef} className="flex flex-col items-center justify-center space-y-8 text-center">
          
          <h1 className="text-6xl font-black tracking-tighter text-white sm:text-8xl lg:text-9xl flex flex-col items-center gap-2">
            <div className="flex items-center justify-center">
              <span className="font-mono text-fuchsia-400 mr-2">&gt;</span>
              <SplitText charClassName="title-char">Hello, I&apos;m</SplitText>
            </div>
            <div className="flex items-center justify-center">
              <SplitText className="font-mono pb-2" charClassName="title-char">
                Eric Kei.
              </SplitText>
              <span className="animate-pulse font-mono text-fuchsia-400 ml-1 pb-2">_</span>
            </div>
          </h1>
          
          <div className="max-w-3xl w-full px-4 mt-8 text-left">
            <div className="loading-text font-mono text-green-500 text-sm mb-4 opacity-0">
               &gt; ESTABLISHING CONNECTION...<br />
               &gt; What is Burst Style ? <span onClick={showDescription} className="trigger-btn cursor-pointer animate-pulse hover:bg-green-500/20 px-1 rounded transition-colors inline-block">[ DONE ]</span>
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
             <div className="flex gap-6 pl-4">
                 <a href="#projects" className="ls-result opacity-0 hover:text-fuchsia-400 hover:underline decoration-fuchsia-400 decoration-2 underline-offset-4 transition-all">Projects/</a>
                 <a href="#about" className="ls-result opacity-0 hover:text-fuchsia-400 hover:underline decoration-fuchsia-400 decoration-2 underline-offset-4 transition-all">About/</a>
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

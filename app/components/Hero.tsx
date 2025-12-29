"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

const techStack = [
  { name: "TypeScript", icon: "TS", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" },
  { name: "React", icon: "⚛︎", color: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/10" },
  { name: "Next.js", icon: "▲", color: "text-white", border: "border-white/30", bg: "bg-white/10" },
  { name: "Tailwind", icon: "≋", color: "text-sky-400", border: "border-sky-500/30", bg: "bg-sky-500/10" },
];

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Mouse Move Effect for Parallax
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!editorRef.current) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;

    // Calculate normalized position (-1 to 1)
    const x = (clientX / innerWidth) * 2 - 1;
    const y = (clientY / innerHeight) * 2 - 1;

    setMousePosition({ x, y });
  };

  useEffect(() => {
    gsap.registerPlugin(ScrambleTextPlugin);

    const ctx = gsap.context(() => {
      // Intro Animation timeline
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        headlineRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2 }
      )
        .to(headlineRef.current, {
          scrambleText: {
            text: "Building Digital Experiences with Code.",
            chars: "01",
            speed: 0.3,
          },
          duration: 1.5,
        }, "-=0.5")
        .fromTo(
          subRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          "-=1"
        )
        .fromTo(
          ".tech-badge",
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, stagger: 0.1, duration: 0.6 },
          "-=0.5"
        )
        .fromTo(
          editorRef.current,
          { opacity: 0, scale: 0.9, rotateY: 15, rotateX: 10 },
          { opacity: 1, scale: 1, rotateY: -5, rotateX: 5, duration: 1.5, ease: "power2.out" },
          "-=1.5"
        );

    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Update 3D transforms based on mouse position
  useEffect(() => {
    if (!editorRef.current) return;

    gsap.to(editorRef.current, {
      rotateY: mousePosition.x * -10, // Invert for natural feel
      rotateX: mousePosition.y * 10,
      duration: 1,
      ease: "power2.out"
    });
  }, [mousePosition]);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative flex min-h-[90vh] w-full items-center justify-center overflow-hidden bg-[#0a0a0a] px-6 py-20 sm:px-12 md:py-32"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        {/* Glowing Orbs */}
        <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen animate-pulse-soft" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen animate-pulse-soft delay-1000" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">

        {/* Left Content */}
        <div className="flex flex-col justify-center space-y-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs font-mono text-zinc-400 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            Available for new projects
          </div>

          <div className="space-y-4">
            <h1
              ref={headlineRef}
              className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.1]"
            >
              Building Digital Experiences
            </h1>
            <p
              ref={subRef}
              className="max-w-xl text-lg text-zinc-400 leading-relaxed"
            >
              コードに意図を、デザインに根拠を。
              <br className="hidden sm:block" />
              実装ファーストのアプローチで、
              <span className="text-zinc-200">機能美</span>と
              <span className="text-zinc-200">没入感</span>のあるWebプロダクトを構築します。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className={`tech-badge flex items-center gap-2 rounded-lg border ${tech.border} ${tech.bg} px-4 py-2 backdrop-blur-sm transition hover:scale-105`}
              >
                <span className={`text-sm ${tech.color}`}>{tech.icon}</span>
                <span className="text-sm font-medium text-zinc-200">{tech.name}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <button className="group relative overflow-hidden rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
              <span className="relative z-10">View Projects</span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-zinc-300/50 to-transparent group-hover:animate-[shimmer_1s_infinite]" />
            </button>
            <button className="rounded-full border border-zinc-800 bg-black/20 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-zinc-900">
              Contact Me
            </button>
          </div>
        </div>

        {/* Right Content: 3D Code Editor */}
        <div className="perspective-1000 relative flex items-center justify-center lg:h-[600px]">
          <div
            ref={editorRef}
            className="transform-style-3d relative w-full max-w-lg rounded-xl border border-zinc-800 bg-[#0e0e0e]/90 shadow-2xl backdrop-blur-xl"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Editor Header */}
            <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="ml-4 text-xs font-mono text-zinc-500">profile.tsx — burst-style</div>
            </div>

            {/* Editor Body */}
            <div className="p-6 font-mono text-sm leading-7">
              <div className="flex">
                <div className="w-8 select-none flex-col gap-1 text-right text-zinc-700">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <div className="pl-4 text-zinc-300">
                  <div>
                    <span className="text-purple-400">const</span> <span className="text-yellow-200">Developer</span> <span className="text-zinc-500">=</span> <span className="text-purple-400">{"{"}</span>
                  </div>
                  <div className="pl-4">
                    name: <span className="text-green-400">&quot;Burst Style&quot;</span>,
                  </div>
                  <div className="pl-4">
                    role: <span className="text-green-400">&quot;Creative Developer&quot;</span>,
                  </div>
                  <div className="pl-4">
                    skills: <span className="text-purple-400">[</span>
                  </div>
                  <div className="pl-8">
                    <span className="text-green-400">&quot;Next.js&quot;</span>, <span className="text-green-400">&quot;TypeScript&quot;</span>,
                  </div>
                  <div className="pl-8">
                    <span className="text-green-400">&quot;WebGL&quot;</span>, <span className="text-green-400">&quot;Design Systems&quot;</span>
                  </div>
                  <div className="pl-4">
                    <span className="text-purple-400">]</span>,
                  </div>
                  <div className="pl-4">
                    status: <span className="text-blue-400">TASKS.CODING</span>
                  </div>
                  <div>
                    <span className="text-purple-400">{"}"}</span>;
                  </div>
                </div>
              </div>

              {/* Glowing effect behind text */}
              <div className="pointer-events-none absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl"></div>
            </div>

            {/* Floating Elements / Decoration */}
            <div className="absolute -right-12 -top-12 h-24 w-24 rounded-xl border border-zinc-700 bg-zinc-900/80 p-4 shadow-xl backdrop-blur-md translate-z-10 animate-slow-float">
              <div className="h-full w-full rounded bg-gradient-to-br from-purple-500/20 to-blue-500/20" />
            </div>
            <div className="absolute -bottom-8 -left-8 h-20 w-48 rounded-xl border border-zinc-800 bg-[#0a0a0a]/90 p-3 shadow-2xl backdrop-blur-md translate-z-20 animate-[slow-float_8s_infinite_reverse]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  ✓
                </div>
                <div>
                  <div className="text-xs text-zinc-500">System Check</div>
                  <div className="text-sm font-semibold text-white">All Systems Go</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


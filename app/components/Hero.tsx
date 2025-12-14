"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

const techStack = [
  { name: "TypeScript", icon: "TS", gradient: "from-sky-400 to-blue-500" },
  { name: "React", icon: "⚛︎", gradient: "from-cyan-400 to-sky-500" },
  { name: "Next.js", icon: "NX", gradient: "from-slate-900 to-zinc-800" },
  { name: "Node.js", icon: "ND", gradient: "from-emerald-400 to-emerald-600" },
  { name: "GSAP", icon: "🌀", gradient: "from-lime-300 to-emerald-400" },
  { name: "Tailwind CSS", icon: "TW", gradient: "from-indigo-400 to-cyan-400" },
];

export default function Hero() {
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrambleTextPlugin);

    if (!headlineRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headlineRef.current,
        {
          opacity: 0.2,
        },
        {
          opacity: 1,
          duration: 2.2,
          ease: "power2.out",
          scrambleText: {
            text: "コードで体験をデザインする、Webプログラマーのポートフォリオ。",
            chars: "WEBDEVﾃﾞｻﾞｲﾝSTYLE0123456789",
            speed: 0.5,
            revealDelay: 0.35,
          },
        },
      );
    }, headlineRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-200/60 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-10 shadow-xl dark:border-zinc-800/70 dark:from-[#0b0c10] dark:via-[#0f1117] dark:to-[#0b0c10] sm:p-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(244,114,182,0.08),transparent_40%)]" />

      <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.95fr] lg:items-center">
        <div className="space-y-8">
          <p className="text-xs uppercase tracking-[0.36em] text-zinc-500 dark:text-zinc-400">
            Web Programmer / Creative Dev
          </p>
          <h1
            ref={headlineRef}
            className="text-3xl font-semibold leading-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl"
          >
            Webプロダクトに動きと文脈を与える、実装ファーストのフロントエンドを作ります。
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
            情報設計からUI実装、インタラクションのマイクロコピーまで一気通貫で担当。
            TypeScriptとNext.jsを軸に、滑らかなアニメーションでサービスの温度感を届けます。
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/70">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
                Frontend Build
              </p>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                Next.js + TypeScript で設計から実装までリード。パフォーマンスとSEOを意識した実装を標準に。
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/70">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
                Interaction
              </p>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                GSAPやCSSアニメで、静かな質感から大胆なモーションまで。体験にメリハリをつけます。
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              Skill Set
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {techStack.map((tech) => (
                <div
                  key={tech.name}
                  className="flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white/70 px-3 py-2 text-sm text-zinc-800 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100 dark:hover:border-zinc-600"
                >
                  <span
                    aria-hidden
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${tech.gradient} text-xs font-semibold text-white shadow-sm`}
                  >
                    {tech.icon}
                  </span>
                  <span className="font-medium">{tech.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-xl items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-200/70 via-white to-fuchsia-200/50 blur-3xl opacity-80 dark:from-sky-500/30 dark:via-white/10 dark:to-fuchsia-500/30" />
          <div className="relative w-full overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-6 shadow-[0_15px_70px_rgba(0,0,0,0.12)] backdrop-blur dark:border-zinc-700/80 dark:bg-zinc-900/70">
            <div className="relative overflow-hidden rounded-xl border border-zinc-200/70 bg-gradient-to-br from-zinc-50 via-white to-zinc-100 p-5 shadow-inner dark:border-zinc-700/60 dark:from-[#0f1117] dark:via-[#0d0e13] dark:to-[#08090d]">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-400" />
                Frontend Live Build
              </div>
              <div className="space-y-3 rounded-lg border border-white/60 bg-white/80 p-4 text-sm font-mono text-zinc-800 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-950/50 dark:text-zinc-100">
                <p className="text-[12px] leading-6">
                  const profile = {"{"}
                  <br />{"  "}name: &quot;Burst Style&quot;,
                  <br />{"  "}role: &quot;Web Programmer / Creative Dev&quot;,
                  <br />{"  "}mission: &quot;UIに動きと温度感をのせる&quot;,
                  <br />{"  "}stack: [&quot;Next.js&quot;, &quot;TypeScript&quot;, &quot;GSAP&quot;, &quot;Tailwind CSS&quot;],
                  <br />
                  {"}"};
                  <br />
                  export default profile;
                </p>
              </div>
              <div className="pointer-events-none absolute -left-10 top-6 h-32 w-32 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/20" />
              <div className="pointer-events-none absolute -right-6 bottom-4 h-28 w-28 rounded-full bg-fuchsia-200/40 blur-3xl dark:bg-fuchsia-500/20" />
            </div>
            <div className="pointer-events-none absolute -left-6 -top-6 h-12 w-12 rounded-full border border-white/80 bg-white/50 blur-md dark:border-zinc-600 dark:bg-zinc-800/80" />
            <div className="pointer-events-none absolute -right-4 bottom-4 h-16 w-16 rounded-full border border-white/70 bg-white/30 blur-md dark:border-zinc-700 dark:bg-zinc-800/60" />
          </div>
        </div>
      </div>
    </section>
  );
}

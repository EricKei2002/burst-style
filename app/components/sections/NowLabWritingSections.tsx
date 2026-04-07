"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import MagneticButton from "../ui/MagneticButton";
import TiltCard from "../ui/TiltCard";
import { labData, nowData, writingData } from "../../lib/personalSite";
import { useTransitionStore } from "../../lib/store";

function SectionIntro({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-12 max-w-2xl rounded-2xl border border-white/10 bg-black/65 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2 text-fuchsia-100">
        <span className="h-px w-8 bg-current" />
        <span className="font-mono text-sm font-semibold tracking-wider uppercase">{kicker}</span>
      </div>
      <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
      <p className="leading-relaxed text-zinc-50">{description}</p>
    </div>
  );
}

export default function NowLabWritingSections() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const { setPhase } = useTransitionStore();

  const goProject = (slug: string) => {
    setPhase("closing");
    setTimeout(() => {
      setPhase("closed");
      router.push(`/projects/${slug}`);
    }, 900);
  };

  useEffect(() => {
    const target = wrapRef.current;
    if (!target) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const fade = visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0";

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* Now */}
      <section id="now" className="relative w-full py-20 sm:py-28">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className={`transition-all duration-700 ease-out ${fade}`}>
            <SectionIntro
              kicker="02. Now"
              title="いま、ここ"
              description="就職後も続ける個人の関心ごと。短いログとして更新していきます。"
            />

            <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,280px)] lg:items-start">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 sm:p-8 backdrop-blur-sm">
                <p className="mb-6 leading-relaxed text-zinc-200">{nowData.lead}</p>
                <ul className="space-y-4">
                  {nowData.entries.map((entry, i) => (
                    <li
                      key={i}
                      className={`flex gap-3 border-l-2 border-fuchsia-500/40 pl-4 text-sm leading-relaxed sm:text-base ${
                        entry.highlight ? "text-zinc-50" : "text-zinc-300"
                      }`}
                    >
                      <span className="font-mono text-xs text-fuchsia-400/90 shrink-0 pt-0.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{entry.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <aside className="rounded-2xl border border-zinc-800/80 bg-black/40 p-5 font-mono text-xs text-zinc-300">
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  Last updated
                </div>
                <time dateTime={nowData.updated} className="text-fuchsia-200">
                  {nowData.updated}
                </time>
                <p className="mt-6 border-t border-zinc-800/80 pt-4 text-[11px] leading-relaxed text-zinc-400">
                  {nowData.disclaimer}
                </p>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* Lab */}
      <section id="lab" className="relative w-full py-20 sm:py-28">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className={`transition-all duration-700 ease-out delay-100 ${fade}`}>
            <SectionIntro
              kicker="03. Lab"
              title="実験室"
              description="完成品ではない試行錯誤。インタラクティブなものは About のタイムライン内にも配置しています。"
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {labData.map((item) => (
                <MagneticButton key={item.title} className="h-full" strength={0.15}>
                  <TiltCard className="h-full" rotationIntensity={4}>
                    <div className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/25 p-6 sm:p-7">
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-300">{item.description}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-md border border-zinc-700/80 bg-black/40 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-zinc-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="mt-6">
                        {item.link.kind === "hash" ? (
                          <a
                            href={`#${item.link.id}`}
                            className="inline-flex items-center gap-2 font-mono text-sm font-semibold text-fuchsia-300 transition-colors hover:text-fuchsia-200"
                          >
                            {item.ctaLabel}
                            <span aria-hidden="true">→</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const l = item.link;
                              if (l.kind === "project") goProject(l.slug);
                            }}
                            className="inline-flex cursor-pointer items-center gap-2 border-none bg-transparent p-0 font-mono text-sm font-semibold text-fuchsia-300 transition-colors hover:text-fuchsia-200"
                          >
                            {item.ctaLabel}
                            <span aria-hidden="true">→</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </TiltCard>
                </MagneticButton>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Writing */}
      <section id="writing" className="relative w-full py-20 sm:py-28">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className={`transition-all duration-700 ease-out delay-200 ${fade}`}>
            <SectionIntro
              kicker="04. Writing & Links"
              title="発信・リンク"
              description="コード以外の思考や記事は、外部サービスとここを行き来しながら整理していきます。"
            />

            <div className="grid gap-6 md:grid-cols-2">
              {writingData.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 sm:p-8 transition-colors hover:border-zinc-600/80"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-fuchsia-200">
                      {item.badge}
                    </span>
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-300">{item.description}</p>
                  {item.href && item.hrefLabel ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-2 font-mono text-sm font-semibold text-fuchsia-300 transition-colors hover:text-fuchsia-200"
                    >
                      {item.hrefLabel}
                      <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <p className="mt-5 font-mono text-xs text-zinc-500">リンクは準備中です</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const projects = [
  {
    title: "Cutting Works",
    description: "多彩なカッティングステッカー・デザインサイト制作。ユーザーが直感的にデザインを選べるUIと、制作実績のギャラリー機能を実装。",
    image: "/projects/bg cwb.jpeg",
    url: "https://cuttingworks.burst.style",
    tags: ["Next.js", "MicroCMS", "Tailwind CSS"]
  },
  {
    title: "Discord Bot",
    description: "コミュニティ運営を効率化する多機能Discord Bot。サーバー管理の自動化から、エンターテインメント機能まで幅広く提供。",
    image: "/discord.png",
    url: "#",
    tags: ["Node.js", "Discord.js", "TypeScript"]
  },
];

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(".project-card",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full bg-[#0a0a0a] py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-4">
            <span className="h-px w-8 bg-current"></span>
            <span className="font-mono text-xs tracking-wider uppercase">02. Selected Works</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
            Crafting Digital Solutions
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            デザインとテクノロジーを融合し、課題を解決しながらブランドの魅力を引き出した主要なプロジェクトです。
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {projects.map((project) => (
            <a
              key={project.title}
              href={project.url}
              className="project-card group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 transition-all hover:border-zinc-600 hover:bg-zinc-900/50"
            >
              {/* Image Container */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-800">
                <div className="absolute inset-0 z-10 bg-zinc-950/20 transition-colors group-hover:bg-transparent" />
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover transition duration-700 ease-out group-hover:scale-105"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {project.title}
                    </h3>
                    <span className="rounded-full border border-zinc-700 bg-zinc-800 p-2 text-zinc-400 transition group-hover:border-emerald-500/50 group-hover:text-emerald-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                    {project.description}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className="text-xs font-mono text-emerald-500/80">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* More Projects Link */}
        <div className="mt-16 text-center">
          <a href="#" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors border-b border-transparent hover:border-emerald-500 pb-0.5">
            View All Archives
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </a>
        </div>
      </div>
    </section>
  );
}

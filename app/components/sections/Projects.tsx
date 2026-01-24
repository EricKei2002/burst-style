"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MagneticButton from "../ui/MagneticButton";
import DecryptedText from "../ui/DecryptedText";
import TiltCard from "../ui/TiltCard";

const projects = [
  {
    title: "Cutting Works",
    description: "多彩なカッティングステッカー・デザインサイト制作。ユーザーが直感的にデザインを選べるUIと、制作実績のギャラリー機能を実装。",
    image: "/projects/bg cwb.jpeg",
    url: "https://cuttingworks.burst.style",
    tags: ["Next.js", "MicroCMS", "Tailwind CSS"]
  },
  {
    title: "Discord 自己紹介認証Bot",
    description: "コミュニティ運営を効率化する自己紹介認証Discord Bot。自宅サーバー × CI/CD による実運用経験",
    image: "/discord.png",
    url: "https://github.com/EricKei2002/role-bot-ts",
    tags: ["Node.js", "Discord.js", "TypeScript"]
  },
];

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(".project-card",
        { y: 50, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
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
    <section id="projects" ref={sectionRef} className="relative w-full py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <div className="flex items-center gap-2 text-fuchsia-400 mb-4">
            <span className="h-px w-8 bg-current"></span>
            <span className="font-mono text-xs tracking-wider uppercase">01. Selected Works</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
            <DecryptedText text="Projects" animateOnHover speed={30} />
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            既成概念を打ち砕き、記憶に残る体験を。<br />
            デザインと技術を融合した『Burst Style』の実践。
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {projects.map((project) => (
            <MagneticButton key={project.title} className="h-full" strength={0.2}>
              <TiltCard className="h-full" rotationIntensity={5}>
                <a
                  href={project.url}
                  className="project-card group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 transition-all hover:border-zinc-600 hover:bg-zinc-900/50 h-full"
                >
                  {/* Image Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-800">
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
                        <h3 className="text-xl font-bold text-white group-hover:text-fuchsia-400 transition-colors">
                          <DecryptedText text={project.title} animateOnHover speed={40} />
                        </h3>
                        <span className="rounded-full border border-zinc-700 bg-zinc-800 p-2 text-zinc-400 transition group-hover:border-fuchsia-500/50 group-hover:text-fuchsia-400">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                        <DecryptedText text={project.description} animateOnHover speed={10} maxIterations={5} />
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span key={tag} className="text-xs font-mono text-fuchsia-500/80">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </a>
              </TiltCard>
            </MagneticButton>
          ))}
        </div>


      </div>
    </section>
  );
}

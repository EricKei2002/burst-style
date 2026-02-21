"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MagneticButton from "../ui/MagneticButton";
import DecryptedText from "../ui/DecryptedText";
import TiltCard from "../ui/TiltCard";

import { projectsData } from "../../lib/data";
import { useTransitionStore } from "../../lib/store";


export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const { setPhase, phase } = useTransitionStore();

  const handleNavigation = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    setPhase('closing');
    
    // 扉が閉まるのを待ちます（CSSの期間は700ms）
    setTimeout(() => {
        setPhase('closed');
        router.push(url);
    }, 900);
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // 現在 'opening' フェーズ（プロジェクトから戻ってきた場合）にいる場合、エントランスアニメーションをスキップします
    // 戻る際、HangarDoorTransitionは即座にフェーズを 'opening' に設定します（または300ms間 'closed' のままにしてから開きます）
    // そのため 'phase' はおそらく非アイドル状態になります。
    const shouldAnimate = phase === 'idle'; 

    const ctx = gsap.context(() => {
      // アニメーションすべき場合は、fromToを実行します。
      // そうでない場合は、即座に表示状態にします。
      
      if (shouldAnimate) {
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
      } else {
          // 即座に表示
          gsap.set(".project-card", { y: 0, opacity: 1, scale: 1 });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [phase]);

  return (
    <section id="projects" ref={sectionRef} className="relative w-full py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

        {/* ヘッダー */}
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

        {/* プロジェクトグリッド */}
        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {projectsData.map((project) => (
            <MagneticButton key={project.slug} className="h-full" strength={0.2}>
              <TiltCard className="h-full" rotationIntensity={5}>
                <div
                  onClick={(e) => handleNavigation(e, `/projects/${project.slug}`)}
                  className="project-card group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 transition-all hover:border-zinc-600 hover:bg-zinc-900/50 h-full cursor-pointer"
                >
                  {/* 画像コンテナ */}
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-800">
                    <div className="absolute inset-0 z-10 bg-zinc-950/20 transition-colors group-hover:bg-transparent" />
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className={`transition duration-700 ease-out group-hover:scale-105 ${
                        project.slug === 'burst-style' ? 'object-contain p-8 bg-black' : 'object-cover'
                      }`}
                      sizes="(min-width: 768px) 50vw, 100vw"
                    />
                  </div>

                  {/* コンテンツ */}
                  <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white group-hover:text-fuchsia-400 transition-colors">
                          <DecryptedText text={project.title} animateOnHover speed={40} />
                        </h3>
                        <span className="rounded-full border border-zinc-700 bg-zinc-800 p-2 text-zinc-400 transition group-hover:border-fuchsia-500/50 group-hover:text-fuchsia-400">
                           {/* 装飾用のsvgはスクリーンリーダーに読ませない */}
                           <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
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
                </div>
              </TiltCard>
            </MagneticButton>
          ))}
        </div>


      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProfileCard from "./ProfileCard";
import DecryptedText from "./DecryptedText";

const timeline = [
  {
    year: "2002",
    title: "Born in Wakayama",
    description: "2002年2月16日、和歌山県にて生を受ける。",
    tags: ["Wakayama", "Origin"],
  },
  {
    year: "Elementary School",
    title: "Hello, World with Scratch",
    description: "プログラミングとの初めての出会い。ビジュアルプログラミング言語「Scratch」を使用し、創造する楽しさを学ぶ。",
    tags: ["Scratch", "Visual Programming"],
    image: "/scratch-programming.png"
  },
  {
    year: "Junior High",
    title: "First Code with C#",
    description: "初めて本格的なコードを書く。C#を用いて電卓アプリを自作し、ロジック構築の基礎を習得。",
    tags: ["C#", "Windows Forms", "Algorithms"],
  },
  {
    year: "High School",
    title: "Hardware & Silicon Valley",
    description: "シリコンバレーを訪問し、最先端のテックカルチャーに触れる。自作PCの構築を通じてハードウェアの知識も深める。",
    tags: ["Silicon Valley", "PC Build", "Hardware"],
  },
  {
    year: "After High School",
    title: "Server & Infrastructure",
    description: "Raspberry PiにLinuxを導入し、自宅サーバーを構築。ネットワークやOSの仕組みを実践的に学ぶ。",
    tags: ["Linux", "Raspberry Pi", "Home Server", "Network"],
  }
];

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Background Parallax
      gsap.to(".bg-grid", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        }
      });

      // Content Reveal
      gsap.fromTo(".about-card",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: "power3.out",
          stagger: 0.2,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="relative w-full overflow-hidden py-24 sm:py-32">
      <div className="bg-grid absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <div className="flex items-center gap-2 text-fuchsia-400 mb-4">
            <span className="h-px w-8 bg-current"></span>
            <span className="font-mono text-xs tracking-wider uppercase">02. Who I am</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
            <DecryptedText text="About Me" animateOnHover speed={30} />
          </h2>
        </div>

        <div className="grid gap-16 lg:grid-cols-[1fr_1.5fr]">

          {/* Left Column: Profile Card & Skills */}
          <div className="about-card space-y-12">
            
            {/* Profile Card */}
            <div className="flex justify-center lg:justify-start">
              <ProfileCard 
                name="Eric Kei" 
                title="Creative Developer"
                className="w-full max-w-[500px] aspect-4/5 lg:h-full lg:max-h-[600px]"
                innerGradient="linear-gradient(145deg, #18181b 0%, #09090b 100%)"
                backgroundImageUrl="/profile-new.jpg"
              />
            </div>


          </div>

          {/* Right Column: Timeline */}
          <div className="about-card relative space-y-12 pl-4 sm:pl-0">
            {/* Timeline Line */}
            <div className="absolute left-4 top-2 h-full w-px bg-zinc-800 sm:left-8" />

            {timeline.map((item, index) => (
              <div key={index} className="relative pl-12 sm:pl-16">
                {/* Dot */}
                <div className="absolute left-[13px] top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0a0a] ring-1 ring-zinc-700 sm:left-[29px]">
                  <div className="h-1.5 w-1.5 rounded-full bg-fuchsia-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
                </div>

                <div className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 transition hover:border-zinc-700 hover:bg-zinc-900/50">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <h3 className="text-lg font-semibold text-zinc-200 group-hover:text-fuchsia-400 transition-colors">
                      {item.title}
                    </h3>
                    <span className="font-mono text-xs text-zinc-500">{item.year}</span>
                  </div>
                  
                  <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                    {item.description}
                  </p>

                  {item.image && (
                    <div className="mt-4 overflow-hidden rounded-lg border border-zinc-800 relative w-full aspect-video">
                      <Image 
                        src={item.image} 
                        alt={item.title} 
                        fill
                        className="object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                        sizes="(max-width: 768px) 100vw, 500px"
                      />
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((t) => (
                      <span key={t} className="rounded-md border border-zinc-800 bg-black/50 px-2 py-1 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

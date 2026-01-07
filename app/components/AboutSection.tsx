"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactNode } from "react";
import ProfileCard from "./ProfileCard";
import DecryptedText from "./DecryptedText";
import CsharpCalculator from "./CsharpCalculator";
import TodoAppDemo from "./TodoAppDemo";

interface TimelineItem {
  year: string;
  title: string;
  description: string | ReactNode;
  tags: string[];
  image?: string;
  images?: string[];
  videos?: string[];
  githubUrl?: string;
  extraComponent?: ReactNode;
}

const ServerSpecs = () => (
  <div className="grid grid-cols-2 gap-3 w-full">
    {/* Image */}
    <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg border border-zinc-800 bg-black/50">
      <Image
        src="/images/server/pi.jpg"
        alt="Raspberry Pi Server"
        fill
        className="object-contain transition-transform duration-500 hover:scale-105"
        sizes="(max-width: 768px) 50vw, 300px"
      />
    </div>

    {/* Specs */}
    <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 font-mono text-xs sm:text-sm text-zinc-300 flex flex-col justify-center gap-3">
       
       <div>
         <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Model</div>
         <div className="font-semibold text-fuchsia-400">Raspberry Pi 4 Model B</div>
       </div>

       <div>
         <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">OS</div>
         <div className="text-zinc-200">Ubuntu 24.04.3 LTS</div>
       </div>

       <div>
         <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Role</div>
         <div className="text-zinc-200">Home Server & BOT Host</div>
       </div>

       <div>
         <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Running</div>
         <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded bg-[#2496ed]/10 px-1.5 py-0.5 text-[#2496ed]">Docker</span>
            <span className="inline-flex items-center rounded bg-[#5865F2]/10 px-1.5 py-0.5 text-[#5865F2]">Discord BOT</span>
         </div>
       </div>
    </div>

    {/* Terminal */}
    <div className="col-span-2 relative aspect-video w-full overflow-hidden rounded-lg border border-zinc-800 bg-black/50">
       <Image 
         src="/images/server/terminal.jpeg" 
         alt="Server Terminal"
         fill
         className="object-contain transition-transform duration-500 hover:scale-105"
         sizes="(max-width: 768px) 100vw, 600px"
        />
    </div>
  </div>
);

const timeline: TimelineItem[] = [
  {
    year: "2002",
    title: "Born in Wakayama",
    description: (
      <div className="space-y-4">
        <p>v2002.0 Initial Commit: プロジェクト「Eric Kei」が和歌山県にてローンチされました。</p>
        <ul className="list-none space-y-2 pl-2">
          <li className="flex gap-2">
            <span className="text-fuchsia-400 font-mono text-xs shrink-0 mt-1">[Init]</span>
            <span>新規ユーザー「Eric Kei」を作成。</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400 font-mono text-xs shrink-0 mt-1">[System]</span>
            <span>コアカーネル（生命）が正常に起動。</span>
          </li>
        </ul>
      </div>
    ),
    tags: ["Wakayama", "Origin"],
  },
  {
    year: "Elementary School",
    title: "Hello, World with Scratch",
    description: (
      <div className="space-y-4">
        <p>v2013.0 Early Access: プログラミングの世界へ初めてログイン。創造性の初期パラメータを設定。</p>
        <ul className="list-none space-y-2 pl-2">
          <li className="flex gap-2">
            <span className="text-green-400 font-mono text-xs shrink-0 mt-1">[Add]</span>
            <span>ビジュアルスクリプト（Scratch）モジュールを実装。</span>
          </li>
          <li className="flex gap-2">
            <span className="text-fuchsia-400 font-mono text-xs shrink-0 mt-1">[Improve]</span>
            <span>論理演算と創造性アルゴリズムを改善。</span>
          </li>
        </ul>
      </div>
    ),
    tags: ["Scratch", "Visual Programming"],
    image: "/scratch.png"
  },
  {
    year: "Junior High",
    title: "First Code with C#",
    description: (
      <div className="space-y-4">
        <p>v2015.0 Feature Update: 友人からの招待コードにより、本格的なコーディング環境へ移行。</p>
        <ul className="list-none space-y-2 pl-2">
          <li className="flex gap-2">
            <span className="text-blue-400 font-mono text-xs shrink-0 mt-1">[Add]</span>
            <span>C#言語サポートとVisual Studio環境を追加。</span>
          </li>
          <li className="flex gap-2">
            <span className="text-fuchsia-400 font-mono text-xs shrink-0 mt-1">[Build]</span>
            <span>自作電卓アプリケーションをデプロイ。</span>
          </li>
        </ul>
      </div>
    ),
    tags: ["C#", "Windows Forms", "Algorithms"],
    extraComponent: <CsharpCalculator />,
  },
  {
    year: "High School",
    title: "Hardware Enthusiast",
    description: (
      <div className="space-y-4">
        <p>v2019.0 Hardware Upgrade: ソフトウェアだけでなく、実行環境（ハードウェア）への最適化プロセスを開始。</p>
        <ul className="list-none space-y-2 pl-2">
          <li className="flex gap-2">
            <span className="text-green-400 font-mono text-xs shrink-0 mt-1">[Optimize]</span>
            <span>オーバークロックによるCPU/GPUパフォーマンス最適化。</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400 font-mono text-xs shrink-0 mt-1">[Add]</span>
            <span>自作PCビルド機能を追加。</span>
          </li>
        </ul>
      </div>
    ),
    tags: ["PC Build", "Hardware", "Overclocking"],
    images: [
      "/images/hardware/parts.jpg"
    ],
    videos: [
      "/videos/pc-build.mp4"
    ]
  },
  {
    year: "High School (Summer)",
    title: "Silicon Valley Tour",
    description: (
      <div className="space-y-4">
        <p>v2019.1 Global Connect: シリコンバレーサーバーへのアクセスに成功。エンジニアとしての視座をアップデート。</p>
        <ul className="list-none space-y-2 pl-2">
          <li className="flex gap-2">
            <span className="text-fuchsia-400 font-mono text-xs shrink-0 mt-1">[Access]</span>
            <span>グローバルテック本社（Google, Meta, Intel）へのアクセス確立。</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400 font-mono text-xs shrink-0 mt-1">[Sync]</span>
            <span>テックカルチャーとイノベーション思考を同期。</span>
          </li>
        </ul>
      </div>
    ),
    tags: ["Silicon Valley", "Tech Culture", "Global Mindset"],
    images: [
      "/images/sv/google.jpg",
      "/images/sv/facebook.jpg",
      "/images/sv/android.jpg",
      "/images/sv/intel.jpg"
    ]
  },
  {
    year: "2020 - 2022",
    title: "Global Communities & Gaming",
    description: (
      <div className="space-y-4">
        <p>v2020.0 Security Patch: パンデミックによる接続エラー（留学中止）発生に伴い、デジタル空間へ強制ルーティング。</p>
        <ul className="list-none space-y-2 pl-2">
          <li className="flex gap-2">
            <span className="text-red-400 font-mono text-xs shrink-0 mt-1">[Fix]</span>
            <span>リモート通信プロトコル（Discord）を確立。</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400 font-mono text-xs shrink-0 mt-1">[Add]</span>
            <span>東京シェアハウス領域とソーシャルスキルを追加。</span>
          </li>
        </ul>
      </div>
    ),
    tags: ["Discord", "Community Builder", "Gaming", "Tokyo Life"],
    images: [
      "/images/pandemic/gaming_setup.jpg",
      "/images/pandemic/tokyo.jpg"
    ]
  },
  {
    year: "2022(Summer)",
    title: "North America Tour",
    description: (
      <div className="space-y-4">
        <p>v2022.1 Localization Update: バーチャルな友情データを物理レイヤー（現実）へ同期。</p>
        <ul className="list-none space-y-2 pl-2">
          <li className="flex gap-2">
            <span className="text-green-400 font-mono text-xs shrink-0 mt-1">[Sync]</span>
            <span>オンラインフレンドを物理接続（カナダ）へ同期。</span>
          </li>
          <li className="flex gap-2">
            <span className="text-fuchsia-400 font-mono text-xs shrink-0 mt-1">[Improve]</span>
            <span>英語通信プラグインとグローバルマップデータを拡張。</span>
          </li>
        </ul>
      </div>
    ),
    tags: ["Canada", "USA", "Real-life Meetup", "Family Visit"],
    images: [
      "/images/pandemic/us_flag.jpg"
    ],
    videos: [
      "/videos/north_america.mp4"
    ]
  },
  {
    year: "2022 〜 2025",
    title: "Resort Byte & Self-Study",
    description: (
      <div className="space-y-4">
        <p>v2022.2 Physics Engine Update: 物理演算（スノーボード）の処理性能を極限まで向上。</p>
        <ul className="list-none space-y-2 pl-2">
          <li className="flex gap-2">
            <span className="text-blue-400 font-mono text-xs shrink-0 mt-1">[Add]</span>
            <span>氷点下環境適応（白馬・ニセコ）パッチを適用。</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400 font-mono text-xs shrink-0 mt-1">[Background]</span>
            <span>プログラミング独学プロセスをバックグラウンド実行。</span>
          </li>
        </ul>
      </div>
    ),
    tags: ["Hakuba", "Niseko", "Snowboarding", "Self-Taught"],
    images: [
      "/images/resort/hakuba.jpg",
      "/images/resort/niseko.jpg"
    ],
    videos: [
      "/videos/snowboard.mp4"
    ]
  },
  {
    year: "2025 (Autumn)",
    title: "Web Development & TypeScript",
    description: (
      <div className="space-y-4">
        <p>v2025.0 Major Refactor: エンジニアリングスキルをモダンスタックへ完全移行。</p>
        <ul className="list-none space-y-2 pl-2">
          <li className="flex gap-2">
            <span className="text-fuchsia-400 font-mono text-xs shrink-0 mt-1">[Add]</span>
            <span>TypeScript & React サポートを追加。</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400 font-mono text-xs shrink-0 mt-1">[Fix]</span>
            <span>型安全性とコンポーネント設計の課題を修正。</span>
          </li>
        </ul>
      </div>
    ),
    tags: ["Web Development", "TypeScript", "Frontend", "Study"],
    githubUrl: "https://github.com/EricKei2002/Todo-with-Typescript",
    extraComponent: (
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <TodoAppDemo />
        <div className="flex-1 space-y-4 pt-2">
           <div>
             <h4 className="text-sm font-medium text-zinc-200 mb-2">AI-Assisted Learning</h4>
             <p className="text-sm text-zinc-400 leading-relaxed">
               学習中に直面したエラーや疑問点は、AIと対話しながら解決。
               単に答えを求めるだけでなく、コードの背景にある仕組みやベストプラクティスについて深掘りすることで、
               実務で通用する知識を効率的に吸収しました。
               左記のTODOアプリも、そのようなプロセスを経て完成させた成果物の一つです。
             </p>
           </div>
        </div>
      </div>
    ),
  },
  {
    year: "2026",
    title: "Server & Infrastructure",
    description: (
      <div className="space-y-4">
        <p>v2026.0 Infrastructure Expansion: ローカル環境にLinuxサーバーをデプロイ。</p>
        <ul className="list-none space-y-2 pl-2">
          <li className="flex gap-2">
            <span className="text-green-400 font-mono text-xs shrink-0 mt-1">[Deploy]</span>
            <span>自宅サーバー（Raspberry Pi 4）をデプロイ。</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400 font-mono text-xs shrink-0 mt-1">[Improve]</span>
            <span>ネットワークとOSアーキテクチャの知識ベースを強化。</span>
          </li>
        </ul>
      </div>
    ),
    tags: ["Linux", "Raspberry Pi", "Home Server", "Network"],
    extraComponent: <ServerSpecs />
  },
  {
    year: "2026 〜 Future",
    title: "Looking for New Opportunities",
    description: (
      <div className="space-y-4">
        <p>v2026.1 Update Log: バックエンド（人生経験）は複雑ですが、フロントエンド（人柄）はモダンでレスポンシブ対応済み。</p>
        <ul className="list-none space-y-2 pl-2">
          <li className="flex gap-2">
            <span className="text-fuchsia-400 font-mono text-xs shrink-0 mt-1">[Fix]</span>
            <span>住所不定バグを修正し、定住意欲が向上。</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400 font-mono text-xs shrink-0 mt-1">[Add]</span>
            <span>独学で実装した技術力と、海外でデプロイされた適応力をバンドル。</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400 font-mono text-xs shrink-0 mt-1">[Note]</span>
            <span>仕様により「好奇心」がメモリを大量消費しますが、パフォーマンスは絶好調です。</span>
          </li>
        </ul>
        <p>この最新バージョンを本番環境で運用してくれる企業様、プルリクエストをお待ちしています！</p>
      </div>
    ),
    tags: ["Open to Work", "Job Seeker", "Frontend Engineer", "Creative"],
    extraComponent: (
      <div className="mt-4">
        <a 
          href="#contact" 
          className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-fuchsia-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-fuchsia-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 focus:ring-offset-black"
        >
          <span>Contact Me</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    )
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
      // Profile Growth Transition
      // Profile Growth Transition
      // Transition: Childhood -> Mid -> Current
      // Desktop only: Animate. Mobile: handled via CSS to show final state.
      
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top", 
            end: "bottom bottom",
            scrub: true,
          }
        });

        tl.to(".growth-stage-0", { opacity: 1, duration: 1, ease: "none" })
          .to(".growth-stage-1", { opacity: 1, duration: 1, ease: "none" });
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="relative w-full py-24 sm:py-32">
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
          <div className="about-card space-y-12 lg:sticky lg:top-32 lg:self-start">
            
            {/* Profile Card */}
            <div className="flex justify-center lg:justify-start">
              <ProfileCard 
                name="Eric Kei" 
                title="Creative Developer"
                className="w-full max-w-[500px] aspect-4/5 lg:h-full lg:max-h-[600px]"
                innerGradient="linear-gradient(145deg, #18181b 0%, #09090b 100%)"
                backgroundImageUrl="/childhood.jpg"
                growthImages={[
                  "/profile-mid.jpg",
                  "/profile-new.jpg"
                ]}
              />
            </div>


          </div>

          {/* Right Column: Timeline */}
          <div className="about-card relative space-y-12 pl-4 sm:pl-0">
            {/* Timeline Line */}
            <div className="absolute left-4 top-2 h-full w-px bg-zinc-800 sm:left-8" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black via-black/80 to-transparent pointer-events-none" />

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
                    <span className="font-mono text-base text-zinc-400">{item.year}</span>
                  </div>
                  
                  <div className="mt-4 text-base leading-relaxed text-zinc-300">
                    {item.description}
                  </div>

                  {item.image && (
                    <div className="mt-4 overflow-hidden rounded-lg border border-zinc-800 relative w-full aspect-video">
                      <Image 
                        src={item.image} 
                        alt={item.title} 
                        fill
                        className="object-contain opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                        sizes="(max-width: 768px) 100vw, 500px"
                      />
                    </div>
                  )}

                  {item.extraComponent && (
                    <div className="mt-6 w-full flex justify-center sm:justify-start">
                      {item.extraComponent}
                    </div>
                  )}

                  {(item.images || item.videos) && (
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-2">
                       {item.images?.map((src, i) => (
                        <div 
                          key={`img-${i}`} 
                          className={`relative w-full overflow-hidden rounded-lg border border-zinc-800 bg-black/50 ${src.includes('terminal') || src.includes('hakuba') ? 'col-span-2 aspect-video' : 'aspect-3/4'}`}
                        >
                          <Image
                            src={src}
                            alt={`${item.title} photo ${i + 1}`}
                            fill
                            className="object-contain transition-transform duration-500 hover:scale-105"
                            sizes={src.includes('terminal') || src.includes('hakuba') ? "(max-width: 768px) 100vw, 600px" : "(max-width: 768px) 50vw, 300px"}
                          />
                        </div>
                      ))}
                      {item.videos?.map((src, i) => (
                        <div key={`vid-${i}`} className="relative aspect-3/4 w-full overflow-hidden rounded-lg border border-zinc-800 bg-black/50">
                          <video
                            src={src}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((t) => (
                      <span key={t} className="rounded-md border border-zinc-800 bg-black/50 px-2 py-1 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
                        {t}
                      </span>
                    ))}
                    {item.githubUrl && (
                      <a 
                        href={item.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-[10px] font-medium text-fuchsia-400 hover:bg-zinc-800 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                        GitHub
                      </a>
                    )}
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

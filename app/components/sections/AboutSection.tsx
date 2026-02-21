"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactNode } from "react";
import ProfileCard from "../ui/ProfileCard";
import DecryptedText from "../ui/DecryptedText";
import CsharpCalculator from "../demos/CsharpCalculator";
import TodoAppDemo from "../demos/TodoAppDemo";

interface TimelineItem {
  year: string;
  title: string;
  description: string | ReactNode;
  professionalDescription?: string | ReactNode;
  tags: string[];
  image?: string;
  images?: string[];
  videos?: string[];
  githubUrl?: string;
  extraComponent?: ReactNode | ((isProfessional: boolean) => ReactNode);
}

const ServerSpecs = () => (
  <div className="grid grid-cols-2 gap-3 w-full">
    {/* 画像 */}
    <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg border border-zinc-800 bg-black/50">
      <Image
        src="/images/server/pi.jpg"
        alt="Raspberry Pi Server"
        fill
        className="object-contain transition-transform duration-500 hover:scale-105"
        sizes="(max-width: 768px) 50vw, 300px"
      />
    </div>

    {/* スペック */}
    <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 font-mono text-xs sm:text-sm text-zinc-300 flex flex-col justify-center gap-3">
       
       <div>
         <div className="text-zinc-400 text-[10px] uppercase tracking-wider mb-0.5">Model</div>
         <div className="font-semibold text-fuchsia-400">Raspberry Pi 4 Model B</div>
       </div>

       <div>
         <div className="text-zinc-400 text-[10px] uppercase tracking-wider mb-0.5">OS</div>
         <div className="text-zinc-200">Ubuntu 24.04.3 LTS</div>
       </div>

       <div>
         <div className="text-zinc-400 text-[10px] uppercase tracking-wider mb-0.5">Role</div>
         <div className="text-zinc-200">Home Server & BOT Host</div>
       </div>

       <div>
         <div className="text-zinc-400 text-[10px] uppercase tracking-wider mb-0.5">Running</div>
         <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded bg-[#2496ed]/10 px-1.5 py-0.5 text-[#2496ed]">Docker</span>
            <span className="inline-flex items-center rounded bg-[#5865F2]/10 px-1.5 py-0.5 text-[#5865F2]">Discord BOT</span>
         </div>
       </div>
    </div>

    {/* ターミナル */}
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
          <li className="flex gap-2">
            <span className="text-green-400 font-mono text-xs shrink-0 mt-1">[Inherit]</span>
            <span>親プロセス（父）からエンジニア属性を継承。</span>
          </li>
        </ul>
      </div>
    ),
    professionalDescription: (
      <div className="space-y-4 text-zinc-300">
        <p>和歌山県にて出生。エンジニアである父の影響を強く受けて育ちました。</p>
        <p>
          幼少期から、父が自宅でリモートワークをしている姿を日常的に見ていたため、場所にとらわれずに働くITの仕事に興味を抱くようになりました。
          自然豊かな環境で育まれた好奇心と、身近にあったテクノロジーへの憧れが、現在のエンジニアとしての原点となっています。
        </p>
      </div>
    ),
    tags: ["Wakayama", "Origin", "Engineer Father"],
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
    professionalDescription: (
      <div className="space-y-4 text-zinc-300">
        <p>プログラミングとの初めての出会いは、ビジュアルプログラミング言語「Scratch」でした。</p>
        <p>
          この経験を通じて、コンピュータに対して論理的に指示を出すことの面白さや、自分のアイデアが形になる喜びを知りました。
          プログラミング的思考（ロジカルシンキング）の基礎がこの時期に養われました。
        </p>
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
    professionalDescription: (
      <div className="space-y-4 text-zinc-300">
        <p>友人の影響を受け、より本格的な開発言語であるC#の学習を開始しました。</p>
        <p>
          Visual Studioを用いたWindowsフォームアプリケーションの開発を通じて、変数、条件分岐、ループ処理といったプログラミングの基礎概念に加え、オブジェクト指向の初歩を独学で習得しました。
          実際に動作する電卓アプリを作成し、友人に使ってもらうことで、ユーザー視点での開発の重要性を学びました。
        </p>
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
    professionalDescription: (
      <div className="space-y-4 text-zinc-300">
        <p>ソフトウェアへの関心に加え、ハードウェア領域へも興味を広げました。</p>
        <p>
          自作PCの組み立てを通じて、CPU、GPU、メモリ、ストレージといった主要コンポーネントの役割や、それらがシステム全体に与える影響について深く理解しました。
          また、オーバークロックなどのパフォーマンスチューニング試行を通じ、ボトルネックの特定と解消というエンジニアリングの基本プロセスを実践的に学びました。
        </p>
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
    professionalDescription: (
      <div className="space-y-4 text-zinc-300">
        <p>高校時代、中学時代にC#を教えてくれた友人がGoogleに入社したため、彼を訪ねて米国のシリコンバレーを訪問しました。Google, Meta, Intelといった世界的テック企業も見学しました。</p>
        <p>
          現地のエンジニアが働く環境や、イノベーションを生み出す文化に直接触れたことは、自身のキャリア観に大きな影響を与えました。
          「世界を変える技術」が情熱を持った人々によって作られていることを肌で感じ、将来は自分もテクノロジーで価値を提供する側に立ちたいという思いを強くしました。
        </p>
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
    professionalDescription: (
      <div className="space-y-4 text-zinc-300">
        <p>パンデミックの影響で留学計画が変更となる中、オンラインコミュニティ（Discord）での活動に活路を見出しました。</p>
        <p>
          ゲームを通じた国際交流により、日常的な英会話能力を向上させるとともに、国籍や文化の異なる人々とのコミュニケーションスキルを磨きました。
          また、東京でのシェアハウス生活も経験し、多様な背景を持つ人々との共同生活を通じて、協調性や対人折衝力を高めました。
        </p>
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
    professionalDescription: (
      <div className="space-y-4 text-zinc-300">
        <p>オンラインで親交を深めた友人を訪ねるため、単身で北米（カナダ・アメリカ）へ渡航しました。</p>
        <p>
          現地での生活や人々との交流を通じて、英語での実践的なコミュニケーション能力を確認するとともに、計画から実行までを独力で行う行動力を実証しました。
          オンライン上の関係を現実世界の信頼関係へと発展させたこの経験は、デジタルとリアルの架け橋となることへの関心を一層深めるものとなりました。
        </p>
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
    professionalDescription: (
      <div className="space-y-4 text-zinc-300">
        <p>白馬やニセコといったリゾート地での住み込み業務に従事しました。現地は外国人の来訪者が多く、業務や日常生活において英語でのコミュニケーションが必須の国際色豊かな環境でした。</p>
        <p>
          そこでの経験を通じて、多様な文化背景を持つ人々との協働スキルを磨きました。
          また、過酷な自然環境下での業務で養った精神力（グリット）に加え、業務時間外にはプログラミング学習を継続し、高い自己管理能力と学習習慣を確立しました。「どのような環境でも適応し、目標に向かって努力を継続できる」ことが私の強みです。
        </p>
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
    professionalDescription: (
      <div className="space-y-4 text-zinc-300">
        <p>Webエンジニアとしてのキャリアを志し、モダンなWeb開発技術（HTML, CSS, JavaScript, TypeScript, React）を集中的に学習しました。</p>
        <p>
          学習の過程では、単なる写経にとどまらず、実際にTodoアプリなどの成果物を作成することで、実践的なスキルを習得しました。
          特にTypeScriptによる型安全な開発や、Reactのコンポーネント設計思想、Hooksの使用法など、実務で求められるレベルの技術理解を深めることに注力しました。
          また、エラー解決にはAIツールを積極的に活用し、効率的な問題解決能力も身につけました。
        </p>
      </div>
    ),
    tags: ["Web Development", "TypeScript", "Frontend", "Study"],
    githubUrl: "https://github.com/EricKei2002/Todo-with-Typescript",
    extraComponent: (
      <div className="w-full">
        <TodoAppDemo />
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
    professionalDescription: (
      <div className="space-y-4 text-zinc-300">
        <p>フロントエンド開発に加え、バックエンドやインフラ領域への理解を深めるため、自宅サーバーの構築・運用を行っています。</p>
        <p>
          Raspberry Piを用いたLinuxサーバーのセットアップ、SSH接続設定、Dockerコンテナによるアプリケーション（Discord Bot等）の運用を通じて、
          黒い画面（CUI）への抵抗感をなくし、サーバーOSの基礎知識やネットワークの仕組みを実践的に学びました。
          フルスタックな視点を持つエンジニアを目指し、技術領域を広げ続けています。
        </p>
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
    professionalDescription: (
      <div className="space-y-4 text-zinc-300">
        <p>現在、フロントエンドエンジニアとしての就業機会を求めています。</p>
        <p>
          独学で培った確かな技術力（React, TypeScript）に加え、海外経験やリゾートバイトで培った「新しい環境への適応力」「英語力」「困難に立ち向かう精神力」が私の強みです。
          技術トレンドへの感度を高く持ち続け、チーム開発においても積極的に貢献できるエンジニアとして成長していきたいと考えています。
          私のスキルや経験が貴社の事業に貢献できると確信しています。
        </p>
      </div>
    ),
    tags: ["Open to Work", "Job Seeker", "Frontend Engineer", "Creative"],
    extraComponent: (isProfessional: boolean) => (
      <div className="mt-4">
        <a 
          href="#contact" 
          className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${
            isProfessional 
              ? "bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 focus:ring-blue-500"
              : "bg-linear-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 focus:ring-fuchsia-500"
          }`}
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
  const [isProfessional, setIsProfessional] = React.useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 背景パララックス
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

      // ヘッダー表示（Projects / Contactと同じ見せ方）
      gsap.fromTo(".about-header",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          }
        }
      );

      // コンテンツの表示
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
      // プロフィールの成長トランジション
      // 遷移: 幼少期 -> 中期 -> 現在
      // デスクトップのみ: アニメーション。モバイル: CSSで処理し最終状態を表示。
      
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
    <section id="about" ref={sectionRef} className="relative w-full py-24 sm:py-32 overflow-clip">
      <div className="bg-grid absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* ヘッダー */}
        <header className="about-header mb-16 max-w-2xl">
          <div className={`flex items-center gap-2 mb-4 transition-colors duration-300 ${isProfessional ? "text-blue-400" : "text-fuchsia-400"}`}>
            <span className="h-px w-8 bg-current"></span>
            <span className="font-mono text-xs tracking-wider uppercase">02. Who I am</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              <DecryptedText text="About Me" animateOnHover speed={30} />
            </h2>

            {/* ビューモード切り替え */}
            <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-full border border-zinc-800 self-start sm:self-auto">
              <button
                onClick={() => setIsProfessional(false)}
                className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all duration-300 ${
                  !isProfessional 
                    ? "bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30" 
                    : "text-zinc-400 hover:text-zinc-300"
                }`}
              >
                Geek Mode
              </button>
              <button
                onClick={() => setIsProfessional(true)}
                className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all duration-300 ${
                  isProfessional 
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                    : "text-zinc-400 hover:text-zinc-300"
                }`}
              >
                Pro Mode
              </button>
            </div>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            技術と経験を積み上げてきた背景を、タイムライン形式で紹介します。
          </p>
        </header>

        <div className="grid gap-16 lg:grid-cols-[1fr_1.5fr]">

          {/* 左カラム: プロフィールカード & スキル */}
          <div className="about-card space-y-12 lg:sticky lg:top-32 lg:self-start">
            
            {/* プロフィールカード */}
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

          {/* 右カラム: タイムライン */}
          <div className="about-card relative space-y-12 pl-4 sm:pl-0">
            {/* タイムラインの線 */}
            <div className="absolute left-4 top-2 h-full w-px bg-zinc-800 sm:left-8" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black via-black/80 to-transparent pointer-events-none" />

            {timeline.map((item, index) => (
              <div key={index} className="relative pl-12 sm:pl-16">
                {/* ドット */}
                <div className="absolute left-[13px] top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0a0a] ring-1 ring-zinc-700 sm:left-[29px]">
                  <div className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${isProfessional ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "bg-fuchsia-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]"}`} />
                </div>

                <div className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 transition hover:border-zinc-700 hover:bg-zinc-900/50">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <h3 className={`text-lg font-semibold text-zinc-200 transition-colors duration-300 ${isProfessional ? "group-hover:text-blue-400" : "group-hover:text-fuchsia-400"}`}>
                      {item.title}
                    </h3>
                    <span className="font-mono text-base text-zinc-400">{item.year}</span>
                  </div>
                  
                  <div className="mt-4 text-base leading-relaxed text-zinc-300">
                    {/* アニメーションコンテンツ切り替え */}
                    <div className="relative min-h-[60px]">
                      {isProfessional && item.professionalDescription ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                          {item.professionalDescription}
                        </div>
                      ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                          {item.description}
                        </div>
                      )}
                    </div>
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
                      {typeof item.extraComponent === "function" 
                        ? item.extraComponent(isProfessional)
                        : item.extraComponent
                      }
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
                            controls
                            loop
                            muted
                            playsInline
                            preload="none"
                            className="h-full w-full object-contain"
                          >
                            <track kind="captions" srcLang="ja" label="日本語" default src="data:text/vtt,WEBVTT" />
                          </video>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((t) => (
                      <span key={t} className="rounded-md border border-zinc-800 bg-black/50 px-2 py-1 text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
                        {t}
                      </span>
                    ))}
                    {item.githubUrl && (
                      <a 
                        href={item.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-[10px] font-medium transition-colors hover:bg-zinc-800 ${isProfessional ? "text-blue-400" : "text-fuchsia-400"}`}
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

"use client";

import { 
  SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiNodedotjs, 
  SiThreedotjs, SiGithub, SiVercel, SiBun, SiDiscord,
  SiBlender, SiHtml5, SiCss3, SiJavascript,
  SiDocker, SiLinux, SiNpm, SiTailscale, SiGithubactions
} from "react-icons/si";

const techStack = [
  { name: "HTML", icon: SiHtml5, color: "text-[#E34F26]" },
  { name: "CSS", icon: SiCss3, color: "text-[#1572B6]" },
  { name: "JavaScript", icon: SiJavascript, color: "text-[#F7DF1E]" },
  { name: "React", icon: SiReact, color: "text-[#61DAFB]" },
  { name: "Next.js", icon: SiNextdotjs, color: "text-white" },
  { name: "TypeScript", icon: SiTypescript, color: "text-[#3178C6]" },
  { name: "Tailwind CSS", icon: SiTailwindcss, color: "text-[#06B6D4]" },
  { name: "Node.js", icon: SiNodedotjs, color: "text-[#339933]" },
  { name: "Three.js", icon: SiThreedotjs, color: "text-white" },
  { name: "Blender", icon: SiBlender, color: "text-[#F5792A]" },
  { name: "Docker", icon: SiDocker, color: "text-[#2496ED]" },
  { name: "Linux", icon: SiLinux, color: "text-white" },
  { name: "npm", icon: SiNpm, color: "text-[#CB3837]" },
  { name: "Tailscale", icon: SiTailscale, color: "text-white" },
  { name: "GitHub Actions", icon: SiGithubactions, color: "text-[#2088FF]" },
  { name: "GitHub", icon: SiGithub, color: "text-white" },
  { name: "Vercel", icon: SiVercel, color: "text-white" },
  { name: "Bun", icon: SiBun, color: "text-[#FBF0DF]" },
  { name: "Discord.js", icon: SiDiscord, color: "text-[#5865F2]" },
];

// globals.cssから移動: スクロールアニメーションとフェードマスクをインライン化して
// レンダーブロッキングCSSチャンクのサイズを削減する
const carouselStyles = `
  @keyframes scroll-left {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  .tech-carousel-inner {
    animation: scroll-left 40s linear infinite;
  }
  .tech-carousel-wrap {
    mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
    -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  }
  @media (prefers-reduced-motion: no-preference) {
    .tech-carousel-inner {
      animation: scroll-left 40s linear infinite !important;
      animation-duration: 40s !important;
      animation-iteration-count: infinite !important;
    }
  }
`;

export default function TechCarousel() {
  const loopStack = [...techStack, ...techStack];

  return (
    <>
      {/* スクロールアニメーションCSSをコンポーネントローカルに配置しレンダーブロッキングを削減 */}
      <style dangerouslySetInnerHTML={{ __html: carouselStyles }} />
      <div className="w-full overflow-hidden py-16 tech-carousel tech-carousel-wrap">
        <div className="flex w-max gap-10 md:gap-16 lg:gap-24 tech-carousel-inner">
          {loopStack.map((tech, index) => (
            <div
              key={`${tech.name}-${index}`}
              className="group flex items-center gap-3 rounded-md border border-zinc-700/80 bg-zinc-950/95 px-3 py-2 md:gap-6 md:px-4"
            >
              <tech.icon aria-hidden="true" className={`text-5xl md:text-7xl lg:text-8xl ${tech.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
              <span className="font-mono text-base md:text-xl lg:text-2xl text-zinc-50 group-hover:text-white transition-colors whitespace-nowrap">
                {tech.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

"use client";

import { 
  SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiNodedotjs, 
  SiThreedotjs, SiFigma, SiGithub, SiVercel, SiBun, SiDiscord,
  SiBlender, SiHtml5, SiCss3, SiJavascript,
  SiDocker, SiLinux
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
  { name: "Figma", icon: SiFigma, color: "text-[#F24E1E]" },
  { name: "GitHub", icon: SiGithub, color: "text-white" },
  { name: "Vercel", icon: SiVercel, color: "text-white" },
  { name: "Bun", icon: SiBun, color: "text-[#FBF0DF]" },
  { name: "Discord.js", icon: SiDiscord, color: "text-[#5865F2]" },
];

export default function TechCarousel() {
  const loopStack = [...techStack, ...techStack];

  return (
    <div className="w-full overflow-hidden py-16 tech-carousel fade-mask">
      <div className="flex w-max gap-10 md:gap-16 lg:gap-24 animate-scroll-left">
        {loopStack.map((tech, index) => (
          <div key={`${tech.name}-${index}`} className="flex items-center gap-3 md:gap-6 group">
            <tech.icon aria-hidden="true" className={`text-5xl md:text-7xl lg:text-8xl ${tech.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
            <span className="font-mono text-base md:text-xl lg:text-2xl text-zinc-100 group-hover:text-white transition-colors whitespace-nowrap">
              {tech.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

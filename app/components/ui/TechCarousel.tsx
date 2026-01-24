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
  return (
    <div className="w-full overflow-hidden py-20 opacity-0 tech-carousel fade-mask">
      <div className="flex w-max gap-24 animate-scroll-left">
        {/* First Set */}
        {techStack.map((tech, index) => (
          <div key={`first-${index}`} className="flex items-center gap-6 group">
             <tech.icon className={`text-8xl ${tech.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
             <span className="font-mono text-2xl text-zinc-400 group-hover:text-white transition-colors">{tech.name}</span>
          </div>
        ))}
        {/* Second Set (Duplicate for Loop) */}
        {techStack.map((tech, index) => (
          <div key={`second-${index}`} className="flex items-center gap-6 group">
             <tech.icon className={`text-8xl ${tech.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
             <span className="font-mono text-2xl text-zinc-400 group-hover:text-white transition-colors">{tech.name}</span>
          </div>
        ))}
        {/* Third Set (Extra safety for wide screens) */}
        {techStack.map((tech, index) => (
          <div key={`third-${index}`} className="flex items-center gap-6 group">
             <tech.icon className={`text-8xl ${tech.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
             <span className="font-mono text-2xl text-zinc-400 group-hover:text-white transition-colors">{tech.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

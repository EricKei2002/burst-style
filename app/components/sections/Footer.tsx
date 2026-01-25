"use client";

import { FaGithub } from "react-icons/fa";

import MagneticButton from "../ui/MagneticButton";
import DecryptedText from "../ui/DecryptedText";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative w-full border-t border-zinc-900 bg-[#0a0a0a] pt-12 pb-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 lg:flex-row lg:px-8">
        
        {/* 左側: コピーライト & 名前 */}
        <div className="flex flex-col items-center gap-2 lg:items-start text-center lg:text-left">
           <div className="flex items-center gap-2 font-black text-xl tracking-tighter text-white">
                <span className="text-fuchsia-500">&gt;</span>
                <span>ERIC KEI</span>
           </div>
           <p className="text-xs text-zinc-500 font-mono">
             <DecryptedText text={`© ${currentYear} Burst Style. All rights reserved.`} animateOnHover speed={50} />
           </p>
        </div>

        {/* 中央: システムステータス */}
        <div className="hidden md:flex items-center gap-2 rounded-full bg-zinc-900/50 px-4 py-1.5 border border-zinc-800/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-mono text-zinc-400 tracking-wider">SYSTEM STATUS: ONLINE</span>
        </div>

        {/* 右側: ソーシャルリンク & トップへ戻る */}
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
                <MagneticButton strength={0.2}>
                    <a 
                        href="https://github.com/EricKei2002" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-white transition-colors p-2"
                        aria-label="GitHub"
                    >
                        <FaGithub size={20} />
                    </a>
                </MagneticButton>

            </div>

            <div className="h-8 w-px bg-zinc-800 mx-2 hidden sm:block"></div>

            <MagneticButton strength={0.2}>
                <button 
                    onClick={scrollToTop}
                    className="group flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-fuchsia-400 transition-colors uppercase tracking-wider"
                >
                    Top
                    <svg 
                        width="12" 
                        height="12" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="transition-transform group-hover:-translate-y-1"
                    >
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                </button>
            </MagneticButton>
        </div>

      </div>
    </footer>
  );
}

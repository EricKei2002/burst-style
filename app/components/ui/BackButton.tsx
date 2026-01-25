"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransitionStore } from "../../lib/store";
import MagneticButton from "./MagneticButton";
export default function BackButton() {
  const router = useRouter();
  const { setPhase, setIsWarping } = useTransitionStore();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setPhase('closing');
    setIsWarping(true); // ワープ開始
    
    setTimeout(() => {
        setPhase('closed');
        router.push("/#projects");
    }, 900);
  };

  return (
    <div className="fixed top-6 left-6 z-50 mix-blend-difference">
        <MagneticButton strength={0.3}>
            <Link 
            href="/#projects" 
            onClick={handleBack} 
            className="group relative flex items-center gap-3 px-5 py-3 rounded-full bg-zinc-900/40 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300"
            >
                <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/5 group-hover:bg-fuchsia-500/20 transition-colors">
                    <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="text-zinc-400 group-hover:text-fuchsia-400 transition-colors group-hover:-translate-x-0.5 transform duration-300"
                    >
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </div>
                <span className="text-sm font-mono text-zinc-300 group-hover:text-white transition-colors tracking-wide pr-1">
                    Back to Projects
                </span>
                
                {/* Hover Glow */}
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 bg-fuchsia-500/10 blur-md transition-opacity duration-500 -z-10" />
            </Link>
        </MagneticButton>
    </div>
  );
}

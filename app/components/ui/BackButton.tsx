"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransitionStore } from "../../lib/store";

export default function BackButton() {
  const router = useRouter();
  const { setPhase } = useTransitionStore();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setPhase('closing');
    
    setTimeout(() => {
        setPhase('closed');
        router.push("/#projects");
    }, 900);
  };

  return (
    <Link 
      href="/#projects" 
      onClick={handleBack} 
      className="text-sm font-mono text-zinc-500 hover:text-fuchsia-400 transition-colors inline-flex items-center gap-2 w-fit cursor-pointer mb-8"
    >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Projects
    </Link>
  );
}

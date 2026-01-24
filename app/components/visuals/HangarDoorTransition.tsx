"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTransitionStore } from "../../store/transition-store";

export default function HangarDoorTransition() {
  const { phase, setPhase } = useTransitionStore();
  const pathname = usePathname();
  
  // Handle opening doors when pathname changes
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Only trigger opening if pathname HAS CHANGED
    if (prevPathname.current !== pathname) {
        if (phase === 'closed' || phase === 'closing') {
            // Keep closed for a brief moment to mask the render, then open
            const timer = setTimeout(() => {
                setPhase('opening');
                
                setTimeout(() => {
                    setPhase('idle');
                }, 800);
            }, 300); // 300ms pause on black screen before opening
            
            prevPathname.current = pathname;
            return () => clearTimeout(timer);
        }
        prevPathname.current = pathname;
    }
  }, [pathname, phase, setPhase]);

  // Visual state calculation
  const isClosed = phase === 'closing' || phase === 'closed';

  const leftDoorClass = isClosed 
    ? "translate-x-0" 
    : "-translate-x-full";
    
  const rightDoorClass = isClosed 
    ? "translate-x-0" 
    : "translate-x-full";

  return (
    <div className="pointer-events-none fixed inset-0 z-100 flex overflow-hidden">
      {/* Left Door */}
      <div 
        className={`h-full w-1/2 bg-zinc-900 border-r-4 border-cyan-900 transition-transform duration-700 ease-in-out ${leftDoorClass}`}
        style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              #18181b 10px,
              #18181b 20px
            )`
        }}
      >
        {/* Door detail / handle */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-40 w-2 bg-cyan-500 shadow-[0_0_20px_#06b6d4]" />
      </div>

      {/* Right Door */}
      <div 
        className={`h-full w-1/2 bg-zinc-900 border-l-4 border-fuchsia-900 transition-transform duration-700 ease-in-out ${rightDoorClass}`}
        style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 10px,
              #18181b 10px,
              #18181b 20px
            )`
        }}
      >
         {/* Door detail / handle */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-40 w-2 bg-fuchsia-500 shadow-[0_0_20px_#d946ef]" />
      </div>
      
       {/* Center Lock Light (Optional enhancement) */}
       <div 
         className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-64 bg-linear-to-r from-cyan-500 to-fuchsia-500 blur-xl transition-opacity duration-300 ${isClosed ? 'opacity-100' : 'opacity-0'}`} 
       />
    </div>
  );
}

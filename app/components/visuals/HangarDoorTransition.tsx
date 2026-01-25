"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTransitionStore } from "../../lib/store";

export default function HangarDoorTransition() {
  const { phase, setPhase } = useTransitionStore();
  const pathname = usePathname();
  
  // パス名変更時にドアを開く処理
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // パス名が変更された場合のみ開く処理をトリガー
    if (prevPathname.current !== pathname) {
        if (phase === 'closed' || phase === 'closing') {
            // レンダリングを隠すために一瞬閉じたままにし、その後開く
            const timer = setTimeout(() => {
                setPhase('opening');
                
                setTimeout(() => {
                    setPhase('idle');
                }, 800);
            }, 300); // 開く前に黒い画面で300ms一時停止
            
            prevPathname.current = pathname;
            return () => clearTimeout(timer);
        }
        prevPathname.current = pathname;
    }
  }, [pathname, phase, setPhase]);

  // 視覚状態の計算
  const isClosed = phase === 'closing' || phase === 'closed';

  const leftDoorClass = isClosed 
    ? "translate-x-0" 
    : "-translate-x-full";
    
  const rightDoorClass = isClosed 
    ? "translate-x-0" 
    : "translate-x-full";

  return (
    <div className="pointer-events-none fixed inset-0 z-100 flex overflow-hidden">
      {/* 左のドア */}
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
        {/* ドアのディテール / ハンドル */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-40 w-2 bg-cyan-500 shadow-[0_0_20px_#06b6d4]" />
      </div>

      {/* 右のドア */}
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
         {/* ドアのディテール / ハンドル */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-40 w-2 bg-fuchsia-500 shadow-[0_0_20px_#d946ef]" />
      </div>
      
       {/* センターロックライト（オプションの拡張） */}
       <div 
         className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-64 bg-linear-to-r from-cyan-500 to-fuchsia-500 blur-xl transition-opacity duration-300 ${isClosed ? 'opacity-100' : 'opacity-0'}`} 
       />
    </div>
  );
}


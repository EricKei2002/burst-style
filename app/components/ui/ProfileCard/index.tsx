"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import Image from "next/image";
import { FaGithub } from "react-icons/fa";
import styles from './ProfileCard.module.css';

const DEFAULT_INNER_GRADIENT = 'linear-gradient(145deg, #18181b 0%, #27272a 100%)';

interface ProfileCardProps {
  avatarUrl?: string;
  name?: string;
  title?: string;
  className?: string;
  enableTilt?: boolean;
  innerGradient?: string;
  behindGlowColor?: string;
  backgroundImageUrl?: string;
}

// ユーティリティ関数
const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v: number, precision = 3) => parseFloat(v.toFixed(precision));
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) => 
  round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

export default function ProfileCard({
  avatarUrl,
  name = 'Eric Kei',
  title = 'Creative Developer',
  className = '',
  enableTilt = true,
  innerGradient = DEFAULT_INNER_GRADIENT,
  behindGlowColor = 'rgba(232, 121, 249, 0.4)', // フクシア色の色合い
  backgroundImageUrl,
  growthImages = [],
}: ProfileCardProps & { growthImages?: string[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const tiltEngine = useMemo(() => {
    if (!enableTilt) return null;
    let rafId: number | null = null;
    let running = false;
    let lastTs = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    
    // 物理演算用の定数
    const DEFAULT_TAU = 0.14;
    
    const setVarsFromXY = (x: number, y: number) => {
      const shell = shellRef.current;
      const wrap = wrapRef.current;
      if (!shell || !wrap) return;
      
      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;
      
      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);
      const centerX = percentX - 50;
      const centerY = percentY - 50;

      // CSS変数のマッピング
      const cssVars: Record<string, string> = {
        '--pointer-x': `${percentX}%`,
        '--pointer-y': `${percentY}%`,
        '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
        '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
        '--rotate-x': `${round(-(centerX / 15))}deg`, // 感度を調整
        '--rotate-y': `${round(centerY / 10)}deg`
      };

      for (const [k, v] of Object.entries(cssVars)) {
        wrap.style.setProperty(k, v);
      }
    };

    const step = (ts: number) => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      
      // スムーズな補間
      const k = 1 - Math.exp(-dt / DEFAULT_TAU);
      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;
      
      setVarsFromXY(currentX, currentY);
      
      const dist = Math.abs(targetX - currentX) + Math.abs(targetY - currentY);
      if (dist > 0.1 || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    };

    return {
      setTarget(x: number, y: number) {
        targetX = x;
        targetY = y;
        start();
      },
      cleanup() {
        if (rafId) cancelAnimationFrame(rafId);
        running = false;
      }
    };
  }, [enableTilt]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !tiltEngine) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const el = wrap.getBoundingClientRect();
      let cx = 0, cy = 0;

      if (e instanceof MouseEvent) {
        cx = e.clientX;
        cy = e.clientY;
      } else if ( window.TouchEvent && e instanceof TouchEvent && e.touches[0]) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      }

      const x = cx - el.left;
      const y = cy - el.top;
      
      tiltEngine.setTarget(x, y);
    };

    const handleLeave = () => {
      const el = wrap.getBoundingClientRect();
      // 中心にリセット
      tiltEngine.setTarget(el.width / 2, el.height / 2);
    };

    // 初期の中心位置
    const el = wrap.getBoundingClientRect();
    tiltEngine.setTarget(el.width / 2, el.height / 2);

    wrap.addEventListener('mousemove', handleMove);
    wrap.addEventListener('mouseleave', handleLeave);
    wrap.addEventListener('touchstart', handleMove, { passive: true });
    wrap.addEventListener('touchmove', handleMove, { passive: true });
    wrap.addEventListener('touchend', handleLeave);

    return () => {
      wrap.removeEventListener('mousemove', handleMove);
      wrap.removeEventListener('mouseleave', handleLeave);
      wrap.removeEventListener('touchstart', handleMove);
      wrap.removeEventListener('touchmove', handleMove);
      wrap.removeEventListener('touchend', handleLeave);
      tiltEngine.cleanup();
    };
  }, [tiltEngine]);



  return (
    <div 
      ref={wrapRef} 
      className={`${styles.wrapper} ${className}`}
      style={{
        '--inner-gradient': innerGradient,
        '--behind-glow-color': behindGlowColor,
        '--behind-glow-size': '60%',
        '--pointer-x': '50%',
        '--pointer-y': '50%',
      } as React.CSSProperties}
    >
      <div className={styles.behind} />
      <div ref={shellRef} className={styles.shell}>
        <div className={styles.card}>
          <div className={styles.inside}>
            {/* ベース画像 */}
            {backgroundImageUrl && (
              <Image 
                src={backgroundImageUrl} 
                alt="Profile Background Base" 
                className={styles.backgroundImage}
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                priority
                style={{ objectFit: 'cover', objectPosition: 'top' }}
              />
            )}

            {/* 成長画像（積み重ね） */}
            {growthImages.map((src, index) => {
               const isLast = index === growthImages.length - 1;
               // モバイル（デフォルト）では、最後の画像であれば表示します。
               // デスクトップ（lg）では、最初は非表示（opacity-0）で、GSAPによってアニメーションされます。
               // デスクトップで最初は非表示にするために 'lg:opacity-0' を使用します。
               // 最後以外の画像は、デフォルトで非表示のままで、デスクトップ上でアニメーションされます。
               
               const mobileClass = isLast ? "opacity-100 lg:opacity-0" : "opacity-0";

               return (
                 <Image 
                   key={src}
                   src={src} 
                   alt={`Profile Growth Stage ${index + 1}`} 
                   className={`${styles.backgroundImage} growth-stage-${index} ${mobileClass}`}
                   fill
                   sizes="(max-width: 768px) 100vw, 500px"
                   priority
                   style={{ objectFit: 'cover', objectPosition: 'top' }}
                 />
               );
            })}
            
            <div className={styles.cardOverlay} />

            <div className={styles.shine} />
            <div className={styles.glare} />
            
            <div className={styles.content}>
              <div className={styles.avatarContent}>
                {avatarUrl && (
                  <Image 
                    className={styles.avatar} 
                    src={avatarUrl} 
                    alt={name} 
                    width={80}
                    height={80}
                  />
                )}
                <div className={styles.userInfo}>
                  <div>STATUS: ONLINE</div>
                  <div>ID: 0216</div>
                </div>
              </div>
              
              <div className={styles.details}>
                <h3>{name}</h3>
                <p>{title}</p>
                <div className="mt-4 flex gap-2">
                  <span className="bg-zinc-800/50 px-2 py-1 rounded text-xs text-yellow-300 border border-yellow-500/20">JavaScript</span>
                  <span className="bg-zinc-800/50 px-2 py-1 rounded text-xs text-blue-300 border border-blue-500/20">TypeScript</span>
                  <span className="bg-zinc-800/50 px-2 py-1 rounded text-xs text-green-300 border border-green-500/20">Python</span>
                </div>
                
                <a 
                  href="https://github.com/EricKei2002" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 hover:bg-zinc-800/50 text-zinc-400 hover:text-white rounded-lg transition-colors border border-transparent hover:border-zinc-700 w-fit"
                >
                  <FaGithub className="text-xl" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

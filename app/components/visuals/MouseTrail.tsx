"use client";

import { useEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
  age: number;
  vx: number;
  vy: number;
}

export default function MouseTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const pointsRef = useRef<Point[]>([]);
  const [isTouch, setIsTouch] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(() => {
    if (typeof document === "undefined") return true;
    return !document.hidden;
  });
  const isRunningRef = useRef(false);
  const lastSpawnRef = useRef(0);

  useEffect(() => {
    const coarseMql = window.matchMedia("(pointer: coarse)");
    const reducedMotionMql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ?? false;
    const onChange = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    
    setTimeout(() => setIsTouch(coarseMql.matches || reducedMotionMql.matches || saveData), 0);
    
    coarseMql.addEventListener("change", onChange);
    return () => coarseMql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => setIsDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    if (isTouch) return;
    if (!isDocumentVisible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const spawnPoint = (x: number, y: number) => {
      const now = performance.now();
      if (now - lastSpawnRef.current < 16) return;
      lastSpawnRef.current = now;
      if (pointsRef.current.length > 72) {
        pointsRef.current.splice(0, pointsRef.current.length - 72);
      }
      pointsRef.current.push({
        x,
        y,
        age: 0,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    };

    const handlePointerMove = (e: PointerEvent) => {
      spawnPoint(e.clientX, e.clientY);
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        requestRef.current = requestAnimationFrame(update);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    handleResize();

    const update = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      pointsRef.current = pointsRef.current.filter((p) => p.age < 42);

      pointsRef.current.forEach((p) => {
        p.age += 1;
        p.x += p.vx * 0.5;
        p.y += p.vy * 0.5 + 0.5; // わずかな重力

        const alpha = 1 - p.age / 42;
        const size = (1 - p.age / 42) * 2.6;
        
        // 色の遷移: 緑からフクシアへ
        // 緑: 34, 197, 94 (およそ tw-green-500)
        // フクシア: 217, 70, 239 (およそ tw-fuchsia-500)
        
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`; // メインの緑
        if (p.age > 20) {
            ctx.fillStyle = `rgba(217, 70, 239, ${alpha})`; // フクシア色へフェード
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (pointsRef.current.length > 0 && !document.hidden) {
        requestRef.current = requestAnimationFrame(update);
      } else {
        isRunningRef.current = false;
      }
    };

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(requestRef.current);
      isRunningRef.current = false;
    };
  }, [isDocumentVisible, isTouch]);

  if (isTouch) return null;

  return (
    <canvas 
      ref={canvasRef} 
      className="pointer-events-none fixed inset-0 z-50"
      aria-hidden="true"
    />
  );
}

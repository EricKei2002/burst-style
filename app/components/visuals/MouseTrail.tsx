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
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)");
    const onChange = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    
    setTimeout(() => setIsTouch(mql.matches), 0);
    
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (isTouch) return;
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

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      // レスポンス向上のため移動時に即座にポイントを追加
      pointsRef.current.push({
        x: e.clientX,
        y: e.clientY,
        age: 0,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    handleResize();

    const update = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      // マウスが動いている間に連続的にポイントを追加します（オプション、またはmousemoveに頼る）。
      // 軌跡としては、通常mousemoveでポイントを追加するだけで十分ですが、"彗星"のような外観にするなら厳密に追従させるかもしれません。
      // ここではマウス位置から放出されるパーティクルとします。

      // ポイントの更新と描画
      // 古いポイントを除外
      pointsRef.current = pointsRef.current.filter((p) => p.age < 50);

      pointsRef.current.forEach((p) => {
        p.age += 1;
        p.x += p.vx * 0.5;
        p.y += p.vy * 0.5 + 0.5; // わずかな重力

        const alpha = 1 - p.age / 50;
        const size = (1 - p.age / 50) * 3;
        
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

      requestRef.current = requestAnimationFrame(update);
    };
    
    requestRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, [isTouch]);

  if (isTouch) return null;

  return (
    <canvas 
      ref={canvasRef} 
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}

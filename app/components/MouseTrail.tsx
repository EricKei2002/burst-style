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
     if (typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches) {
       setIsTouch(true);
     }
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
      // Add a point immediately on move for responsiveness
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

      // Add points continuously if mouse is moving (optional, or just rely on mousemove)
      // For a trail, we usually just let mousemove add points, but for a "comet" look we might strictly follow.
      // Let's stick to particles emitted from mouse position.

      // Update and draw points
      // Filter out old points
      pointsRef.current = pointsRef.current.filter((p) => p.age < 50);

      pointsRef.current.forEach((p) => {
        p.age += 1;
        p.x += p.vx * 0.5;
        p.y += p.vy * 0.5 + 0.5; // Slight gravity

        const alpha = 1 - p.age / 50;
        const size = (1 - p.age / 50) * 3;
        
        // Color transition: Green to Fuchsia
        // Green: 34, 197, 94 (approx tw-green-500)
        // Fuchsia: 217, 70, 239 (approx tw-fuchsia-500)
        
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`; // Primary Green
        if (p.age > 20) {
            ctx.fillStyle = `rgba(217, 70, 239, ${alpha})`; // Fade to Fuchsia
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

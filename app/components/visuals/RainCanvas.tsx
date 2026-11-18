"use client";

import { useEffect, useRef } from "react";

/** 雨の線の色（青灰色・半透明・単色。光る先端やグラデーションは付けない） */
const RAIN_COLOR = "rgba(150, 164, 182, 0.3)";
/** 鉛直からの傾き（ラジアン）。角度は全体で一定 */
const RAIN_ANGLE = 0.2;

type Drop = { x: number; y: number; len: number; speed: number };

/**
 * 雨。細く短い青灰色の線を、ほぼ一定の角度と速さで落とす Canvas。
 * - 粒の数は画面の面積に合わせる（スマホは少なめ）。低スペック端末では半分
 * - タブが見えていないときは止める。動きを減らす設定では描かない（CSS でも非表示）
 * - 本文の後ろ・クリックは通す・読み上げからは隠す
 */
export default function RainCanvas({
  lite,
  paused,
}: {
  lite: boolean;
  paused: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let drops: Drop[] = [];
    const dx = Math.tan(RAIN_ANGLE);

    const makeDrop = (y: number): Drop => ({
      // 斜めに流れて画面外へ出る分、左側にも余分に置く
      x: Math.random() * (width + height * dx) - height * dx,
      y,
      len: 9 + Math.random() * 7,
      speed: 760 + Math.random() * 80,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const perArea = lite ? 26000 : 14000;
      const count = Math.max(
        24,
        Math.min(lite ? 60 : 110, Math.round((width * height) / perArea)),
      );
      drops = Array.from({ length: count }, () =>
        makeDrop(Math.random() * height),
      );
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = RAIN_COLOR;
      ctx.lineWidth = 1;
      ctx.lineCap = "butt";
      ctx.beginPath();
      for (const d of drops) {
        d.y += d.speed * dt;
        d.x += d.speed * dt * dx;
        if (d.y - d.len > height) Object.assign(d, makeDrop(-d.len));
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * dx, d.y - d.len);
      }
      ctx.stroke();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [lite, paused]);

  return (
    <canvas ref={canvasRef} className="local-sky-rain" aria-hidden="true" />
  );
}

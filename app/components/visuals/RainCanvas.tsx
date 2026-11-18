"use client";

import { useEffect, useRef } from "react";

/** 雨の線の色（青灰色・半透明・単色。光る先端やグラデーションは付けない） */
const RAIN_COLOR = "rgba(150, 164, 182, 0.3)";
/** 鉛直からの傾き（ラジアン）。角度は全体で一定 */
const RAIN_ANGLE = 0.2;

/** 地面の水たまりに広がる輪（同じ青灰色の細い線。光らせない） */
const RIPPLE_RGB = "160, 175, 195";
const RIPPLE_LIFE = 0.7;

type Drop = {
  x: number;
  y: number;
  len: number;
  speed: number;
  /** この高さで地面に当たって輪になる */
  groundY: number;
};
type Ripple = { x: number; y: number; age: number; max: number };

/**
 * 雨。細く短い青灰色の線を、ほぼ一定の角度と速さで落とす Canvas。
 * - 画面下の濡れた地面（.local-sky-wet）に当たった粒は、横長の細い輪になって広がる
 * - 粒の数は画面の面積に合わせる（スマホは少なめ）。低スペック端末では半分にし、輪も描かない
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
    let ripples: Ripple[] = [];
    const dx = Math.tan(RAIN_ANGLE);

    const makeDrop = (y: number): Drop => ({
      // 斜めに流れて画面外へ出る分、左側にも余分に置く
      x: Math.random() * (width + height * dx) - height * dx,
      y,
      len: 9 + Math.random() * 7,
      speed: 760 + Math.random() * 80,
      groundY: height * (0.8 + Math.random() * 0.2),
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
        if (d.y >= d.groundY) {
          if (!lite && ripples.length < 40 && Math.random() < 0.7) {
            ripples.push({
              x: d.x,
              y: d.groundY,
              age: 0,
              max: 7 + Math.random() * 9,
            });
          }
          Object.assign(d, makeDrop(-d.len));
          continue;
        }
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * dx, d.y - d.len);
      }
      ctx.stroke();

      // 地面の輪（奥行きが出るよう横長の楕円。時間とともに広がって消える）
      ripples = ripples.filter((r) => (r.age += dt) < RIPPLE_LIFE);
      for (const r of ripples) {
        const t = r.age / RIPPLE_LIFE;
        const radius = 1 + r.max * t;
        ctx.strokeStyle = `rgba(${RIPPLE_RGB}, ${(0.32 * (1 - t)).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, radius, radius * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
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

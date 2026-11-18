"use client";

import { useEffect, useRef } from "react";
import {
  rgbCss,
  type PlanetTheme,
  type PlanetTerrain,
} from "../../lib/planets";
import { prefersReducedMotion } from "../../lib/pageTransitionTiming";

type Props = {
  theme: PlanetTheme;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
};

function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function heightAt(terrain: PlanetTerrain, xNorm: number, seed: number): number {
  const x = xNorm;
  if (terrain === "dunes") {
    return (
      0.22 +
      0.1 * Math.sin(x * 6.2 + seed) +
      0.05 * Math.sin(x * 13.0 + 2) +
      0.025 * Math.sin(x * 27.0)
    );
  }
  if (terrain === "fog-flats") {
    return 0.16 + 0.03 * Math.sin(x * 4.0 + seed) + 0.015 * Math.sin(x * 11.0);
  }
  if (terrain === "facets") {
    const q = Math.floor(x * 11) / 11;
    const peak = 0.08 + 0.14 * hash(q * 17 + seed);
    const local = (x * 11) % 1;
    return 0.14 + peak * (1 - Math.abs(local * 2 - 1));
  }
  if (terrain === "canyons") {
    const gorges = Math.abs(Math.sin(x * 9 + seed));
    return 0.18 + 0.14 * Math.pow(gorges, 1.6) - 0.08 * Math.pow(1 - gorges, 4);
  }
  if (terrain === "hangar") {
    const pad = x > 0.28 && x < 0.72 ? 0.02 : 0;
    const bay = x > 0.42 && x < 0.58 ? 0.08 : 0;
    return (
      0.14 +
      0.03 * Math.sin(x * 8) +
      pad +
      bay * (1 - Math.abs((x - 0.5) / 0.08))
    );
  }
  // crater
  const d = Math.abs(x - 0.5);
  const rim = Math.exp(-Math.pow((d - 0.22) * 8, 2));
  return 0.16 + 0.12 * rim - 0.05 * Math.exp(-Math.pow(d * 5, 2));
}

function drawTerrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: PlanetTheme,
) {
  const horizonY = h * 0.62;
  const steps = Math.max(80, Math.floor(w / 8));

  const fill = (offset: number, color: string, scale: number) => {
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * w;
      const hn = heightAt(theme.terrain, i / steps, offset);
      ctx.lineTo(x, horizonY + h * 0.08 - hn * h * scale);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  fill(1.7, rgbCss(theme.groundHi, 0.55), 0.7);
  fill(0.4, rgbCss(theme.ground), 1);

  // 地平の発光
  const hg = ctx.createLinearGradient(
    0,
    horizonY - h * 0.18,
    0,
    horizonY + h * 0.08,
  );
  hg.addColorStop(0, rgbCss(theme.accent, 0));
  hg.addColorStop(0.55, rgbCss(theme.accent, 0.22));
  hg.addColorStop(1, rgbCss(theme.haze, 0));
  ctx.fillStyle = hg;
  ctx.fillRect(0, horizonY - h * 0.18, w, h * 0.28);

  if (theme.terrain === "hangar") {
    const bx = w * 0.44;
    const by = horizonY - 8;
    const bw = w * 0.12;
    const bh = h * 0.09;
    ctx.fillStyle = rgbCss(theme.groundHi, 0.85);
    ctx.fillRect(bx, by - bh, bw, bh);
    ctx.fillStyle = rgbCss(theme.accent2, 0.35);
    ctx.fillRect(bx + bw * 0.2, by - bh * 0.55, bw * 0.18, bh * 0.28);
    ctx.fillRect(bx + bw * 0.55, by - bh * 0.55, bw * 0.18, bh * 0.28);
  }
}

function spawnParticle(
  w: number,
  h: number,
  theme: PlanetTheme,
  rnd: () => number,
): Particle {
  const kind = theme.particles;
  if (kind === "embers") {
    return {
      x: rnd() * w,
      y: h * (0.55 + rnd() * 0.4),
      vx: (rnd() - 0.5) * 8,
      vy: -(12 + rnd() * 22),
      size: 1 + rnd() * 2.2,
      life: 0,
      maxLife: 2.4 + rnd() * 2.2,
    };
  }
  if (kind === "shards") {
    return {
      x: rnd() * w,
      y: h * (0.2 + rnd() * 0.6),
      vx: (rnd() - 0.5) * 40,
      vy: (rnd() - 0.5) * 10,
      size: 1 + rnd() * 3,
      life: 0,
      maxLife: 1.2 + rnd() * 1.4,
    };
  }
  if (kind === "aurora") {
    return {
      x: rnd() * w,
      y: h * (0.1 + rnd() * 0.45),
      vx: 8 + rnd() * 16,
      vy: (rnd() - 0.5) * 6,
      size: 8 + rnd() * 18,
      life: 0,
      maxLife: 3 + rnd() * 3,
    };
  }
  if (kind === "sparks") {
    return {
      x: rnd() * w,
      y: rnd() * h * 0.7,
      vx: (rnd() - 0.5) * 16,
      vy: (rnd() - 0.5) * 16,
      size: 0.8 + rnd() * 1.8,
      life: 0,
      maxLife: 1.6 + rnd() * 1.8,
    };
  }
  if (kind === "ash") {
    return {
      x: rnd() * w,
      y: rnd() * h,
      vx: (rnd() - 0.5) * 6,
      vy: 6 + rnd() * 10,
      size: 0.8 + rnd() * 1.6,
      life: 0,
      maxLife: 4 + rnd() * 3,
    };
  }
  // mist
  return {
    x: rnd() * w,
    y: h * (0.35 + rnd() * 0.5),
    vx: 4 + rnd() * 10,
    vy: (rnd() - 0.5) * 4,
    size: 16 + rnd() * 36,
    life: 0,
    maxLife: 5 + rnd() * 4,
  };
}

export default function PlanetInterior({ theme }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = prefersReducedMotion();
    let raf = 0;
    let running = true;
    const particles: Particle[] = [];
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintStatic(w, h);
    };

    const paintStatic = (w: number, h: number) => {
      ctx.clearRect(0, 0, w, h);
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7);
      sky.addColorStop(0, rgbCss(theme.skyTop));
      sky.addColorStop(1, rgbCss(theme.skyHorizon));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.72);

      const glow = ctx.createRadialGradient(
        w * 0.5,
        h * 0.6,
        h * 0.04,
        w * 0.5,
        h * 0.62,
        h * 0.55,
      );
      glow.addColorStop(0, rgbCss(theme.accent, 0.28));
      glow.addColorStop(0.45, rgbCss(theme.haze, 0.12));
      glow.addColorStop(1, rgbCss(theme.haze, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, h * 0.3, w, h * 0.5);

      drawTerrain(ctx, w, h, theme);
    };

    const count =
      theme.particles === "mist" || theme.particles === "aurora" ? 28 : 48;

    const tick = (now: number) => {
      if (!running) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      paintStatic(w, h);

      while (particles.length < count) {
        particles.push(spawnParticle(w, h, theme, Math.random));
      }
      const accent = theme.accent;
      const accent2 = theme.accent2;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (
          p.life >= p.maxLife ||
          p.y < -20 ||
          p.y > h + 20 ||
          p.x < -40 ||
          p.x > w + 40
        ) {
          particles.splice(i, 1);
          continue;
        }
        const t = p.life / p.maxLife;
        const a = t < 0.15 ? t / 0.15 : t > 0.75 ? (1 - t) / 0.25 : 1;
        const col = hash(p.size * 10) > 0.5 ? accent : accent2;
        if (theme.particles === "mist" || theme.particles === "aurora") {
          ctx.fillStyle = rgbCss(col, 0.08 * a);
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (theme.particles === "shards") {
          ctx.strokeStyle = rgbCss(col, 0.7 * a);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
          ctx.lineTo(p.x + p.vx * 0.02, p.y + p.vy * 0.02);
          ctx.stroke();
        } else {
          ctx.fillStyle = rgbCss(col, 0.75 * a);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);

    if (!reduce) {
      const start = () => {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      };
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(start, { timeout: 800 });
      } else {
        setTimeout(start, 0);
      }
    }

    const onVis = () => {
      if (document.hidden) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
      } else if (!reduce) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [theme]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-50 h-full w-full overflow-hidden"
      style={{ backgroundColor: rgbCss(theme.skyTop) }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* 本文のコントラストを保つ上部の暗幕 */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${rgbCss(theme.skyTop, 0.72)} 0%, ${rgbCss(theme.skyTop, 0.28)} 28%, transparent 58%)`,
        }}
      />
    </div>
  );
}

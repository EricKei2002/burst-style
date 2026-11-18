"use client";

import { useEffect, useRef } from "react";
import {
  rgbCss,
  type PlanetTheme,
  type PlanetTerrain,
  type Rgb,
} from "../../lib/planets";
import { prefersReducedMotion } from "../../lib/pageTransitionTiming";

type Props = {
  theme: PlanetTheme;
};

type Quality = "high" | "medium" | "low";

type QualityConfig = {
  quality: Quality;
  dprCap: number;
  layers: number;
  clouds: number;
  particles: number;
  rays: number;
  moons: number;
  parallax: boolean;
  animate: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  layer: number;
};

type Cloud = {
  x: number;
  y: number;
  sx: number;
  sy: number;
  vx: number;
  layer: number;
  seed: number;
};

type NavHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function detectQuality(reduce: boolean): QualityConfig {
  if (reduce) {
    return {
      quality: "low",
      dprCap: 1,
      layers: 3,
      clouds: 4,
      particles: 0,
      rays: 1,
      moons: 1,
      parallax: false,
      animate: false,
    };
  }
  const nav = navigator as NavHints;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 768;
  const mobile = coarse || narrow;
  const mem = nav.deviceMemory;
  const cores = navigator.hardwareConcurrency || 8;
  const saveData = nav.connection?.saveData === true;
  const lowEnd =
    saveData || (typeof mem === "number" && mem <= 4) || cores <= 4;

  if (lowEnd) {
    return {
      quality: "low",
      dprCap: 1,
      layers: 2,
      clouds: 3,
      particles: 16,
      rays: 0,
      moons: 1,
      parallax: false,
      animate: true,
    };
  }
  if (mobile) {
    return {
      quality: "medium",
      dprCap: 1.25,
      layers: 3,
      clouds: 6,
      particles: 28,
      rays: 2,
      moons: 1,
      parallax: true,
      animate: true,
    };
  }
  return {
    quality: "high",
    dprCap: 1.75,
    layers: 4,
    clouds: 10,
    particles: 64,
    rays: 3,
    moons: 2,
    parallax: true,
    animate: true,
  };
}

function heightAt(terrain: PlanetTerrain, xNorm: number, seed: number): number {
  const x = xNorm;
  if (terrain === "dunes") {
    return (
      0.22 +
      0.1 * Math.sin(x * 6.2 + seed) +
      0.05 * Math.sin(x * 13.0 + 2 + seed * 0.3) +
      0.025 * Math.sin(x * 27.0 + seed * 1.7) +
      0.012 * Math.sin(x * 53.0 + seed * 2.1)
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
      0.03 * Math.sin(x * 8 + seed) +
      pad +
      bay * (1 - Math.abs((x - 0.5) / 0.08))
    );
  }
  const d = Math.abs(x - 0.5);
  const rim = Math.exp(-Math.pow((d - 0.22) * 8, 2));
  return 0.16 + 0.12 * rim - 0.05 * Math.exp(-Math.pow(d * 5, 2));
}

function sunPos(theme: PlanetTheme, w: number, horizonY: number) {
  if (theme.id === "about") return { x: w * 0.72, y: horizonY - 6, r: 18 };
  if (theme.id === "contact") return { x: w * 0.22, y: horizonY - 10, r: 10 };
  if (theme.id === "uncharted") return { x: w * 0.58, y: horizonY - 4, r: 9 };
  return { x: w * 0.36, y: horizonY - 8, r: 14 };
}

function drawMoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: Rgb,
  limb: Rgb,
) {
  const halo = ctx.createRadialGradient(
    x,
    y,
    radius * 0.85,
    x,
    y,
    radius * 1.85,
  );
  halo.addColorStop(0, rgbCss(fill, 0.22));
  halo.addColorStop(0.45, rgbCss(fill, 0.08));
  halo.addColorStop(1, rgbCss(fill, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.85, 0, Math.PI * 2);
  ctx.fill();

  const body = ctx.createRadialGradient(
    x - radius * 0.32,
    y - radius * 0.34,
    radius * 0.08,
    x,
    y,
    radius,
  );
  body.addColorStop(0, rgbCss(fill, 1));
  body.addColorStop(0.55, rgbCss(limb, 0.95));
  body.addColorStop(1, rgbCss(limb, 0.55));
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: PlanetTheme,
  lookX: number,
  lookY: number,
  moons: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72);
  sky.addColorStop(0, rgbCss(theme.skyTop));
  sky.addColorStop(0.55, rgbCss(theme.skyTop, 0.96));
  sky.addColorStop(1, rgbCss(theme.skyHorizon));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // レイリー散乱：地平に向かって色が濃くなる
  const scatter = ctx.createLinearGradient(0, h * 0.28, 0, h * 0.66);
  scatter.addColorStop(0, rgbCss(theme.haze, 0));
  scatter.addColorStop(0.55, rgbCss(theme.haze, 0.1));
  scatter.addColorStop(1, rgbCss(theme.accent, 0.22));
  ctx.fillStyle = scatter;
  ctx.fillRect(0, h * 0.28, w, h * 0.4);

  if (moons > 0) {
    const px = lookX * 10;
    const py = lookY * 6;
    if (theme.id === "about") {
      drawMoon(
        ctx,
        w * 0.18 + px,
        h * 0.16 + py,
        Math.min(w, h) * 0.07,
        theme.accent,
        theme.groundHi,
      );
    } else if (theme.id === "contact") {
      drawMoon(
        ctx,
        w * 0.82 + px,
        h * 0.14 + py,
        Math.min(w, h) * 0.055,
        theme.accent2,
        theme.skyHorizon,
      );
    } else if (theme.id === "uncharted") {
      drawMoon(
        ctx,
        w * 0.78 + px,
        h * 0.18 + py,
        Math.min(w, h) * 0.05,
        theme.groundHi,
        theme.ground,
      );
    } else {
      drawMoon(
        ctx,
        w * 0.8 + px,
        h * 0.15 + py,
        Math.min(w, h) * 0.062,
        theme.accent,
        theme.skyHorizon,
      );
    }
  }
  if (moons > 1) {
    const px = lookX * 16;
    const py = lookY * 10;
    const second: Rgb = theme.id === "contact" ? theme.accent : theme.accent2;
    drawMoon(
      ctx,
      w * (theme.id === "about" ? 0.88 : 0.14) + px,
      h * 0.22 + py,
      Math.min(w, h) * 0.028,
      second,
      theme.skyTop,
    );
  }
}

function drawHorizonGlow(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: PlanetTheme,
  t: number,
  quality: Quality,
) {
  const horizonY = h * 0.6;
  const breath = 0.7 + 0.3 * Math.sin(t * 0.35);
  const spots =
    quality === "low"
      ? [0.5]
      : theme.id === "contact"
        ? [0.22, 0.5, 0.78]
        : [0.32, 0.52, 0.74];
  for (let i = 0; i < spots.length; i++) {
    const pulse = 0.65 + 0.35 * Math.sin(t * (0.28 + i * 0.11) + i * 2.1);
    const gx = w * spots[i];
    const gy = horizonY;
    const rad = h * (0.28 + 0.08 * i);
    const glow = ctx.createRadialGradient(gx, gy, h * 0.02, gx, gy, rad);
    glow.addColorStop(0, rgbCss(theme.accent, 0.34 * breath * pulse));
    glow.addColorStop(0.4, rgbCss(theme.haze, 0.16 * breath * pulse));
    glow.addColorStop(1, rgbCss(theme.haze, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, horizonY - rad, w, rad * 1.4);
  }

  const band = ctx.createLinearGradient(
    0,
    horizonY - h * 0.16,
    0,
    horizonY + h * 0.08,
  );
  band.addColorStop(0, rgbCss(theme.accent, 0));
  band.addColorStop(0.55, rgbCss(theme.accent, 0.18 * breath));
  band.addColorStop(1, rgbCss(theme.haze, 0));
  ctx.fillStyle = band;
  ctx.fillRect(0, horizonY - h * 0.16, w, h * 0.24);
}

function drawGodRays(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: PlanetTheme,
  count: number,
  t: number,
  lookX: number,
) {
  if (count <= 0) return;
  const horizonY = h * 0.6;
  const sun = sunPos(theme, w, horizonY);
  const srcX = sun.x + lookX * 8;
  const srcY = sun.y;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < count; i++) {
    const base = -0.55 + i * (1.1 / Math.max(1, count - 1));
    const wobble = 0.04 * Math.sin(t * 0.2 + i);
    const angle = base + wobble;
    const alpha = 0.045 + 0.03 * (0.5 + 0.5 * Math.sin(t * 0.33 + i * 1.7));
    const len = h * (0.55 + 0.12 * hash(i + 2));
    const width = w * (0.045 + 0.03 * hash(i + 9));
    ctx.save();
    ctx.translate(srcX, srcY);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, 0, 0, len);
    g.addColorStop(0, rgbCss(theme.accent, alpha * 1.6));
    g.addColorStop(0.35, rgbCss(theme.haze, alpha));
    g.addColorStop(1, rgbCss(theme.haze, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-width * 0.12, 0);
    ctx.lineTo(width * 0.12, 0);
    ctx.lineTo(width, len);
    ctx.lineTo(-width, len);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  const disc = ctx.createRadialGradient(srcX, srcY, 1, srcX, srcY, sun.r * 3);
  disc.addColorStop(0, rgbCss(theme.accent, 0.85));
  disc.addColorStop(0.25, rgbCss(theme.accent, 0.35));
  disc.addColorStop(1, rgbCss(theme.accent, 0));
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(srcX, srcY, sun.r * 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds(
  ctx: CanvasRenderingContext2D,
  clouds: Cloud[],
  theme: PlanetTheme,
  lookX: number,
  lookY: number,
) {
  for (const c of clouds) {
    const px = c.x + lookX * (4 + c.layer * 8);
    const py = c.y + lookY * (2 + c.layer * 4);
    ctx.fillStyle = rgbCss(
      c.layer < 1 ? theme.skyHorizon : theme.haze,
      0.07 + c.layer * 0.04,
    );
    ctx.beginPath();
    ctx.ellipse(px, py, c.sx, c.sy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      px - c.sx * 0.45,
      py + c.sy * 0.12,
      c.sx * 0.7,
      c.sy * 0.75,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      px + c.sx * 0.4,
      py + c.sy * 0.08,
      c.sx * 0.62,
      c.sy * 0.7,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function drawTerrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: PlanetTheme,
  lookX: number,
  lookY: number,
  layerCount: number,
  t: number,
) {
  const horizonY = h * 0.6;
  const steps = Math.max(80, Math.floor(w / (layerCount >= 4 ? 6 : 10)));
  const defs = [
    {
      seed: 2.15,
      scale: 0.46,
      yShift: -h * 0.1,
      parallax: 0.16,
      color: rgbCss(theme.haze, 0.45),
    },
    {
      seed: 1.4,
      scale: 0.68,
      yShift: -h * 0.04,
      parallax: 0.34,
      color: rgbCss(theme.groundHi, 0.62),
    },
    {
      seed: 0.62,
      scale: 0.92,
      yShift: h * 0.01,
      parallax: 0.62,
      color: rgbCss(theme.groundHi, 0.92),
    },
    {
      seed: 0.18,
      scale: 1.18,
      yShift: h * 0.04,
      parallax: 1,
      color: rgbCss(theme.ground, 1),
    },
  ].slice(-layerCount);

  defs.forEach((def, index) => {
    const ox = lookX * 18 * def.parallax;
    const oy = lookY * 8 * def.parallax;
    ctx.beginPath();
    ctx.moveTo(-40 + ox, h);
    for (let i = 0; i <= steps; i++) {
      const xn = i / steps;
      const x = xn * w + ox;
      const hn = heightAt(theme.terrain, xn + def.seed * 0.02, def.seed);
      ctx.lineTo(x, horizonY + def.yShift + oy - hn * h * def.scale);
    }
    ctx.lineTo(w + 40 + ox, h);
    ctx.closePath();
    ctx.fillStyle = def.color;
    ctx.fill();

    // 中景のあとに薄い霧を挟む
    if (index === Math.max(0, defs.length - 3) || index === 0) {
      const fogY = horizonY + def.yShift - h * 0.04;
      const fog = ctx.createLinearGradient(
        0,
        fogY - h * 0.08,
        0,
        fogY + h * 0.16,
      );
      fog.addColorStop(0, rgbCss(theme.haze, 0));
      fog.addColorStop(0.45, rgbCss(theme.haze, 0.16));
      fog.addColorStop(1, rgbCss(theme.skyHorizon, 0));
      ctx.fillStyle = fog;
      ctx.fillRect(0, fogY - h * 0.08, w, h * 0.24);
    }
  });

  if (theme.terrain === "hangar") {
    const ox = lookX * 18;
    const oy = lookY * 8;
    const by = horizonY + h * 0.02 + oy;
    const bayX = w * 0.4 + ox;
    const bayW = w * 0.2;
    const bayH = h * 0.12;
    ctx.fillStyle = rgbCss(theme.ground, 0.96);
    ctx.fillRect(bayX, by - bayH, bayW, bayH);
    ctx.fillStyle = rgbCss(theme.groundHi, 0.9);
    ctx.fillRect(
      bayX + bayW * 0.08,
      by - bayH * 1.35,
      bayW * 0.12,
      bayH * 0.45,
    );
    ctx.fillRect(bayX + bayW * 0.8, by - bayH * 1.28, bayW * 0.1, bayH * 0.38);
    const lit = 0.25 + 0.2 * (0.5 + 0.5 * Math.sin(t * 1.4));
    ctx.fillStyle = rgbCss(theme.accent2, lit);
    ctx.fillRect(
      bayX + bayW * 0.22,
      by - bayH * 0.62,
      bayW * 0.16,
      bayH * 0.28,
    );
    ctx.fillRect(
      bayX + bayW * 0.52,
      by - bayH * 0.62,
      bayW * 0.16,
      bayH * 0.28,
    );
    ctx.fillStyle = rgbCss(theme.accent, 0.45);
    ctx.fillRect(bayX + bayW * 0.08, by - 3, bayW * 0.84, 3);
  }
}

function spawnParticle(
  w: number,
  h: number,
  theme: PlanetTheme,
  rnd: () => number,
): Particle {
  const kind = theme.particles;
  const layer = rnd();
  if (kind === "embers") {
    return {
      x: rnd() * w,
      y: h * (0.55 + rnd() * 0.4),
      vx: (rnd() - 0.5) * 8,
      vy: -(12 + rnd() * 22),
      size: 1 + rnd() * 2.2,
      life: 0,
      maxLife: 2.4 + rnd() * 2.2,
      layer,
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
      layer,
    };
  }
  if (kind === "aurora") {
    return {
      x: rnd() * w,
      y: h * (0.08 + rnd() * 0.42),
      vx: 8 + rnd() * 16,
      vy: (rnd() - 0.5) * 6,
      size: 10 + rnd() * 22,
      life: 0,
      maxLife: 3 + rnd() * 3,
      layer,
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
      layer,
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
      layer,
    };
  }
  return {
    x: rnd() * w,
    y: h * (0.35 + rnd() * 0.5),
    vx: 4 + rnd() * 10,
    vy: (rnd() - 0.5) * 4,
    size: 16 + rnd() * 36,
    life: 0,
    maxLife: 5 + rnd() * 4,
    layer,
  };
}

function spawnCloud(w: number, h: number, rnd: () => number): Cloud {
  const layer = rnd();
  return {
    x: rnd() * w,
    y: h * (0.18 + rnd() * 0.32 + layer * 0.04),
    sx: 40 + rnd() * 90 + layer * 20,
    sy: 10 + rnd() * 22,
    vx: 3 + rnd() * 8 + layer * 6,
    layer,
    seed: rnd() * 20,
  };
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  theme: PlanetTheme,
  w: number,
  h: number,
  dt: number,
  lookX: number,
  lookY: number,
  count: number,
) {
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
    const fade = p.life / p.maxLife;
    const a = fade < 0.15 ? fade / 0.15 : fade > 0.75 ? (1 - fade) / 0.25 : 1;
    const col = hash(p.size * 10) > 0.5 ? accent : accent2;
    const px = p.x + lookX * (4 + p.layer * 10);
    const py = p.y + lookY * (2 + p.layer * 6);
    if (theme.particles === "mist" || theme.particles === "aurora") {
      ctx.fillStyle = rgbCss(col, 0.09 * a);
      ctx.beginPath();
      ctx.ellipse(px, py, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (theme.particles === "shards") {
      ctx.strokeStyle = rgbCss(col, 0.7 * a);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px - p.vx * 0.04, py - p.vy * 0.04);
      ctx.lineTo(px + p.vx * 0.02, py + p.vy * 0.02);
      ctx.stroke();
    } else {
      ctx.fillStyle = rgbCss(col, 0.75 * a);
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export default function PlanetInterior({ theme }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduce = prefersReducedMotion();
    let cfg = detectQuality(reduce);
    let raf = 0;
    let running = true;
    let onScreen = true;
    const particles: Particle[] = [];
    const clouds: Cloud[] = [];
    let last = performance.now();
    let lookX = 0;
    let lookY = 0;
    let targetX = 0;
    let targetY = 0;
    let clock = 0;

    const size = () => ({
      w: window.innerWidth,
      h: window.innerHeight,
    });

    const resize = () => {
      cfg = detectQuality(reduce);
      const { w, h } = size();
      const dpr = Math.min(window.devicePixelRatio || 1, cfg.dprCap);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      clouds.length = 0;
      while (clouds.length < cfg.clouds) {
        clouds.push(spawnCloud(w, h, Math.random));
      }
      paint(0, true);
    };

    const paint = (dt: number, forceStatic = false) => {
      const { w, h } = size();
      if (cfg.animate && !forceStatic) {
        clock += dt;
        if (cfg.parallax) {
          const k = 1 - Math.exp(-dt * 6);
          lookX += (targetX - lookX) * k;
          lookY += (targetY - lookY) * k;
        }
        for (const c of clouds) {
          c.x += c.vx * dt;
          if (c.x - c.sx > w + 40) c.x = -c.sx - 40;
        }
      }
      ctx.clearRect(0, 0, w, h);
      drawSky(ctx, w, h, theme, lookX, lookY, cfg.moons);
      drawHorizonGlow(ctx, w, h, theme, clock, cfg.quality);
      drawGodRays(ctx, w, h, theme, cfg.rays, clock, lookX);
      drawClouds(ctx, clouds, theme, lookX, lookY);
      drawTerrain(ctx, w, h, theme, lookX, lookY, cfg.layers, clock);
      if (cfg.particles > 0 && (cfg.animate || forceStatic)) {
        if (forceStatic && !cfg.animate) {
          while (particles.length < Math.min(8, cfg.particles || 8)) {
            const p = spawnParticle(w, h, theme, Math.random);
            p.life = p.maxLife * 0.4;
            particles.push(p);
          }
          drawParticles(
            ctx,
            particles,
            theme,
            w,
            h,
            0,
            lookX,
            lookY,
            particles.length,
          );
        } else {
          drawParticles(
            ctx,
            particles,
            theme,
            w,
            h,
            dt,
            lookX,
            lookY,
            cfg.particles,
          );
        }
      }
    };

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      paint(dt);
      raf = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!cfg.animate || !running || !onScreen) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    window.addEventListener("resize", resize);

    const onPointer = (e: PointerEvent) => {
      if (!cfg.parallax) return;
      targetX = Math.max(
        -1,
        Math.min(1, (e.clientX / window.innerWidth - 0.5) * 2),
      );
      targetY = Math.max(
        -1,
        Math.min(1, (e.clientY / window.innerHeight - 0.5) * 2),
      );
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    // 許可ダイアログは出さない。届く端末だけで傾きを使う。
    const onOrient = (e: DeviceOrientationEvent) => {
      if (!cfg.parallax) return;
      if (e.gamma == null || e.beta == null) return;
      targetX = Math.max(-1, Math.min(1, e.gamma / 25));
      targetY = Math.max(-1, Math.min(1, (e.beta - 40) / 35));
    };
    window.addEventListener("deviceorientation", onOrient);

    if (cfg.animate) {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(startLoop, { timeout: 800 });
      } else {
        setTimeout(startLoop, 0);
      }
    }

    const onVis = () => {
      if (document.hidden) {
        running = false;
        stopLoop();
      } else {
        running = true;
        if (cfg.animate && onScreen) startLoop();
        else paint(0, true);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    let io: IntersectionObserver | null = null;
    if (host && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          onScreen = entries.some((entry) => entry.isIntersecting);
          if (!onScreen) {
            stopLoop();
          } else if (running && cfg.animate && !raf) {
            startLoop();
          }
        },
        { threshold: 0 },
      );
      io.observe(host);
    }

    return () => {
      running = false;
      stopLoop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onOrient);
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
    };
  }, [theme]);

  return (
    <div
      ref={hostRef}
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

#!/usr/bin/env node
/**
 * プロジェクトカードクリック → 動画再生開始までのタイムラインを計測する。
 * 用法: BASE_URL=http://127.0.0.1:3000 node scripts/measure-project-transition.mjs
 */
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";

async function measureRun(page, label) {
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.evaluate(() =>
    window.scrollTo(0, document.body.scrollHeight * 0.55),
  );
  await page.waitForSelector("button.project-card", { timeout: 20000 });
  await page.waitForTimeout(500);

  const timeline = await page.evaluate(async () => {
    const logs = [];
    const log = (name) => logs.push({ name, t: performance.now() });
    log("start");
    const btn = document.querySelector("button.project-card");
    if (!btn) return { error: "project card not found" };
    btn.click();
    const start = performance.now();
    while (performance.now() - start < 60000) {
      if (
        performance
          .getEntriesByType("resource")
          .some((e) => e.name.includes("Spaceship")) &&
        !logs.find((x) => x.name === "video-resource")
      ) {
        log("video-resource");
      }
      if (
        location.pathname.startsWith("/projects/") &&
        !logs.find((x) => x.name === "navigated")
      ) {
        log("navigated");
      }
      const v = document.querySelector("video");
      if (
        v &&
        v.readyState >= 2 &&
        !logs.find((x) => x.name === "video-first-frame")
      ) {
        log("video-first-frame");
      }
      const visible = document.querySelector(".fixed.inset-0.-z-50 video");
      if (
        visible &&
        !visible.paused &&
        visible.currentTime > 0 &&
        !logs.find((x) => x.name === "visible-video-playing")
      ) {
        log("visible-video-playing");
      }
      if (
        logs.find((x) => x.name === "navigated") &&
        logs.find((x) => x.name === "visible-video-playing")
      ) {
        break;
      }
      await new Promise((r) => setTimeout(r, 16));
    }
    const base = logs[0]?.t ?? 0;
    const entry = performance
      .getEntriesByType("resource")
      .find((e) => e.name.includes("Spaceship"));
    return {
      timeline: logs.map((x) => ({
        event: x.name,
        msFromStart: Math.round(x.t - base),
      })),
      videoTransferBytes: entry?.transferSize ?? null,
      videoResourceDurationMs: entry ? Math.round(entry.duration) : null,
    };
  });

  return { label, ...timeline };
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
});
const page = await context.newPage();

const results = [];
results.push(await measureRun(page, "desktop-warm-localhost"));

await context.clearCookies();
await page.goto("about:blank");
results.push(await measureRun(page, "desktop-cold-ish-localhost"));

console.log(JSON.stringify({ baseUrl: BASE_URL, results }, null, 2));
await browser.close();

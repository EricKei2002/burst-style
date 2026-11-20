import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:5201";
const SHOTS = process.env.SHOTS || "/Users/erickei/burst-gallery-rebuild-shots";
const failures = [];
const notes = [];
const fail = (m) => { failures.push(m); console.error("FAIL:", m); };
const ok = (m) => { notes.push(m); console.log("OK:", m); };

async function shot(page, name) {
  const file = path.join(SHOTS, name);
  await mkdir(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, animations: "allow" });
  console.log("SHOT", name);
}

async function collectErrors(page) {
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push(String(err)));
  return errors;
}
const filterErrors = (errors) =>
  errors.filter((e) => !/github (repos|commits) request failed|Now API Error|Context Lost|No available adapters/i.test(e));

async function waitSection(page, id, timeout = 10000) {
  await page.waitForFunction((want) => document.documentElement.dataset.homeSection === want, id, { timeout });
}

const CONTRAST_FN = () => {
  const backdrops = { about: [235, 150, 60], projects: [200, 110, 210], contact: [120, 130, 240], home: [40, 40, 60], detail: [200, 110, 210] };
  const isDetail = location.pathname.startsWith("/projects/");
  const sec = isDetail ? "detail" : document.documentElement.dataset.homeSection || "home";
  const back = backdrops[sec] || [200, 160, 160];
  const cv = document.createElement("canvas"); cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  const parse = (s) => {
    if (!s || s === "transparent") return null;
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const fails = [], samples = [];
  const root = isDetail ? document.querySelector("main") || document.body : document.querySelector(`.home-panel[data-section="${sec}"]`) || document.body;
  const els = [...root.querySelectorAll("p,span,h1,h2,h3,h4,li,a,label,button,dt,dd,time,small")];
  for (const el of els) {
    if (!el.offsetParent && el.tagName !== "BODY") continue;
    const txt = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join("");
    if (!txt) continue;
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el); if (cs.visibility === "hidden" || +cs.opacity === 0) continue;
    const chain = []; let n = el; let hasImage = false;
    while (n && n !== document.documentElement) {
      const s = getComputedStyle(n); const c = parse(s.backgroundColor);
      if (c && c[3] > 0) chain.push(c);
      if (s.backgroundImage !== "none" && n !== document.body) hasImage = true;
      n = n.parentElement;
    }
    let bg = [...back];
    for (const c of chain.reverse()) bg = bg.map((v, i) => v * (1 - c[3]) + c[i] * c[3]);
    const fg = parse(cs.color); if (!fg) continue;
    const fgc = [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
    const cr = ratio(fgc, bg);
    const size = parseFloat(cs.fontSize); const bold = +cs.fontWeight >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    const row = { t: txt.slice(0, 48), cr: +cr.toFixed(2), need, size: +size.toFixed(1), fg: cs.color, bg: `rgb(${bg.map((v) => Math.round(v)).join(",")})` };
    if (samples.length < 6 && txt.length > 8) samples.push(row);
    if (cr < need && !hasImage) fails.push(row);
  }
  return { sec, checked: els.length, nFails: fails.length, fails: fails.slice(0, 15), samples };
};

async function measureFps(page, frames = 180) {
  return page.evaluate(async (n) => {
    const times = [];
    await new Promise((resolve) => {
      let last = performance.now(); let i = 0;
      const tick = (now) => { times.push(now - last); last = now; i += 1; if (i >= n) resolve(); else requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    const sorted = [...times].sort((a, b) => a - b);
    const mid = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const max = sorted[sorted.length - 1];
    const fps = (ms) => (ms > 0 ? 1000 / ms : 0);
    return { frames: times.length, medianMs: +mid.toFixed(2), p95Ms: +p95.toFixed(2), medianFps: +fps(mid).toFixed(1), p95Fps: +fps(p95).toFixed(1), minFps: +fps(max).toFixed(1) };
  }, frames);
}

async function warmup(page) {
  await page.waitForTimeout(300);
  await page.locator('nav[aria-label="Primary navigation"]').hover({ force: true }).catch(() => {});
  await page.waitForFunction(() => document.documentElement.dataset.shipPrep === "ready", null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function runViewport(browser, label, viewport, recordVideo) {
  const context = await browser.newContext({
    viewport,
    recordVideo: recordVideo ? { dir: path.join(SHOTS, "video", label), size: viewport } : undefined,
  });
  const page = await context.newPage();
  const errors = await collectErrors(page);
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await warmup(page);
  await shot(page, `${label}/01-home.png`);
  const skipVis = await page.locator("a.skip-to-work").isVisible();
  if (skipVis) ok(`${label}: skip visible`); else fail(`${label}: skip not visible`);

  // first-click-style already warmed; still check section ship timing
  const t0 = Date.now();
  await page.locator('nav[aria-label="Primary navigation"] a[href="#projects"]').first().click();
  await page.waitForTimeout(500);
  await shot(page, `${label}/02-enter-projects-0500ms.png`);
  await waitSection(page, "projects");
  const enterAt = Date.now() - t0;
  if (enterAt < 800) fail(`${label}: enter too fast ${enterAt}ms`); else ok(`${label}: entered projects in ${enterAt}ms`);
  await page.waitForTimeout(1800);
  await shot(page, `${label}/03-projects.png`);
  const hangar = await page.evaluate(() => {
    const bay = document.querySelector("[data-hangar-bay]");
    if (!bay) return { present: false };
    const r = bay.getBoundingClientRect();
    const stages = [...bay.querySelectorAll("[data-stage]")].map((el) => ({ id: el.getAttribute("data-stage"), text: el.textContent.trim() }));
    return { present: true, visible: r.width > 40 && r.height > 40 && r.top < innerHeight && r.bottom > 0, stages };
  });
  if (hangar.present && hangar.visible) ok(`${label}: hangar ${JSON.stringify(hangar.stages)}`);
  else fail(`${label}: hangar ${JSON.stringify(hangar)}`);
  await shot(page, `${label}/03-hangar-crop.png`);
  const fps = await measureFps(page);
  ok(`${label}: fps ${JSON.stringify(fps)}`);
  await writeFile(path.join(SHOTS, `${label}-fps.json`), JSON.stringify(fps, null, 2));

  // typographic index
  await page.locator("#projects-index").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await shot(page, `${label}/04-projects-index.png`);
  const idx = await page.evaluate(() => !!document.querySelector("#projects-index"));
  if (idx) ok(`${label}: projects-index present`); else fail(`${label}: no projects-index`);

  await page.locator('nav[aria-label="Primary navigation"] a[href="#about"]').first().click();
  await waitSection(page, "about");
  await page.waitForTimeout(1600);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(200);
  await shot(page, `${label}/05-about.png`);
  const aboutC = await page.evaluate(CONTRAST_FN);
  await writeFile(path.join(SHOTS, `${label}-contrast-about.json`), JSON.stringify(aboutC, null, 2));
  if (aboutC.nFails) fail(`${label} About contrast fails ${aboutC.nFails}: ${JSON.stringify(aboutC.fails.slice(0, 3))}`);
  else ok(`${label}: About contrast AA 0 fails, samples ${JSON.stringify(aboutC.samples.slice(0, 4))}`);

  await page.locator('nav[aria-label="Primary navigation"] a[href="#contact"]').first().click();
  await waitSection(page, "contact");
  await page.waitForTimeout(1600);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(200);
  await shot(page, `${label}/06-contact.png`);
  const contactC = await page.evaluate(CONTRAST_FN);
  await writeFile(path.join(SHOTS, `${label}-contrast-contact.json`), JSON.stringify(contactC, null, 2));
  if (contactC.nFails) fail(`${label} Contact contrast fails ${contactC.nFails}`);
  else ok(`${label}: Contact contrast AA 0 fails`);

  const unexpected = filterErrors(errors);
  if (unexpected.length) fail(`${label} errors: ${unexpected.join("; ")}`);
  else ok(`${label}: no unexpected console errors`);
  await context.close();
}

async function runReducedAnd404AndNoJS(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(400);
  const t0 = Date.now();
  await page.keyboard.press("2");
  await waitSection(page, "projects", 5000);
  const at = Date.now() - t0;
  await shot(page, "reduced-motion/01-projects.png");
  if (at > 800) fail(`reduced-motion too slow ${at}ms`); else ok(`reduced-motion switch in ${at}ms`);
  await ctx.close();

  const c404 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p404 = await c404.newPage();
  const res = await p404.goto(BASE + "/this-page-does-not-exist", { waitUntil: "domcontentloaded", timeout: 30000 });
  await shot(p404, "404/not-found.png");
  if (res?.status() === 404) ok("404 status=404"); else fail(`404 status=${res?.status()}`);
  await c404.close();

  const nojs = await browser.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
  const pn = await nojs.newPage();
  await pn.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await shot(pn, "no-js/home.png");
  const hasText = await pn.locator("text=Eric Kei").count();
  const hasSkip = await pn.locator("a.skip-to-work").count();
  if (hasText && hasSkip) ok("no-JS: Eric Kei + skip present"); else fail(`no-JS text=${hasText} skip=${hasSkip}`);
  await nojs.close();
}

const browser = await chromium.launch({ headless: false, args: ["--use-gl=angle", "--use-angle=metal"] });
try {
  await runViewport(browser, "pc", { width: 1280, height: 800 }, true);
  await runViewport(browser, "mobile", { width: 390, height: 844 }, true);
  await runReducedAnd404AndNoJS(browser);
} catch (err) {
  fail(String(err && err.stack ? err.stack : err));
} finally {
  await browser.close();
}
await writeFile(path.join(SHOTS, "verify.json"), JSON.stringify({ failures, notes }, null, 2));
if (failures.length) { console.error(`\nCAPTURE FAILED (${failures.length})`); process.exit(1); }
console.log("\nCAPTURE PASSED");
process.exit(0);

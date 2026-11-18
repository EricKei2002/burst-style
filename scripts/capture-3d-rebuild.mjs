import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:5197";
const SHOTS = process.env.SHOTS || "/Users/erickei/burst-3d-rebuild-shots";
const failures = [];
const notes = [];

function fail(msg) {
  failures.push(msg);
  console.error("FAIL:", msg);
}
function ok(msg) {
  notes.push(msg);
  console.log("OK:", msg);
}

async function shotLive(page, name) {
  const file = path.join(SHOTS, name);
  await mkdir(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, animations: "allow" });
  console.log("SHOT", name);
}

async function collectErrors(page) {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  return errors;
}

function filterErrors(errors) {
  return errors.filter(
    (e) =>
      !/github repos request failed/i.test(e) &&
      !/github commits request failed/i.test(e) &&
      !/Context Lost/i.test(e) &&
      !/No available adapters/i.test(e) &&
      !/Now API Error/i.test(e),
  );
}

async function sectionId(page) {
  return page.evaluate(
    () => document.documentElement.dataset.homeSection || "",
  );
}

async function waitSection(page, id, timeout = 8000) {
  await page.waitForFunction(
    (want) => document.documentElement.dataset.homeSection === want,
    id,
    { timeout },
  );
}

async function transState(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const host = document.querySelector('[class*="z-[101]"], .pointer-events-none.fixed.inset-0.z-\\[101\\]');
    // Fallback: the ship host is the fixed overlay at z 101
    const hosts = [...document.querySelectorAll("body > div, body div.fixed")];
    let shipHost = null;
    for (const el of hosts) {
      const z = getComputedStyle(el).zIndex;
      if (z === "101") {
        shipHost = el;
        break;
      }
    }
    const canvas = shipHost?.querySelector("canvas");
    const doors = [...document.querySelectorAll(".bg-zinc-900.border-r-4, .bg-zinc-900.border-l-4")];
    const doorMoved = doors.some((d) => {
      const t = getComputedStyle(d).transform;
      return t && t !== "none" && t !== "matrix(1, 0, 0, 1, 0, 0)";
    });
    return {
      section: root.dataset.homeSection || "",
      shipPrep: root.dataset.shipPrep || "",
      planetLoop: root.dataset.planetLoop || "",
      hasShipCanvas: Boolean(canvas),
      canvasW: canvas ? canvas.width : 0,
      canvasH: canvas ? canvas.height : 0,
      doorMoved,
    };
  });
}

async function midClose(page, prefix, delays) {
  let elapsed = 0;
  const states = [];
  for (const t of delays) {
    const gap = t - elapsed;
    if (gap > 0) await page.waitForTimeout(gap);
    elapsed = t;
    await shotLive(page, `${prefix}-${String(t).padStart(4, "0")}ms.png`);
    states.push({ t, ...(await transState(page)) });
  }
  return states;
}

async function warmup(page) {
  await page.waitForTimeout(300);
  await page
    .locator('nav[aria-label="Primary navigation"]')
    .hover({ force: true })
    .catch(() => {});
  await page.mouse.move(200, 200);
  // wait until ship is ready, up to 8s (after intent it should be urgent)
  try {
    await page.waitForFunction(
      () => document.documentElement.dataset.shipPrep === "ready",
      null,
      { timeout: 8000 },
    );
    ok("warmup: shipPrep=ready");
  } catch {
    const s = await transState(page);
    fail(`warmup: ship not ready (${JSON.stringify(s)})`);
  }
  await page.waitForTimeout(400);
}

async function clickHeader(page, href) {
  const sel =
    href === "/"
      ? 'nav[aria-label="Primary navigation"] a[href="/"]'
      : `nav[aria-label="Primary navigation"] a[href="${href}"]`;
  await page.locator(sel).first().click();
}

const CONTRAST_FN = () => {
  const backdrops = {
    about: [235, 150, 60],
    projects: [200, 110, 210],
    contact: [120, 130, 240],
    home: [40, 40, 60],
    detail: [200, 110, 210],
  };
  const isDetail = location.pathname.startsWith("/projects/");
  const sec = isDetail
    ? "detail"
    : document.documentElement.dataset.homeSection || "home";
  const back = backdrops[sec] || [200, 160, 160];
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  const parse = (s) => {
    if (!s || s === "transparent") return null;
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = "#000";
    cx.fillStyle = s;
    cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const lum = ([r, g, b]) => {
    const f = (c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const l1 = lum(a),
      l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const fails = [];
  const samples = [];
  const root = isDetail
    ? document.querySelector("main") || document.body
    : document.querySelector(`.home-panel[data-section="${sec}"]`) ||
      document.body;
  const els = [
    ...root.querySelectorAll(
      "p,span,h1,h2,h3,h4,li,a,label,button,dt,dd,time,small,code,blockquote",
    ),
  ];
  for (const el of els) {
    if (!el.offsetParent && el.tagName !== "BODY") continue;
    const txt = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join("");
    if (!txt) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || +cs.opacity === 0) continue;
    const chain = [];
    let n = el;
    let hasImage = false;
    while (n && n !== document.documentElement) {
      const s = getComputedStyle(n);
      const c = parse(s.backgroundColor);
      if (c && c[3] > 0) chain.push(c);
      if (s.backgroundImage !== "none" && n !== document.body) hasImage = true;
      n = n.parentElement;
    }
    let bg = [...back];
    for (const c of chain.reverse())
      bg = bg.map((v, i) => v * (1 - c[3]) + c[i] * c[3]);
    const fg = parse(cs.color);
    if (!fg) continue;
    const fgc = [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
    const cr = ratio(fgc, bg);
    const size = parseFloat(cs.fontSize);
    const bold = +cs.fontWeight >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    const row = {
      t: txt.slice(0, 48),
      cr: +cr.toFixed(2),
      need,
      size: +size.toFixed(1),
      fg: cs.color,
      bg: `rgb(${bg.map((v) => Math.round(v)).join(",")})`,
      cls: (el.className?.baseVal ?? el.className).toString().slice(0, 80),
    };
    if (samples.length < 8 && (txt.length > 20 || /instrument|about|zinc/.test(row.cls)))
      samples.push(row);
    if (cr < need && !hasImage) fails.push(row);
  }
  const nums = samples.map((s) => s.cr);
  return {
    sec,
    checked: els.length,
    nFails: fails.length,
    fails: fails.slice(0, 20),
    samples,
    minSample: nums.length ? Math.min(...nums) : null,
  };
};

async function measureFps(page, frames = 180) {
  return page.evaluate(async (n) => {
    const times = [];
    await new Promise((resolve) => {
      let last = performance.now();
      let i = 0;
      const tick = (now) => {
        times.push(now - last);
        last = now;
        i += 1;
        if (i >= n) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const sorted = [...times].sort((a, b) => a - b);
    const mid = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const max = sorted[sorted.length - 1];
    const fps = (ms) => (ms > 0 ? 1000 / ms : 0);
    return {
      frames: times.length,
      medianMs: +mid.toFixed(2),
      p95Ms: +p95.toFixed(2),
      maxMs: +max.toFixed(2),
      medianFps: +fps(mid).toFixed(1),
      p95Fps: +fps(p95).toFixed(1),
      minFps: +fps(max).toFixed(1),
    };
  }, frames);
}

async function runFirstClick(browser, label, viewport, how) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = await collectErrors(page);
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  // Strict cold: do not hover the nav. Keyboard avoids pointerenter preload.
  const before = await transState(page);
  const t0 = Date.now();
  if (how === "key") {
    await page.keyboard.press("2");
  } else if (how === "header") {
    // click without an earlier hover warmup; Playwright will hover as part of click
    await clickHeader(page, "#projects");
  }
  const mid = await midClose(page, `${label}/first-click-${how}`, [200, 500, 900, 1300]);
  await waitSection(page, "projects", 12000);
  const at = Date.now() - t0;
  const after = await transState(page);
  const usedShip = mid.some((s) => s.hasShipCanvas && s.canvasW > 0) && at >= 900;
  const usedDoor = mid.some((s) => s.doorMoved);
  const msg = `${label} first-click ${how}: ${at}ms prepBefore=${before.shipPrep || "(none)"} prepDuring=${mid.map((s) => s.shipPrep || "-").join(",")} usedShip=${usedShip} usedDoor=${usedDoor}`;
  if (usedShip) ok(msg);
  else fail(msg + " (ship did not clearly play)");
  await page.waitForTimeout(800);
  await shotLive(page, `${label}/first-click-${how}-settled.png`);
  const unexpected = filterErrors(errors);
  if (unexpected.length) fail(`${label} first-click ${how} errors: ${unexpected.join("; ")}`);
  await context.close();
  return { label, how, at, before, mid, after, usedShip, usedDoor };
}

async function runHeaderTour(browser, label, viewport) {
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: path.join(SHOTS, "video", `${label}-header`), size: viewport },
  });
  const page = await context.newPage();
  const errors = await collectErrors(page);
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await warmup(page);
  await shotLive(page, `${label}/header-00-home.png`);

  const clicks = [
    ["#projects", "projects", "header-01-projects"],
    ["#about", "about", "header-02-about"],
    ["#contact", "contact", "header-03-contact"],
    ["/", "home", "header-04-home"],
  ];
  const timings = [];
  for (const [href, id, prefix] of clicks) {
    const t0 = Date.now();
    await clickHeader(page, href);
    const mid = await midClose(page, `${label}/${prefix}`, [400, 900, 1300]);
    await waitSection(page, id, 12000);
    const at = Date.now() - t0;
    const usedShip = mid.some((s) => s.hasShipCanvas && s.canvasW > 0) && at >= 800;
    timings.push({ href, id, at, usedShip, mid });
    if (usedShip) ok(`${label} header ${href} -> ${id} in ${at}ms (ship)`);
    else fail(`${label} header ${href} -> ${id} in ${at}ms ship=${usedShip}`);
    await page.waitForTimeout(1200);
    await shotLive(page, `${label}/${prefix}-settled.png`);
  }

  // Skip link
  const skip = page.locator("a.skip-to-work");
  if (await skip.isVisible()) ok(`${label}: skip-to-work visible`);
  else fail(`${label}: skip-to-work not visible`);
  await skip.click();
  await waitSection(page, "projects", 12000);
  await page.waitForTimeout(800);
  const focused = await page.evaluate(() => {
    const el = document.activeElement;
    return {
      id: el?.id || "",
      text: (el?.textContent || "").slice(0, 40),
      hash: location.hash,
    };
  });
  ok(`${label}: skip landed hash=${focused.hash} focus=${focused.id || focused.text}`);
  await shotLive(page, `${label}/skip-projects-index.png`);

  // Hangar visibility
  const hangar = await page.evaluate(() => {
    const bay = document.querySelector("[data-hangar-bay]");
    if (!bay) return { present: false };
    const r = bay.getBoundingClientRect();
    const cards = [...document.querySelectorAll("a.project-card")].map((c) => {
      const cr = c.getBoundingClientRect();
      const overlap =
        Math.max(0, Math.min(r.right, cr.right) - Math.max(r.left, cr.left)) *
        Math.max(0, Math.min(r.bottom, cr.bottom) - Math.max(r.top, cr.top));
      return { overlap, card: cr };
    });
    const maxOverlap = cards.reduce((a, c) => a + c.overlap, 0);
    return {
      present: true,
      visible: r.width > 40 && r.height > 40 && r.bottom > 0 && r.top < innerHeight,
      x: +r.x.toFixed(1),
      y: +r.y.toFixed(1),
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      overlapPx: Math.round(maxOverlap),
    };
  });
  await shotLive(page, `${label}/hangar-bay.png`);
  if (hangar.present && hangar.visible && hangar.overlapPx < hangar.w * hangar.h * 0.5)
    ok(`${label}: hangar bay visible ${JSON.stringify(hangar)}`);
  else fail(`${label}: hangar bay issue ${JSON.stringify(hangar)}`);

  const unexpected = filterErrors(errors);
  if (unexpected.length) fail(`${label} header tour errors: ${unexpected.join("; ")}`);
  await context.close();
  return timings;
}

async function runViewport(browser, label, viewport, recordVideo) {
  const context = await browser.newContext({
    viewport,
    recordVideo: recordVideo
      ? { dir: path.join(SHOTS, "video", label), size: viewport }
      : undefined,
  });
  const page = await context.newPage();
  const errors = await collectErrors(page);

  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await warmup(page);
  await shotLive(page, `${label}/01-home-space.png`);
  if ((await sectionId(page)) !== "home") fail(`${label}: expected home`);
  else ok(`${label}: home is space`);

  const t0 = Date.now();
  await page.keyboard.press("2");
  await midClose(page, `${label}/02-enter-projects`, [200, 500, 900, 1300]);
  await waitSection(page, "projects", 10000);
  const enterAt = Date.now() - t0;
  if (enterAt < 900) fail(`${label}: enter too fast (${enterAt}ms)`);
  else ok(`${label}: entered projects in ${enterAt}ms`);
  await page.waitForTimeout(2000);
  await shotLive(page, `${label}/03-projects-planet.png`);

  // FPS on Projects (and 4x if possible via CDP)
  const fpsNormal = await measureFps(page);
  ok(`${label}: fps ${JSON.stringify(fpsNormal)}`);
  let fps4x = null;
  try {
    const client = await context.newCDPSession(page);
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    fps4x = await measureFps(page);
    await client.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    ok(`${label}: fps 4x ${JSON.stringify(fps4x)}`);
  } catch (e) {
    notes.push(`${label}: fps 4x skipped (${e})`);
  }

  const t1 = Date.now();
  await page.keyboard.press("3");
  await midClose(page, `${label}/04-fly-about`, [200, 500, 900]);
  await waitSection(page, "about", 10000);
  ok(`${label}: flew to about in ${Date.now() - t1}ms`);
  await page.waitForTimeout(1800);
  await shotLive(page, `${label}/05-about-planet.png`);

  // Contrast on About
  const aboutContrast = await page.evaluate(CONTRAST_FN);
  await writeFile(
    path.join(SHOTS, `${label}-contrast-about.json`),
    JSON.stringify(aboutContrast, null, 2),
  );
  if (aboutContrast.nFails)
    fail(`${label} About contrast AA fails ${aboutContrast.nFails}: ${JSON.stringify(aboutContrast.fails.slice(0, 5))}`);
  else ok(`${label}: About contrast AA fails=0 checked=${aboutContrast.checked}`);

  await page.keyboard.press("4");
  await midClose(page, `${label}/06-fly-contact`, [500]);
  await waitSection(page, "contact", 10000);
  await page.waitForTimeout(1800);
  await shotLive(page, `${label}/07-contact-planet.png`);
  const contactContrast = await page.evaluate(CONTRAST_FN);
  await writeFile(
    path.join(SHOTS, `${label}-contrast-contact.json`),
    JSON.stringify(contactContrast, null, 2),
  );
  if (contactContrast.nFails)
    fail(`${label} Contact contrast AA fails ${contactContrast.nFails}`);
  else ok(`${label}: Contact contrast AA fails=0`);

  const t2 = Date.now();
  await page.keyboard.press("1");
  await midClose(page, `${label}/08-leave-home`, [200, 500, 900, 1300]);
  await waitSection(page, "home", 10000);
  const leaveAt = Date.now() - t2;
  if (leaveAt < 900) fail(`${label}: leave too fast (${leaveAt}ms)`);
  else ok(`${label}: left to space in ${leaveAt}ms`);
  await page.waitForTimeout(2000);
  await shotLive(page, `${label}/09-home-space-again.png`);

  await page.keyboard.press("2");
  await waitSection(page, "projects", 10000);
  await page.waitForTimeout(2000);
  const projectsContrast = await page.evaluate(CONTRAST_FN);
  await writeFile(
    path.join(SHOTS, `${label}-contrast-projects.json`),
    JSON.stringify(projectsContrast, null, 2),
  );

  await page.locator("a.project-card").first().waitFor({ state: "visible" });
  const click = page.locator("a.project-card").first().click();
  await midClose(page, `${label}/10-detail-fly`, [200, 500, 900]);
  await click.catch(() => {});
  await page.waitForURL(/\/projects\//, { timeout: 10000 });
  await page.waitForTimeout(1800);
  await shotLive(page, `${label}/11-project-detail.png`);
  const loop = await page.evaluate(() => document.documentElement.dataset.planetLoop || "");
  if (loop === "paused") ok(`${label}: detail planet-loop=paused`);
  else fail(`${label}: detail planet-loop=${loop} (expected paused)`);
  const detailContrast = await page.evaluate(CONTRAST_FN);
  await writeFile(
    path.join(SHOTS, `${label}-contrast-detail.json`),
    JSON.stringify(detailContrast, null, 2),
  );
  if (detailContrast.nFails)
    fail(`${label} detail contrast AA fails ${detailContrast.nFails}`);
  else ok(`${label}: detail contrast AA fails=0`);
  ok(`${label}: project detail ${page.url()}`);

  await page.locator("a[href='/#projects']").click();
  await midClose(page, `${label}/12-back-to-projects`, [200, 500, 900]);
  await page.waitForURL((url) => url.pathname === "/", { timeout: 10000 });
  await page.waitForTimeout(1800);
  await shotLive(page, `${label}/13-back-projects-planet.png`);
  const loopBack = await page.evaluate(() => document.documentElement.dataset.planetLoop || "");
  ok(`${label}: back to ${page.url()} section=${await sectionId(page)} loop=${loopBack}`);

  const unexpected = filterErrors(errors);
  if (unexpected.length) fail(`${label} console errors:\n  - ${unexpected.join("\n  - ")}`);
  else ok(`${label}: no unexpected console errors`);

  await writeFile(
    path.join(SHOTS, `${label}-fps.json`),
    JSON.stringify({ normal: fpsNormal, cpu4x: fps4x }, null, 2),
  );
  await context.close();
}

async function runReducedMotion(browser) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = await collectErrors(page);
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(400);
  const t0 = Date.now();
  await page.keyboard.press("2");
  await waitSection(page, "projects", 5000);
  const at = Date.now() - t0;
  await shotLive(page, "reduced-motion/01-projects.png");
  ok(`reduced-motion section switch in ${at}ms`);
  if (at > 800) fail(`reduced-motion section switch too slow (${at}ms)`);
  const midState = await transState(page);
  if (midState.shipPrep === "ready")
    fail(`reduced-motion should not init ship, shipPrep=${midState.shipPrep}`);
  else ok(`reduced-motion shipPrep=${midState.shipPrep || "(none)"}`);
  await page.keyboard.press("1");
  await waitSection(page, "home", 5000);
  await shotLive(page, "reduced-motion/02-home.png");
  const unexpected = filterErrors(errors);
  if (unexpected.length) fail(`reduced-motion errors: ${unexpected.join("; ")}`);
  else ok("reduced-motion: no unexpected console errors");
  await context.close();
}

async function run404(browser) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  const res = await page.goto(BASE + "/this-page-does-not-exist", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  const status = res?.status() ?? 0;
  await page.waitForTimeout(400);
  await shotLive(page, "404/not-found.png");
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const mpage = await mobile.newPage();
  await mpage.goto(BASE + "/this-page-does-not-exist", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await mpage.waitForTimeout(300);
  await shotLive(mpage, "404/not-found-mobile.png");
  if (status === 404) ok(`404 status=404`);
  else fail(`404 status=${status}`);
  await context.close();
  await mobile.close();
}

const results = { firstClick: [], header: {}, failures: [], notes: [] };

const browser = await chromium.launch({
  headless: false,
  args: ["--use-gl=angle", "--use-angle=metal"],
});
try {
  results.firstClick.push(
    await runFirstClick(browser, "pc", { width: 1280, height: 800 }, "key"),
  );
  results.firstClick.push(
    await runFirstClick(browser, "pc", { width: 1280, height: 800 }, "header"),
  );
  results.firstClick.push(
    await runFirstClick(browser, "mobile", { width: 390, height: 844 }, "key"),
  );
  results.header.pc = await runHeaderTour(browser, "pc", {
    width: 1280,
    height: 800,
  });
  results.header.mobile = await runHeaderTour(browser, "mobile", {
    width: 390,
    height: 844,
  });
  await runViewport(browser, "pc", { width: 1280, height: 800 }, true);
  await runViewport(browser, "mobile", { width: 390, height: 844 }, true);
  await runReducedMotion(browser);
  await run404(browser);
} catch (err) {
  fail(String(err && err.stack ? err.stack : err));
} finally {
  await browser.close();
}

results.failures = failures;
results.notes = notes;
await mkdir(SHOTS, { recursive: true });
await writeFile(path.join(SHOTS, "verify.json"), JSON.stringify(results, null, 2));

if (failures.length) {
  console.error(`\nCAPTURE/SMOKE FAILED (${failures.length})`);
  process.exit(1);
}
console.log("\nCAPTURE/SMOKE PASSED");
process.exit(0);

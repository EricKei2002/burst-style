// 最初の画面の概要がすぐ読めること（自動表示・スキップ・演出を省く条件）を確かめる。
// 先に `npm run build && npm start` でサーバーを立ててから `npm run test:hero-intro`。
import assert from "node:assert/strict";
import { chromium } from "playwright";

// cspell:ignore networkidle
const BASE = process.env.BASE_URL || "http://localhost:3000";
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

// 3D は対象外。ヘッドレスで重くならないように切る
const browser = await chromium.launch({ args: ["--disable-3d-apis"] });

const opacities = (page) =>
  page.$$eval("#top dd:last-of-type > span", (spans) =>
    spans.map((span) => Number(getComputedStyle(span).opacity)),
  );

async function open(options) {
  const page = await browser.newPage({ viewport: DESKTOP, ...options });
  await page.goto(BASE + "/", { waitUntil: "load" });
  return page;
}

/** 演出を途中で止め、飛ばす操作の結果だけを見られるようにする */
async function openFrozen() {
  const page = await browser.newPage({ viewport: DESKTOP });
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent =
        ".hero-brief { animation-play-state: paused !important }";
      document.head.append(style);
    });
  });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  assert.deepEqual(await opacities(page), [0, 0], "intro starts hidden");
  return page;
}

async function waitShown(page, label) {
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("#top dd:last-of-type > span")].every(
        (span) => getComputedStyle(span).opacity === "1",
      ),
    undefined,
    { timeout: 3000 },
  );
  console.log(`ok ${label}`);
}

try {
  const auto = await open();
  await waitShown(auto, "shown without any input");
  const ms = await auto.evaluate(() => performance.now());
  console.log(`   (${Math.round(ms)}ms after navigation)`);
  await auto.close();

  const skips = {
    click: (page) => page.mouse.click(5, 400),
    key: (page) => page.keyboard.press("Shift"),
    scroll: (page) => page.mouse.wheel(0, 200),
  };
  for (const [name, skip] of Object.entries(skips)) {
    const page = await openFrozen();
    await skip(page);
    await waitShown(page, `skipped by ${name}`);
    await page.close();
  }

  for (const [label, options] of [
    ["reduced motion", { reducedMotion: "reduce" }],
    ["mobile width", { viewport: MOBILE }],
  ]) {
    const page = await open(options);
    assert.deepEqual(await opacities(page), [1, 1], `${label}: no intro`);
    console.log(`ok no intro: ${label}`);
    await page.close();
  }

  // 区画を切り替えて戻っても演出を繰り返さない
  const page = await open();
  await waitShown(page, "before switching sections");
  await page.locator('a[href$="#about"]:visible').first().click();
  await page.waitForFunction(
    () => document.documentElement.dataset.homeSection === "about",
  );
  await page.goBack();
  await page.waitForFunction(
    () => document.documentElement.dataset.homeSection === "home",
  );
  assert.equal(await page.locator("#top .hero-brief").count(), 0);
  console.log("ok no replay after switching sections");
  await page.close();
} finally {
  await browser.close();
}

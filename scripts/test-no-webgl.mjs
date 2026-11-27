// WebGL が無効なブラウザで、内容が読めてページ移動できることを確かめる。
// 先に `npm run build && npm start` でサーバーを立ててから `npm run test:no-webgl`。
import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const PATHS = [
  "/",
  "/#about",
  "/#projects",
  "/#contact",
  "/projects/burst-style",
  "/projects/sonta-kun",
  "/no-such-page",
];
const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
];

const browser = await chromium.launch({ args: ["--disable-3d-apis"] });

async function openPage(viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    // 低スペック扱いだと星空の Canvas 自体が出ず、テストが素通りするため固定する
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (type.startsWith("webgl") && this.closest(".star-bg")) {
        window.__starCanvasTried = true;
      }
      return original.call(this, type, ...rest);
    };
  });
  return { page, errors };
}

async function assertAlive(page, errors, label) {
  assert.deepEqual(errors, [], `${label}: uncaught errors`);
  assert.ok(
    await page.locator("main h1:visible, main h2:visible").count(),
    `${label}: no visible heading`,
  );
}

try {
  for (const viewport of VIEWPORTS) {
    for (const path of PATHS) {
      const label = `${viewport.width}px ${path}`;
      const { page, errors } = await openPage(viewport);
      await page.goto(BASE + path, { waitUntil: "load" });
      assert.equal(
        await page.evaluate(() =>
          Boolean(document.createElement("canvas").getContext("webgl2")),
        ),
        false,
        "WebGL must be disabled for this test",
      );
      // 星空は最初の操作のあとに読み込まれる
      await page.mouse.move(100, 100);
      await page.mouse.move(200, 200);
      await page.keyboard.press("Shift");
      if (path === "/") {
        // 星空の Canvas が実際に WebGL を要求したことを確かめる
        await page.waitForFunction(() => window.__starCanvasTried);
      }
      await page.waitForTimeout(2000);
      await assertAlive(page, errors, label);
      await page.close();
      console.log(`ok ${label}`);
    }

    // ホーム → Projects → 作品ページ → 戻る
    const label = `${viewport.width}px navigation`;
    const { page, errors } = await openPage(viewport);
    await page.goto(BASE + "/", { waitUntil: "load" });
    await page.mouse.move(100, 100);
    await page.waitForFunction(() => window.__starCanvasTried);
    await page.locator('a[href$="#projects"]:visible').first().click();
    await page.waitForFunction(
      () => document.documentElement.dataset.homeSection === "projects",
    );
    await page
      .locator("#projects")
      .getByRole("button", { name: /Burst Style/ })
      .or(page.locator("#projects").getByRole("link", { name: /Burst Style/ }))
      .first()
      .click();
    await page.waitForURL("**/projects/burst-style");
    await page.locator("main h1").first().waitFor();
    await assertAlive(page, errors, label);
    await page.goBack();
    await page.waitForURL((url) => url.pathname === "/");
    await page.waitForTimeout(1000);
    await assertAlive(page, errors, `${label} (back)`);
    await page.close();
    console.log(`ok ${label}`);
  }
} finally {
  await browser.close();
}

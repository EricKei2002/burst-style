import { existsSync, statSync } from "node:fs";
import {
  backdropForView,
  isHomePath,
  planetForHomeSection,
  planetForView,
  SECTION_PLANETS,
} from "./planets";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(isHomePath("/"), "home /");
assert(!isHomePath("/projects/drill"), "project is not home");

// Vercel の ISR 再生成では、サーバー側の usePathname() がトップを "/index" と返す。
// ブラウザ側の "/" と判定が分かれると水和エラー（React #418）になる
assert(isHomePath("/index"), "home /index (Vercel ISR)");
for (const section of ["home", "projects", "about", "contact"] as const) {
  assert(
    planetForView("/index", section) === planetForView("/", section),
    `/index and / show the same view: ${section}`,
  );
}

assert(planetForHomeSection("home") === null, "home section is space");
assert(planetForHomeSection("projects")?.id === "projects", "projects planet");
assert(planetForHomeSection("about")?.id === "about", "about planet");
assert(planetForHomeSection("contact")?.id === "contact", "contact planet");

assert(planetForView("/", "home") === null, "home view is space");
assert(planetForView("/", "projects")?.id === "projects", "projects section");
assert(
  planetForView("/projects/drill", "home")?.id === "projects",
  "project detail stays on Projects planet",
);
assert(
  planetForView("/projects/sonta-kun")?.id === "projects",
  "any slug uses Projects planet",
);
assert(planetForView("/missing")?.id === "uncharted", "404 is uncharted");

// 面ごとの背景画像が public/backgrounds/ にそろっている
const views = [
  ["/", "projects", "projects"],
  ["/", "about", "about"],
  ["/", "contact", "contact"],
  ["/projects/drill", null, "detail"],
  ["/missing", null, "404"],
] as const;
for (const [pathname, section, expected] of views) {
  const theme = planetForView(pathname, section);
  assert(theme, `${pathname} has a planet`);
  const backdrop = backdropForView(pathname, theme!);
  assert(backdrop === expected, `${pathname} ${section}: ${backdrop}`);
  for (const variant of ["wide", "tall"]) {
    for (const format of ["avif", "webp"]) {
      const file = `public/backgrounds/${backdrop}-${variant}.${format}`;
      assert(existsSync(file), `${file} exists`);
      assert(statSync(file).size <= 200 * 1024, `${file} is 200KB or less`);
    }
  }
}

const ids = Object.keys(SECTION_PLANETS);
assert(ids.length === 3, "three section planets");
for (const id of ids) {
  const p = SECTION_PLANETS[id as keyof typeof SECTION_PLANETS];
  const [r, g, b] = p.skyTop;
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  assert(luma < 0.12, `${p.id} skyTop too bright (${luma})`);
}

console.log("planets.test.ts: ok");

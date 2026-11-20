import {
  isHomePath,
  planetById,
  planetForView,
  SECTION_PLANETS,
  rgbVec,
} from "./planets";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(isHomePath("/"), "home /");
assert(!isHomePath("/projects/drill"), "project is not home");

assert(planetForView("/") === null, "home is space");
assert(planetForView("") === null, "empty path is home space");
assert(planetForView("/missing") === null, "404 is space");
assert(
  planetForView("/projects/drill")?.id === "projects",
  "project detail stays on Projects planet",
);
assert(
  planetForView("/projects/sonta-kun")?.id === "projects",
  "any slug uses Projects planet",
);

assert(planetById("about").nameJa === "琥珀の居住地", "ja name");

const ids = Object.keys(SECTION_PLANETS);
assert(ids.length === 3, "three section planets");
for (const id of ids) {
  const p = SECTION_PLANETS[id as keyof typeof SECTION_PLANETS];
  const [r, g, b] = p.skyTop;
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  assert(luma < 0.12, `${p.id} skyTop too bright (${luma})`);
}

const v = rgbVec([255, 0, 128]);
assert(v[0] === 1 && v[2] === 128 / 255, "rgbVec");

console.log("planets.test.ts: ok");

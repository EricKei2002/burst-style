import {
  isHomePath,
  planetById,
  planetForHomeSection,
  planetForView,
  SECTION_PLANETS,
  rgbVec,
  warpJourneyForSections,
} from "./planets";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(isHomePath("/"), "home /");
assert(!isHomePath("/projects/drill"), "project is not home");

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

assert(planetById("about").nameJa === "琥珀の居住地", "ja name");

assert(warpJourneyForSections("home", "projects") === "enter-planet", "enter");
assert(warpJourneyForSections("about", "home") === "leave-space", "leave");
assert(
  warpJourneyForSections("projects", "contact") === "fly-between",
  "section to section",
);
assert(warpJourneyForSections("projects", "projects") === "neutral", "same");

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

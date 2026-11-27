import { isHomeSection, type HomeSection } from "./homeSections";

export type Rgb = readonly [number, number, number];

export type PlanetTerrain =
  "dunes" | "fog-flats" | "facets" | "canyons" | "hangar" | "crater";

export type PlanetParticles =
  "embers" | "mist" | "shards" | "aurora" | "sparks" | "ash";

export type WarpJourney =
  "enter-planet" | "leave-space" | "fly-between" | "neutral";

export type PlanetTheme = {
  id: string;
  section: HomeSection | null;
  name: string;
  nameJa: string;
  terrain: PlanetTerrain;
  particles: PlanetParticles;
  /** 空の上部。本文コントラストのため暗く保つ */
  skyTop: Rgb;
  skyHorizon: Rgb;
  ground: Rgb;
  groundHi: Rgb;
  accent: Rgb;
  accent2: Rgb;
  haze: Rgb;
};

/** Projects セクション：航路の工房（サイトのフクシア／シアン） */
const PROJECTS: PlanetTheme = {
  id: "projects",
  section: "projects",
  name: "Hangar Dawn",
  nameJa: "航路の工房",
  terrain: "hangar",
  particles: "sparks",
  skyTop: [8, 4, 12],
  skyHorizon: [64, 20, 72],
  ground: [10, 6, 14],
  groundHi: [40, 16, 48],
  accent: [232, 121, 249],
  accent2: [34, 211, 238],
  haze: [120, 40, 140],
};

/** About セクション：琥珀の居住地（人となり・経歴） */
const ABOUT: PlanetTheme = {
  id: "about",
  section: "about",
  name: "Hearth Dunes",
  nameJa: "琥珀の居住地",
  terrain: "dunes",
  particles: "embers",
  skyTop: [12, 6, 4],
  skyHorizon: [72, 32, 10],
  ground: [18, 9, 5],
  groundHi: [58, 28, 10],
  accent: [245, 158, 11],
  accent2: [251, 146, 60],
  haze: [140, 60, 18],
};

/** Contact セクション：交信の谷 */
const CONTACT: PlanetTheme = {
  id: "contact",
  section: "contact",
  name: "Signal Canyon",
  nameJa: "交信の谷",
  terrain: "canyons",
  particles: "aurora",
  skyTop: [6, 7, 18],
  skyHorizon: [40, 46, 120],
  ground: [8, 9, 22],
  groundHi: [28, 34, 90],
  accent: [88, 101, 242],
  accent2: [129, 140, 248],
  haze: [60, 70, 180],
};

const UNCHARTED: PlanetTheme = {
  id: "uncharted",
  section: null,
  name: "Uncharted Ash",
  nameJa: "未踏の灰月",
  terrain: "crater",
  particles: "ash",
  skyTop: [8, 8, 9],
  skyHorizon: [32, 28, 26],
  ground: [10, 10, 11],
  groundHi: [36, 32, 30],
  accent: [168, 162, 158],
  accent2: [113, 113, 122],
  haze: [60, 56, 52],
};

export const SECTION_PLANETS: Record<
  Exclude<HomeSection, "home">,
  PlanetTheme
> = {
  projects: PROJECTS,
  about: ABOUT,
  contact: CONTACT,
};

export function isHomePath(pathname: string): boolean {
  return pathname === "/" || pathname === "";
}

/** Home セクションは宇宙。Projects / About / Contact はそれぞれの惑星。 */
export function planetForHomeSection(
  section: HomeSection | string | null,
): PlanetTheme | null {
  if (!section || section === "home") return null;
  if (section === "projects" || section === "about" || section === "contact") {
    return SECTION_PLANETS[section];
  }
  return null;
}

/**
 * 今見えている面の惑星。
 * /projects/* の詳細は Projects と同じ惑星（セクションが惑星、詳細はその中）。
 */
export function planetForView(
  pathname: string,
  homeSection: HomeSection | string | null = null,
): PlanetTheme | null {
  if (pathname.startsWith("/projects/")) {
    return SECTION_PLANETS.projects;
  }
  if (isHomePath(pathname)) {
    const section = isHomeSection(homeSection)
      ? homeSection
      : homeSection === "home"
        ? "home"
        : null;
    return planetForHomeSection(section);
  }
  if (pathname === "/_not-found") return UNCHARTED;
  // 未知のパス（404）も未踏の月
  if (!isHomePath(pathname) && !pathname.startsWith("/api/")) {
    return UNCHARTED;
  }
  return null;
}

export function planetById(id: string | null | undefined): PlanetTheme {
  if (!id) return UNCHARTED;
  if (id === "projects") return PROJECTS;
  if (id === "about") return ABOUT;
  if (id === "contact") return CONTACT;
  return UNCHARTED;
}

export function warpJourneyForSections(
  from: HomeSection,
  to: HomeSection,
): WarpJourney {
  if (from === to) return "neutral";
  if (from === "home") return "enter-planet";
  if (to === "home") return "leave-space";
  return "fly-between";
}

export function rgbCss(color: Rgb, alpha = 1): string {
  if (alpha >= 1) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

/** シェーダー向け 0–1 */
export function rgbVec(color: Rgb): [number, number, number] {
  return [color[0] / 255, color[1] / 255, color[2] / 255];
}

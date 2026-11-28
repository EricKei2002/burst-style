import { isHomeSection, type HomeSection } from "./homeSections";

export type Rgb = readonly [number, number, number];

/** public/backgrounds/<名前>-<wide|tall>.<avif|webp>（scripts/blender/ で作る） */
export type PlanetBackdrop =
  "projects" | "detail" | "about" | "contact" | "404";

export type PlanetTheme = {
  id: string;
  section: HomeSection | null;
  backdrop: PlanetBackdrop;
  /** 以下は背景画像の読み込み中・失敗時に見せるグラデーションの色 */
  skyTop: Rgb;
  skyHorizon: Rgb;
  ground: Rgb;
  groundHi: Rgb;
};

/** Projects セクション：航路の工房（サイトのフクシア／シアン） */
const PROJECTS: PlanetTheme = {
  id: "projects",
  section: "projects",
  backdrop: "projects",
  skyTop: [8, 4, 12],
  skyHorizon: [118, 45, 125],
  ground: [18, 10, 24],
  groundHi: [64, 32, 72],
};

/** About セクション：琥珀の居住地（人となり・経歴） */
const ABOUT: PlanetTheme = {
  id: "about",
  section: "about",
  backdrop: "about",
  skyTop: [12, 6, 4],
  skyHorizon: [160, 76, 40],
  ground: [30, 14, 8],
  groundHi: [96, 48, 26],
};

/** Contact セクション：交信の谷 */
const CONTACT: PlanetTheme = {
  id: "contact",
  section: "contact",
  backdrop: "contact",
  skyTop: [6, 7, 18],
  skyHorizon: [60, 66, 154],
  ground: [10, 11, 28],
  groundHi: [34, 38, 92],
};

/** 404：未踏の灰月 */
const UNCHARTED: PlanetTheme = {
  id: "uncharted",
  section: null,
  backdrop: "404",
  skyTop: [3, 3, 6],
  skyHorizon: [24, 23, 27],
  ground: [14, 13, 14],
  groundHi: [48, 46, 47],
};

export const SECTION_PLANETS: Record<
  Exclude<HomeSection, "home">,
  PlanetTheme
> = {
  projects: PROJECTS,
  about: ABOUT,
  contact: CONTACT,
};

// Vercel の ISR 再生成では、サーバー側の usePathname() がトップを "/index" と返す（ブラウザは "/"）
export function isHomePath(pathname: string): boolean {
  return pathname === "/" || pathname === "" || pathname === "/index";
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

/** 今の面に敷く画像。作品の詳細は Projects の惑星の格納庫内（本文向けの静かな構図） */
export function backdropForView(
  pathname: string,
  theme: PlanetTheme,
): PlanetBackdrop {
  return pathname.startsWith("/projects/") ? "detail" : theme.backdrop;
}

export function rgbCss(color: Rgb, alpha = 1): string {
  if (alpha >= 1) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

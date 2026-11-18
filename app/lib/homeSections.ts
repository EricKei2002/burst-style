/**
 * トップページを縦長スクロールではなく、メニューで 1 セクションずつ切り替えるための共通定義。
 * 表示中のセクションは URL ハッシュ（#projects など）と <html data-home-section> に持つ。
 */

export const HOME_SECTIONS = ["home", "projects", "about", "contact"] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number];

/** 切り替え後に window へ流すイベント名（detail: { section }） */
export const HOME_SECTION_EVENT = "home-section-change";

export const HOME_SECTION_LABELS: Record<HomeSection, string> = {
  home: "Home",
  projects: "Projects",
  about: "About",
  contact: "Contact",
};

export function isHomeSection(value: string | null): value is HomeSection {
  return value !== null && (HOME_SECTIONS as readonly string[]).includes(value);
}

/**
 * "#projects" → "projects"。空・#top・#now は Home。
 * #about-lab-todo のような About 内のアンカーは About。知らないハッシュは null。
 */
export function sectionFromHash(hash: string): HomeSection | null {
  let id = hash.replace(/^#/, "");
  try {
    id = decodeURIComponent(id);
  } catch {
    return null;
  }
  id = id.toLowerCase();
  if (id === "" || id === "top" || id === "now") return "home";
  if (isHomeSection(id)) return id;
  if (id.startsWith("about-")) return "about";
  return null;
}

/** ハッシュを優先し、無ければ ?section= を見る（直リンク用） */
export function sectionFromLocation(
  hash: string,
  search: string,
): HomeSection | null {
  if (hash && hash !== "#") return sectionFromHash(hash);
  const param = new URLSearchParams(search).get("section");
  if (param !== null) return sectionFromHash(param);
  return "home";
}

/** URL に書くハッシュ。Home はハッシュ無し */
export function hashForSection(section: HomeSection): string {
  return section === "home" ? "" : `#${section}`;
}

/**
 * 初回描画前に <html data-home-section> を決める（直リンクで Home が一瞬見えるのを防ぐ）。
 * layout の <head> で実行する。トップページ以外では何もしない。
 */
export const homeSectionInitScript = `try{if(location.pathname==="/"){var h=location.hash.slice(1);if(!h){h=new URLSearchParams(location.search).get("section")||""}h=decodeURIComponent(h).toLowerCase();if(h.indexOf("about-")===0){h="about"}document.documentElement.dataset.homeSection=["projects","about","contact"].indexOf(h)>=0?h:"home"}}catch(e){}`;

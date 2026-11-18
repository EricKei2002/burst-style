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

/** 前後のセクション（端では止まる）。dir は -1（前）か 1（次） */
export function adjacentSection(
  current: HomeSection,
  dir: -1 | 1,
): HomeSection {
  const index = HOME_SECTIONS.indexOf(current) + dir;
  return HOME_SECTIONS[Math.min(HOME_SECTIONS.length - 1, Math.max(0, index))];
}

/** 数字キー "1"〜"4" → セクション。それ以外は null */
export function sectionFromDigit(key: string): HomeSection | null {
  const index = Number.parseInt(key, 10) - 1;
  if (!/^[1-9]$/.test(key) || index >= HOME_SECTIONS.length) return null;
  return HOME_SECTIONS[index];
}

/** "02/04" のようなページ番号 */
export function sectionPageLabel(section: HomeSection): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(HOME_SECTIONS.indexOf(section) + 1)}/${pad(HOME_SECTIONS.length)}`;
}

/**
 * 横スワイプかどうか。縦スクロールと取り違えないよう、横に 60px 以上・縦の 2 倍以上・
 * 0.8 秒以内のときだけ切り替える。戻り値は -1（右へスワイプ＝前へ）/ 1（左へ＝次へ）/ null
 */
export function swipeDirection(
  dx: number,
  dy: number,
  durationMs: number,
): -1 | 1 | null {
  if (durationMs > 800) return null;
  if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 2) return null;
  return dx < 0 ? 1 : -1;
}

/**
 * JavaScript が動くときだけ <html data-home-section> を置き、切り替え式にする
 * （属性が無い＝JS 無しでは全セクションを縦に並べる）。
 * トップの直リンク（#projects など）は初回描画前に決めるので Home が一瞬見えない。layout の <head> で実行する。
 */
export const homeSectionInitScript = `try{var d=document.documentElement;d.dataset.homeSection="home";if(location.pathname==="/"){var h=location.hash.slice(1);if(!h){h=new URLSearchParams(location.search).get("section")||""}h=decodeURIComponent(h).toLowerCase();if(h.indexOf("about-")===0){h="about"}if(["projects","about","contact"].indexOf(h)>=0){d.dataset.homeSection=h}}}catch(e){}`;

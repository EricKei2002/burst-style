"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Header from "./Header";
import { useLocale } from "../../lib/locale";
import {
  HOME_SECTIONS,
  HOME_SECTION_EVENT,
  HOME_SECTION_LABELS,
  hashForSection,
  sectionFromHash,
  sectionFromLocation,
  type HomeSection,
} from "../../lib/homeSections";

/** 前のセクションをフェードアウトさせる時間（ms）。CSS の .home-panel.is-leaving と揃える */
const LEAVE_MS = 180;

type Props = Record<HomeSection, ReactNode>;

type ShowOptions = { focus: boolean; animate: boolean; announce: boolean };

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * トップページの Home / Projects / About / Contact を、メニューで 1 つずつ切り替えて表示する。
 * 表示の出し分けは CSS（<html data-home-section> と .home-panel）で行い、
 * 初回は layout の inline script がハッシュから決めるので直リンクでもちらつかない。
 */
export default function HomeSections(props: Props) {
  const { locale } = useLocale();
  const [active, setActive] = useState<HomeSection>("home");
  const [leaving, setLeaving] = useState<HomeSection | null>(null);
  const [animated, setAnimated] = useState(false);
  const [message, setMessage] = useState("");
  const activeRef = useRef<HomeSection>("home");
  const panelRefs = useRef<Partial<Record<HomeSection, HTMLDivElement | null>>>(
    {},
  );
  const scrollPositions = useRef<Partial<Record<HomeSection, number>>>({});
  const leaveTimer = useRef<number | undefined>(undefined);
  const localeRef = useRef(locale);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  const focusHeading = useCallback((section: HomeSection) => {
    const heading =
      panelRefs.current[section]?.querySelector<HTMLElement>("h1, h2");
    if (!heading) return;
    if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }, []);

  const show = useCallback(
    (next: HomeSection, { focus, animate, announce }: ShowOptions) => {
      const prev = activeRef.current;
      if (next === prev) {
        if (focus) focusHeading(next);
        return;
      }
      scrollPositions.current[prev] = window.scrollY;
      activeRef.current = next;
      window.clearTimeout(leaveTimer.current);

      const swap = () => {
        document.documentElement.dataset.homeSection = next;
        setLeaving(null);
        setActive(next);
        if (announce) {
          const label = HOME_SECTION_LABELS[next];
          setMessage(
            localeRef.current === "ja"
              ? `${label} を表示しました`
              : `Showing ${label}`,
          );
        }
        requestAnimationFrame(() => {
          window.scrollTo({
            top: scrollPositions.current[next] ?? 0,
            behavior: "instant",
          });
          if (focus) focusHeading(next);
          window.dispatchEvent(
            new CustomEvent(HOME_SECTION_EVENT, { detail: { section: next } }),
          );
        });
      };

      if (!animate || prefersReducedMotion()) {
        swap();
        return;
      }
      setAnimated(true);
      setLeaving(prev);
      leaveTimer.current = window.setTimeout(swap, LEAVE_MS);
    },
    [focusHeading],
  );

  // 直リンク・/projects/[slug] からの戻りでは、描画前に URL の状態へ合わせる
  useLayoutEffect(() => {
    const initial =
      sectionFromLocation(window.location.hash, window.location.search) ??
      "home";
    document.documentElement.dataset.homeSection = initial;
    activeRef.current = initial;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回だけ URL から復元する
    setActive(initial);
    if (initial !== "home") {
      requestAnimationFrame(() => {
        // #about-lab-todo のようなセクション内のアンカーなら、その位置まで送る
        const anchorId = decodeURIComponent(window.location.hash.slice(1));
        const anchor =
          anchorId && anchorId !== initial
            ? document.getElementById(anchorId)
            : null;
        if (anchor) anchor.scrollIntoView({ block: "start" });
        else window.scrollTo({ top: 0, behavior: "instant" });
        window.dispatchEvent(
          new CustomEvent(HOME_SECTION_EVENT, {
            detail: { section: initial },
          }),
        );
      });
    }
    return () => window.clearTimeout(leaveTimer.current);
  }, []);

  // 戻る・進む（pushState の履歴は popstate、手入力のハッシュ変更は hashchange）
  useEffect(() => {
    const sync = () => {
      const section = sectionFromLocation(
        window.location.hash,
        window.location.search,
      );
      if (section)
        show(section, { focus: false, animate: true, announce: true });
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, [show]);

  // ページ内の #projects などへのリンク（メニュー、About の「連絡する」など）を切り替えに置き換える
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      const url = new URL(anchor.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.pathname !== window.location.pathname
      ) {
        return;
      }
      const section = sectionFromHash(url.hash);
      if (!section) return;
      event.preventDefault();
      const nextUrl = `${url.pathname}${window.location.search}${hashForSection(section)}`;
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextUrl !== currentUrl) {
        window.history.pushState(window.history.state, "", nextUrl);
      }
      show(section, { focus: true, animate: true, announce: true });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [show]);

  return (
    <div className={`home-sections${animated ? " is-animated" : ""}`}>
      <Header active={active} />
      <p className="sr-only" role="status" aria-live="polite">
        {message}
      </p>
      {HOME_SECTIONS.map((section) => (
        <div
          key={section}
          ref={(el) => {
            panelRefs.current[section] = el;
          }}
          data-section={section}
          className={`home-panel${leaving === section ? " is-leaving" : ""}`}
        >
          {props[section]}
        </div>
      ))}
    </div>
  );
}

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
  adjacentSection,
  hashForSection,
  sectionFromDigit,
  sectionFromHash,
  sectionFromLocation,
  swipeDirection,
  type HomeSection,
} from "../../lib/homeSections";
import {
  planetForHomeSection,
  warpJourneyForSections,
} from "../../lib/planets";
import { preloadShaderTransition } from "../../lib/shaderTransitionLoader";
import {
  beginSectionWarpOpen,
  endSectionWarp,
  scheduleSectionWarpOpen,
  startSectionWarp,
  useTransitionStore,
  waitForShaderReady,
} from "../../lib/store";

/** 前のセクションをフェードアウトさせる時間（ms）。CSS の .home-panel.is-leaving と揃える */
const LEAVE_MS = 90;

/**
 * アンカーへ送ったあと、上の内容（画像・遅れて描く部品）の高さが変わると行き先がヘッダーの裏へずれる。
 * 跳んだ直後の短い間だけ、ユーザーが自分で操作するまで行き先を保つ。
 * 余白は html の scroll-padding-top（globals.css）に任せる
 */
function scrollToAnchor(el: HTMLElement) {
  el.scrollIntoView({ block: "start" });
  const userEvents = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
  const ro = new ResizeObserver(() => el.scrollIntoView({ block: "start" }));
  const stop = () => {
    ro.disconnect();
    window.clearTimeout(timer);
    for (const type of userEvents) window.removeEventListener(type, stop);
  };
  const timer = window.setTimeout(stop, 2000);
  for (const type of userEvents) {
    window.addEventListener(type, stop, { passive: true });
  }
  ro.observe(document.body);
}

type Props = Record<HomeSection, ReactNode>;

type ShowOptions = {
  focus: boolean;
  animate: boolean;
  announce: boolean;
  /** セクション内のアンカー（#projects-index など）。切り替え後にそこへ送ってフォーカスする */
  anchor?: string | null;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** 文字入力中・ボタンやリンク以外の操作部品の上では、キーやスワイプで切り替えない */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(
    target.closest(
      'input, textarea, select, [role="slider"], [role="listbox"], [role="menu"], [role="tablist"]',
    ),
  );
}

/** 横にスクロールできる要素（カルーセルなど）の上で始まったスワイプは、その要素に任せる */
function startsInHorizontalScroller(target: EventTarget | null): boolean {
  let el = target instanceof Element ? target : null;
  while (el && el !== document.body) {
    if (el instanceof HTMLElement) {
      if (el.dataset.noSwipe !== undefined) return true;
      const overflowX = getComputedStyle(el).overflowX;
      if (
        (overflowX === "auto" || overflowX === "scroll") &&
        el.scrollWidth > el.clientWidth + 1
      ) {
        return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

/**
 * トップページの Home / Projects / About / Contact を、メニュー・左右キー・数字キー・
 * 横スワイプで 1 つずつ切り替えて表示する（JS が動くときだけ。JS 無しでは縦に並ぶ）。
 * 表示の出し分けは CSS（<html data-home-section> と .home-panel）で行い、
 * 初回は layout の inline script がハッシュから決めるので直リンクでもちらつかない。
 */
export default function HomeSections(props: Props) {
  const { locale } = useLocale();
  const [active, setActive] = useState<HomeSection>("home");
  const [enhanced, setEnhanced] = useState(false);
  const [leaving, setLeaving] = useState<HomeSection | null>(null);
  const [animated, setAnimated] = useState(false);
  const [message, setMessage] = useState("");
  /** 行き先（切り替え中も含めて最新） */
  const targetRef = useRef<HomeSection>("home");
  /** 実際に表示しているセクション */
  const displayedRef = useRef<HomeSection>("home");
  const panelRefs = useRef<Partial<Record<HomeSection, HTMLDivElement | null>>>(
    {},
  );
  const scrollPositions = useRef<Partial<Record<HomeSection, number>>>({});
  const leaveTimer = useRef<number | undefined>(undefined);
  const warpCloseTimer = useRef<number | undefined>(undefined);
  const warpOpenTimer = useRef<number | undefined>(undefined);
  const warpIdleTimer = useRef<number | undefined>(undefined);
  const warpInFlight = useRef(false);
  const warpSwapped = useRef(false);
  const localeRef = useRef(locale);
  /** 宇宙船の準備待ち中に次の操作が来たら、古い要求は捨てる */
  const navToken = useRef(0);

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

  const clearWarpTimers = useCallback(() => {
    window.clearTimeout(warpCloseTimer.current);
    window.clearTimeout(warpOpenTimer.current);
    window.clearTimeout(warpIdleTimer.current);
  }, []);

  const show = useCallback(
    (
      next: HomeSection,
      { focus, animate, announce, anchor = null }: ShowOptions,
    ) => {
      const focusAnchor = () => {
        const el = anchor ? document.getElementById(anchor) : null;
        if (!el) return false;
        if (!el.hasAttribute("tabindex")) el.tabIndex = -1;
        scrollToAnchor(el);
        el.focus({ preventScroll: true });
        return true;
      };
      if (next === targetRef.current) {
        if (anchor && displayedRef.current === next) {
          requestAnimationFrame(() => focusAnchor());
          return;
        }
        if (focus) focusHeading(next);
        return;
      }
      const from = displayedRef.current;
      targetRef.current = next;
      window.clearTimeout(leaveTimer.current);

      // 連打しても、最後に選んだセクションへ 1 回だけ切り替える
      const swap = () => {
        const dest = targetRef.current;
        const displayed = displayedRef.current;
        if (displayed !== dest) {
          scrollPositions.current[displayed] = window.scrollY;
        }
        displayedRef.current = dest;
        document.documentElement.dataset.homeSection = dest;
        setLeaving(null);
        setActive(dest);
        if (announce) {
          const label = HOME_SECTION_LABELS[dest];
          setMessage(
            localeRef.current === "ja"
              ? `${label} を表示しました（${HOME_SECTIONS.indexOf(dest) + 1} / ${HOME_SECTIONS.length}）`
              : `Showing ${label} (${HOME_SECTIONS.indexOf(dest) + 1} of ${HOME_SECTIONS.length})`,
          );
        }
        requestAnimationFrame(() => {
          if (!(dest === next && focusAnchor())) {
            window.scrollTo({
              top: scrollPositions.current[dest] ?? 0,
              behavior: "instant",
            });
            if (focus) focusHeading(dest);
          }
          window.dispatchEvent(
            new CustomEvent(HOME_SECTION_EVENT, { detail: { section: dest } }),
          );
        });
      };

      const useShader =
        animate &&
        !prefersReducedMotion() &&
        useTransitionStore.getState().shaderReady;

      const warpOpts = (origin: HomeSection, dest: HomeSection) => {
        const journey = warpJourneyForSections(origin, dest);
        const destPlanet = planetForHomeSection(dest);
        const fromPlanet = planetForHomeSection(origin);
        return {
          journey,
          planetId: destPlanet?.id ?? fromPlanet?.id ?? null,
          fromPlanetId: fromPlanet?.id ?? null,
        };
      };

      if (useShader) {
        preloadShaderTransition();
        if (warpInFlight.current && !warpSwapped.current) {
          const opts = warpOpts(from, next);
          useTransitionStore
            .getState()
            .setWarpContext(opts.journey, opts.planetId, opts.fromPlanetId);
          return;
        }
        if (warpInFlight.current && warpSwapped.current) {
          clearWarpTimers();
          endSectionWarp();
          warpInFlight.current = false;
        }
        const opts = warpOpts(from, next);
        const delay = startSectionWarp(opts);
        const journey = opts.journey;
        warpInFlight.current = true;
        warpSwapped.current = false;
        warpCloseTimer.current = window.setTimeout(() => {
          swap();
          warpSwapped.current = true;
          useTransitionStore.getState().setPhase("closed");
          const { openAt, idleAt } = scheduleSectionWarpOpen(journey);
          warpOpenTimer.current = window.setTimeout(() => {
            beginSectionWarpOpen();
            warpIdleTimer.current = window.setTimeout(() => {
              endSectionWarp();
              warpInFlight.current = false;
              warpSwapped.current = false;
            }, idleAt);
          }, openAt);
        }, delay);
        return;
      }

      clearWarpTimers();
      warpInFlight.current = false;
      if (!animate || prefersReducedMotion()) {
        setLeaving(null);
        swap();
        return;
      }
      setAnimated(true);
      setLeaving(displayedRef.current);
      leaveTimer.current = window.setTimeout(swap, LEAVE_MS);
    },
    [clearWarpTimers, focusHeading],
  );

  /**
   * URL を書き換えてから切り替える（ヘッダー・下部タブ・キー・スワイプ共通）。
   * 宇宙船の準備がまだなら、ページ遷移と同じく最大 1 秒待ってから宇宙船か短いフェードかを決める。
   */
  const navigate = useCallback(
    (section: HomeSection, focus: boolean, anchor: string | null = null) => {
      const token = ++navToken.current;
      const go = () => {
        if (token !== navToken.current) return;
        const hash = anchor ? `#${anchor}` : hashForSection(section);
        const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
        const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (nextUrl !== currentUrl) {
          window.history.pushState(window.history.state, "", nextUrl);
        }
        show(section, { focus, animate: true, announce: true, anchor });
      };
      const needsWait =
        section !== targetRef.current &&
        !prefersReducedMotion() &&
        !useTransitionStore.getState().shaderReady;
      if (!needsWait) {
        go();
        return;
      }
      preloadShaderTransition(true);
      void waitForShaderReady().then(go);
    },
    [show],
  );

  // 直リンク・/projects/[slug] からの戻りでは、描画前に URL の状態へ合わせる
  useLayoutEffect(() => {
    const initial =
      sectionFromLocation(window.location.hash, window.location.search) ??
      "home";
    document.documentElement.dataset.homeSection = initial;
    targetRef.current = initial;
    displayedRef.current = initial;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回だけ URL から復元する
    setActive(initial);
    setEnhanced(true);
    if (initial !== "home") {
      requestAnimationFrame(() => {
        // #about-lab-todo のようなセクション内のアンカーなら、その位置まで送る
        const anchorId = decodeURIComponent(window.location.hash.slice(1));
        const anchor =
          anchorId && anchorId !== initial
            ? document.getElementById(anchorId)
            : null;
        if (anchor) scrollToAnchor(anchor);
        else window.scrollTo({ top: 0, behavior: "instant" });
        window.dispatchEvent(
          new CustomEvent(HOME_SECTION_EVENT, {
            detail: { section: initial },
          }),
        );
      });
    }
    return () => {
      window.clearTimeout(leaveTimer.current);
      window.clearTimeout(warpCloseTimer.current);
      window.clearTimeout(warpOpenTimer.current);
      window.clearTimeout(warpIdleTimer.current);
    };
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
      const id = decodeURIComponent(url.hash.slice(1));
      const inner = id && id !== section && id !== "top" ? id : null;
      navigate(section, true, inner);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);

  // 左右キー・数字キー 1〜4（入力中・修飾キー付き・ほかの部品が使ったキーは無視）
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey ||
        isTypingTarget(event.target)
      ) {
        return;
      }
      let next: HomeSection | null = null;
      if (event.key === "ArrowLeft")
        next = adjacentSection(targetRef.current, -1);
      else if (event.key === "ArrowRight")
        next = adjacentSection(targetRef.current, 1);
      else next = sectionFromDigit(event.key);
      if (!next) return;
      event.preventDefault();
      navigate(next, true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  // スマホの左右スワイプ（縦スクロールやカルーセルの横スクロールとは取り違えない）
  useEffect(() => {
    let start: { x: number; y: number; t: number } | null = null;
    const onTouchStart = (event: TouchEvent) => {
      if (
        event.touches.length !== 1 ||
        isTypingTarget(event.target) ||
        startsInHorizontalScroller(event.target)
      ) {
        start = null;
        return;
      }
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY, t: event.timeStamp };
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (!start) return;
      const touch = event.changedTouches[0];
      const dir = swipeDirection(
        touch.clientX - start.x,
        touch.clientY - start.y,
        event.timeStamp - start.t,
      );
      start = null;
      if (dir === null) return;
      const next = adjacentSection(targetRef.current, dir);
      if (next !== targetRef.current) navigate(next, false);
    };
    const onTouchCancel = () => {
      start = null;
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [navigate]);

  return (
    <div className={`home-sections${animated ? " is-animated" : ""}`}>
      <Header active={active} enhanced={enhanced} />
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

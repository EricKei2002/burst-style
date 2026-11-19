"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { rgbCss, type PlanetTheme } from "../../lib/planets";
import { prefersReducedMotion } from "../../lib/pageTransitionTiming";
import { projectsData } from "../../lib/data";
import { HANGAR_EXHIBIT_EVENT } from "../../lib/hangarExhibit";
import { FrameSlicer } from "./frameSlicer";
import type { PlanetSceneHandle } from "./planetScene";

type Props = {
  theme: PlanetTheme;
};

/** 空き時間が来なくても、この時間で準備を始める（初回描画は邪魔しない長さ） */
const IDLE_START_TIMEOUT_MS = 2500;
/** 作品の詳細から開いたときは、load のあとこの時間待ってから組み立てる */
const DETAIL_START_AFTER_LOAD_MS = 5000;
/** スクロールのこの距離（画面の高さ比）でカメラパスを最後までたどる */
const PATH_SCREENS = 1.5;
/** これより深く読み進めたら（画面の高さ比）、本文を読んでいるとみなして描画を止める */
const READING_SCREENS = 1.6;

/**
 * 惑星ページの背景。three のシーン本体（planetScene）は動的 import で
 * 後から読み込み、それまで / WebGL が使えないときは CSS のグラデーションを見せる。
 * - 組み立ては FrameSlicer で数 ms ずつ（長いタスクを作らない）
 * - 動きを減らす設定：低品質で 1 フレームだけ描いて止める（ループなし・カメラ固定）
 * - タブ非表示・画面外・作品の詳細（/projects/*）・本文を深く読んでいる間：ループを止める
 *   （<html data-planet-loop="running|paused"> で状態を確かめられる）
 * - スクロールに合わせてカメラパスをたどる。格納庫では駐機機体を DOM の駐機窓に収める
 */
export default function PlanetInterior({ theme }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PlanetSceneHandle | null>(null);
  const themeRef = useRef(theme);
  const pathname = usePathname();
  const detailRef = useRef(pathname.startsWith("/projects/"));
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    themeRef.current = theme;
    const scene = sceneRef.current;
    if (!scene) return;
    // 惑星を移るときも分割して組み立てる（遷移の覆いの裏で進む）
    const slicer = new FrameSlicer({ urgent: true });
    scene
      .setThemeAsync(theme, slicer)
      .then(() => syncRef.current())
      .catch(() => {});
    return () => slicer.cancel();
  }, [theme]);

  useEffect(() => {
    detailRef.current = pathname.startsWith("/projects/");
    syncRef.current();
  }, [pathname]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduce = prefersReducedMotion();
    const root = document.documentElement;
    let cancelled = false;
    let onScreen = true;
    let visible = !document.hidden;
    let reading = false;
    let idleHandle = 0;
    let idleTimer = 0;
    let resizeRaf = 0;
    let scrollRaf = 0;
    let slicer: FrameSlicer | null = null;

    /** 今の画面に出ている格納庫の駐機窓（無ければ null） */
    const visibleBay = (): HTMLElement | null => {
      const bays = document.querySelectorAll<HTMLElement>("[data-hangar-bay]");
      for (const bay of bays) {
        if (bay.offsetParent !== null) return bay;
      }
      return null;
    };

    const readScroll = () => {
      const vh = window.innerHeight || 1;
      const y = window.scrollY;
      reading = detailRef.current || y > vh * READING_SCREENS;
      const s = sceneRef.current;
      if (!s) return;
      if (!reduce) s.setScroll(Math.min(1, y / (vh * PATH_SCREENS)));
      const bay = visibleBay();
      if (!bay) {
        s.setFocus(0, 0, 0);
        return;
      }
      const r = bay.getBoundingClientRect();
      const vw = window.innerWidth || 1;
      const cx = r.left + r.width * 0.5;
      const cy = r.top + r.height * 0.55;
      // 駐機窓が画面にどれだけ入っているか（0..1）で通常の構図と混ぜる
      const seen =
        Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) /
        Math.max(1, Math.min(r.height, vh));
      s.setFocus(
        Math.max(-1.2, Math.min(1.2, (cx / vw) * 2 - 1)),
        Math.max(-1.2, Math.min(1.2, -((cy / vh) * 2 - 1))),
        Math.min(1, seen * 1.4),
      );
    };

    const sync = () => {
      readScroll();
      const s = sceneRef.current;
      const running = Boolean(
        s && s.animate && visible && onScreen && !reading,
      );
      if (s) {
        if (running) {
          s.start();
        } else {
          s.stop();
          // 止める直前の 1 枚を残す（読んでいる間も背景は静止画で見える）
          if (visible) s.renderOnce();
        }
      }
      root.dataset.planetLoop = running ? "running" : "paused";
    };
    syncRef.current = sync;

    const init = async () => {
      let mod: typeof import("./planetScene");
      try {
        mod = await import("./planetScene");
      } catch {
        return;
      }
      if (cancelled) return;
      const current = new FrameSlicer({ urgent: false });
      slicer = current;
      let scene: PlanetSceneHandle | null = null;
      try {
        scene = await mod.createPlanetSceneAsync(
          host,
          {
            reduce,
            onContextLost: () => {
              // CSS のグラデーションに戻る
              sceneRef.current?.dispose();
              sceneRef.current = null;
              root.dataset.planetLoop = "paused";
              delete root.dataset.planetScene;
            },
            exhibits: projectsData.map((p) => ({
              slug: p.slug,
              label: p.title,
            })),
          },
          themeRef.current,
          current,
        );
      } catch {
        return;
      } finally {
        if (slicer === current) slicer = null;
      }
      if (!scene) return;
      if (cancelled) {
        scene.dispose();
        return;
      }
      sceneRef.current = scene;
      // 駐機窓の段階ラベル（接近 → 駐機）を CSS で切り替える合図
      root.dataset.planetScene = "ready";
      sync();
      // 組み立て中にテーマが変わっていたら、分割して追いつく（同じテーマなら何もしない）
      const catchUp = new FrameSlicer({ urgent: true });
      scene
        .setThemeAsync(themeRef.current, catchUp)
        .then(() => syncRef.current())
        .catch(() => {});
    };

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = 0;
      void init();
    };
    const scheduleIdle = (timeout?: number) => {
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(
          start,
          timeout ? { timeout } : undefined,
        );
      } else {
        idleTimer = window.setTimeout(start, 200);
      }
    };
    let loadDelayTimer = 0;
    const scheduleAfterLoad = () => {
      loadDelayTimer = window.setTimeout(
        () => scheduleIdle(),
        DETAIL_START_AFTER_LOAD_MS,
      );
    };
    if (detailRef.current) {
      // 作品の詳細から開いたとき：背景は静止画でよいので、読み込みと最初の操作を優先し、
      // load のあと少し待ってから空き時間で組み立てる（スクロールや操作があれば前倒し）
      if (document.readyState === "complete") scheduleAfterLoad();
      else window.addEventListener("load", scheduleAfterLoad, { once: true });
    } else {
      // 初回描画を邪魔しないよう空き時間に組み立てる（短い timeout で強制しない）
      scheduleIdle(IDLE_START_TIMEOUT_MS);
    }
    // 準備前の操作は開始の合図、準備中の押下・キーは急ぐ合図
    const hurry = () => {
      if (!started) start();
      slicer?.setUrgent();
    };
    const nudge = () => {
      if (!started) start();
    };
    window.addEventListener("pointerdown", hurry, { passive: true });
    window.addEventListener("keydown", hurry);
    window.addEventListener("scroll", nudge, { passive: true, once: true });

    const onResize = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        sceneRef.current?.resize();
        readScroll();
      });
    };
    window.addEventListener("resize", onResize);

    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        const wasReading = reading;
        readScroll();
        if (wasReading !== reading) sync();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // セクションが切り替わると駐機窓の有無が変わる
    window.addEventListener("home-section-change", onScroll);

    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    let inspectBay: HTMLElement | null = null;
    const onPointer = (e: PointerEvent) => {
      const s = sceneRef.current;
      if (!s) return;
      if (!reduce) {
        s.setLook(
          clamp((e.clientX / window.innerWidth - 0.5) * 2),
          clamp((e.clientY / window.innerHeight - 0.5) * 2),
        );
      }
      // 駐機窓の上では、看板に乗ったときだけ指のカーソルにする
      const bay = (e.target as Element | null)?.closest?.("[data-hangar-bay]");
      if (inspectBay && inspectBay !== bay) {
        delete inspectBay.dataset.inspect;
        inspectBay = null;
      }
      if (bay instanceof HTMLElement) {
        const over = Boolean(s.pickExhibit(e.clientX, e.clientY));
        bay.style.cursor = over ? "pointer" : "";
        // 看板に乗っている間は段階ラベルを「点検」にする
        if (over) {
          bay.dataset.inspect = "";
          inspectBay = bay;
        } else {
          delete bay.dataset.inspect;
          inspectBay = null;
        }
      }
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    // 看板をクリックすると、その作品の詳細を開く（遷移は Projects が受け持つ）
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      const target = e.target as Element | null;
      if (!target?.closest?.("[data-hangar-bay]")) return;
      const slug = sceneRef.current?.pickExhibit(e.clientX, e.clientY);
      if (!slug) return;
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent(HANGAR_EXHIBIT_EVENT, { detail: { slug } }),
      );
    };
    document.addEventListener("click", onClick);

    // 許可ダイアログは出さない。イベントが届く端末だけで傾きを使う。
    const onOrient = (e: DeviceOrientationEvent) => {
      if (reduce || e.gamma == null || e.beta == null) return;
      sceneRef.current?.setLook(clamp(e.gamma / 25), clamp((e.beta - 40) / 35));
    };
    window.addEventListener("deviceorientation", onOrient);

    const onVis = () => {
      visible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVis);

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          onScreen = entries.some((entry) => entry.isIntersecting);
          sync();
        },
        { threshold: 0 },
      );
      io.observe(host);
    }

    return () => {
      cancelled = true;
      slicer?.cancel();
      if (idleHandle && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (idleTimer) window.clearTimeout(idleTimer);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      window.clearTimeout(loadDelayTimer);
      window.removeEventListener("load", scheduleAfterLoad);
      window.removeEventListener("scroll", nudge);
      window.removeEventListener("pointerdown", hurry);
      window.removeEventListener("keydown", hurry);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("home-section-change", onScroll);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("click", onClick);
      window.removeEventListener("deviceorientation", onOrient);
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
      sceneRef.current?.dispose();
      sceneRef.current = null;
      syncRef.current = () => {};
      delete root.dataset.planetLoop;
      delete root.dataset.planetScene;
      if (inspectBay) delete inspectBay.dataset.inspect;
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-50 h-full w-full overflow-hidden"
      style={{
        backgroundColor: rgbCss(theme.skyTop),
        // 3D が読み込まれるまで / 使えないときの空と地平
        backgroundImage: `linear-gradient(to bottom, ${rgbCss(theme.skyTop)} 0%, ${rgbCss(theme.skyHorizon)} 58%, ${rgbCss(theme.groundHi)} 62%, ${rgbCss(theme.ground)} 100%)`,
      }}
    >
      {/* 本文のコントラストを保つ上部の暗幕 */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${rgbCss(theme.skyTop, 0.72)} 0%, ${rgbCss(theme.skyTop, 0.28)} 28%, transparent 58%)`,
        }}
      />
    </div>
  );
}

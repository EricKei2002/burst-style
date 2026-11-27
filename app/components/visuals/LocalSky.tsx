"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { isHomePath } from "../../lib/planets";
import {
  HOME_SECTION_EVENT,
  isHomeSection,
  type HomeSection,
} from "../../lib/homeSections";
import dynamic from "next/dynamic";
import {
  getSkyPhase,
  isSkyPhase,
  isSkyWeather,
  type LocalSkyResponse,
  type SkyPhase,
  type SkyWeather,
} from "../../lib/localSky";
import {
  getSkyLook,
  lookForPhase,
  paletteForLook,
  phaseForLook,
  rgbaString,
  type SkyLook,
} from "../../lib/solar";

// 雨粒の Canvas は雨のときだけ要る。最初の JS から外し、雨になってから読み込む
const RainCanvas = dynamic(() => import("./RainCanvas"), { ssr: false });

/** 左端の時刻を重ねて描かない要素（計器パネルと About のプロフィールカード） */
const SKY_AVOID = ".instrument-panel, [data-sky-avoid]";

type SkyState = {
  phase: SkyPhase;
  look: SkyLook;
  weather: SkyWeather | null;
  city: string | null;
  time: string;
};

/** 太陽高度から補間した空の色（下端のグラデーション）をベールの CSS 変数にする */
function veilStyle(look: SkyLook): CSSProperties {
  const palette = paletteForLook(look);
  return {
    "--sky-low": rgbaString(palette.low),
    "--sky-mid": rgbaString(palette.mid),
    "--sky-wash": rgbaString(palette.wash),
  } as CSSProperties;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * 見ている人の位置（Vercel の IP 位置ヘッダーを丸めたもの）から太陽高度を計算し、空の色を連続的に変える
 * （位置が取れないときはブラウザの時計で 4 段階）。天気（/api/local-sky）とあわせて、
 * 星空背景の色味（朝・昼・夕方は画面下端のグラデーション）、雨・雪・もや、
 * 画面左端の小さな計器表示に反映する。どれも本文の後ろ（z-index が負）に置き、
 * クリックは通し、読み上げからは隠す。マウント後に描くので LCP には関わらない。
 * 確認用: ?sky=morning|day|evening|night&weather=clear|cloudy|rain|snow|none
 */
export default function LocalSky() {
  const pathname = usePathname();
  const [homeSection, setHomeSection] = useState<HomeSection>("home");
  useEffect(() => {
    const sync = () => {
      const value = document.documentElement.dataset.homeSection ?? null;
      setHomeSection(isHomeSection(value) ? value : "home");
    };
    sync();
    window.addEventListener(HOME_SECTION_EVENT, sync);
    return () => window.removeEventListener(HOME_SECTION_EVENT, sync);
  }, [pathname]);
  const showEarthSky = isHomePath(pathname) && homeSection === "home";
  const [sky, setSky] = useState<SkyState | null>(null);
  const [env, setEnv] = useState({ lite: false, hidden: false, ja: false });
  /** 丸めた位置（API から）。取れるまでは時計ベース */
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);
  const weather = sky?.weather ?? null;

  // 低スペック端末・データセーバーでは軽い表示、タブが見えていないときは止める、説明文の言語
  useEffect(() => {
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
    };
    const lite =
      (nav.hardwareConcurrency ?? 8) <= 4 || nav.connection?.saveData === true;
    const read = () =>
      setEnv({
        lite,
        hidden: document.hidden,
        ja: document.documentElement.lang.startsWith("ja"),
      });
    read();
    document.addEventListener("visibilitychange", read);
    const langObserver = new MutationObserver(read);
    langObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });
    return () => {
      document.removeEventListener("visibilitychange", read);
      langObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forcedPhase = params.get("sky");
    const forcedWeather = params.get("weather");
    const phaseOverride = isSkyPhase(forcedPhase) ? forcedPhase : null;
    const weatherForced = forcedWeather !== null;
    const weatherOverride = isSkyWeather(forcedWeather) ? forcedWeather : null;

    const tick = () => {
      const now = new Date();
      const coords = coordsRef.current;
      const look = phaseOverride
        ? lookForPhase(phaseOverride)
        : coords
          ? getSkyLook(now, coords.lat, coords.lon)
          : lookForPhase(getSkyPhase(now.getHours()));
      setSky((prev) => ({
        look,
        phase: phaseForLook(look),
        weather: weatherForced ? weatherOverride : (prev?.weather ?? null),
        city: prev?.city ?? null,
        time: formatTime(now),
      }));
    };
    tick();
    const clock = window.setInterval(tick, 30_000);

    // 天気は表示が落ち着いてから非同期で取りに行く（LCP・初回表示を遅らせない）
    let cancelled = false;
    const controller = new AbortController();
    const loadWeather = async () => {
      try {
        const res = await fetch("/api/local-sky", {
          signal: controller.signal,
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as LocalSkyResponse;
        if (cancelled) return;
        if (data.lat !== null && data.lon !== null) {
          coordsRef.current = { lat: data.lat, lon: data.lon };
          tick();
        }
        setSky((prev) =>
          prev
            ? {
                ...prev,
                city: data.city,
                weather: weatherForced ? prev.weather : data.weather,
              }
            : prev,
        );
      } catch {
        // 取れなければ時間だけ
      }
    };
    const hasIdleCallback = typeof window.requestIdleCallback === "function";
    const idleId = hasIdleCallback
      ? window.requestIdleCallback(() => void loadWeather(), { timeout: 4000 })
      : setTimeout(() => void loadWeather(), 2000);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(clock);
      if (hasIdleCallback) window.cancelIdleCallback(idleId as number);
      else clearTimeout(idleId);
    };
  }, []);

  // 狭い画面では左端の時刻がパネル（作品一覧など）の左縁に乗る。重なっている間だけ時刻を隠す。
  // スクロール・リサイズ・ページ内ジャンプのたびに、時刻とパネルの矩形を直接比べる（1 フレームに 1 回まで）。
  // IntersectionObserver の rootMargin で時刻の矩形まで縮める方式は、本番環境で判定が抜けることがあった。
  // PC の左余白ではどれとも重ならないので出たまま
  const dockRef = useRef<HTMLDivElement>(null);
  const [covered, setCovered] = useState(false);
  const hasSky = sky !== null;
  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      // visibility: hidden でもレイアウトは残るので、隠している間も矩形は取れる
      const r = dock.getBoundingClientRect();
      if (!r.width || !r.height) {
        setCovered(false);
        return;
      }
      let hit = false;
      for (const el of document.querySelectorAll(SKY_AVOID)) {
        const p = el.getBoundingClientRect();
        if (
          p.width > 0 &&
          p.height > 0 &&
          p.left < r.right &&
          p.right > r.left &&
          p.top < r.bottom &&
          p.bottom > r.top
        ) {
          hit = true;
          break;
        }
      }
      setCovered(hit);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(check);
    };
    schedule();
    // 時刻の文字数（都市名・天気の有無）が変わったときも測り直す
    const ro = new ResizeObserver(schedule);
    ro.observe(dock);
    // 捕捉段階で拾い、ページ全体だけでなく内側のスクロール領域の動きにも反応する
    document.addEventListener("scroll", schedule, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      ro.disconnect();
      document.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [hasSky, pathname, homeSection]);

  // 星空背景（StarBackground / ShootingStars / globals.css）が読む値を <html> に置く
  useEffect(() => {
    if (!sky) return;
    const root = document.documentElement;
    root.dataset.sky = sky.phase;
    // 星の明るさは太陽高度から（StarBackground の .star-bg が読む）
    root.style.setProperty(
      "--sky-star-opacity",
      paletteForLook(sky.look).star.toFixed(3),
    );
    if (weather) root.dataset.weather = weather;
    else delete root.dataset.weather;
  }, [sky, weather]);

  if (!sky) return null;

  const readout = [
    [sky.city?.toUpperCase(), sky.time].filter(Boolean).join(" "),
    weather?.toUpperCase(),
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <>
      {showEarthSky && (
        <>
          <div
            className="local-sky-veil"
            aria-hidden="true"
            style={veilStyle(sky.look)}
          />
          {weather && weather !== "clear" && (
            <div
              className="local-sky-haze"
              data-kind={weather}
              data-lite={env.lite ? "" : undefined}
              data-paused={env.hidden ? "" : undefined}
              aria-hidden="true"
            />
          )}
          {weather === "rain" && (
            <>
              {/* 濡れた地面と光の映り込み（動かない。reduced-motion・低スペックでもこれだけは出す） */}
              <div className="local-sky-wet" aria-hidden="true" />
              <RainCanvas lite={env.lite} paused={env.hidden} />
            </>
          )}
          {weather === "snow" && (
            // 雪はゆっくり落ちる小さい粒。動きを減らす設定では CSS で非表示
            <div
              className="local-sky-precip"
              data-kind={weather}
              data-lite={env.lite ? "" : undefined}
              data-paused={env.hidden ? "" : undefined}
              aria-hidden="true"
            >
              <span />
              <span />
            </div>
          )}
        </>
      )}
      <div
        ref={dockRef}
        data-covered={covered ? "" : undefined}
        className="local-sky-dock fixed bottom-32 left-0 z-20 flex flex-col items-start gap-2 sm:left-0.5 md:bottom-24"
      >
        {/* 計器表示。ホバー・フォーカス（キーボード）・タップで短い説明を出す */}
        <div className="group relative">
          <button
            type="button"
            aria-describedby="local-sky-info"
            data-sonta-avoid=""
            onKeyDown={(event) => {
              if (event.key === "Escape") event.currentTarget.blur();
            }}
            className="local-sky-readout cursor-help select-none rounded bg-[rgb(7_7_11/0.85)] px-1 py-2 font-mono text-[11px] uppercase leading-none tracking-[0.2em] text-green-200 transition-colors hover:text-green-100 focus-visible:text-green-50 focus-visible:outline-1 focus-visible:outline-green-300/60"
          >
            {readout}
          </button>
          <p
            id="local-sky-info"
            role="tooltip"
            className="pointer-events-none absolute bottom-0 left-full ml-1 w-max max-w-[15rem] rounded-md border border-green-300/30 bg-zinc-950/95 px-2.5 py-1.5 font-mono text-[11px] leading-snug text-green-100 opacity-0 shadow-lg transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
          >
            {env.ja
              ? "あなたの地域の時刻と天気に合わせて、空の色を変えています"
              : "The sky follows your local time and weather"}
          </p>
        </div>
      </div>
    </>
  );
}

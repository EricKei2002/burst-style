"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import RainCanvas from "./RainCanvas";
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

type SkyState = {
  phase: SkyPhase;
  look: SkyLook;
  weather: SkyWeather | null;
  city: string | null;
  time: string;
};

const ICON_PROPS = {
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** 計器表示の横に置く、天気の手動切り替え */
const WEATHER_TOGGLES: {
  kind: SkyWeather;
  en: string;
  ja: string;
  icon: React.ReactNode;
}[] = [
  {
    kind: "clear",
    en: "Clear",
    ja: "晴れ",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    kind: "rain",
    en: "Rain",
    ja: "雨",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M7 15a4 4 0 1 1 1-7.9A5 5 0 0 1 18 9a3 3 0 0 1 0 6H7z" />
        <path d="M9 18l-1 3M13 18l-1 3M17 18l-1 3" />
      </svg>
    ),
  },
  {
    kind: "snow",
    en: "Snow",
    ja: "雪",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
      </svg>
    ),
  },
];

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
  const isProjectPage = pathname.startsWith("/projects/");
  const [sky, setSky] = useState<SkyState | null>(null);
  const [env, setEnv] = useState({ lite: false, hidden: false, ja: false });
  /** 丸めた位置（API から）。取れるまでは時計ベース */
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);
  /** 計器表示の横のトグルで選んだ天気（null は自動＝?weather= か実際の天気） */
  const [manualWeather, setManualWeather] = useState<SkyWeather | null>(null);
  const weather = manualWeather ?? sky?.weather ?? null;

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
      {!isProjectPage && (
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
            <RainCanvas lite={env.lite} paused={env.hidden} />
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
      <div className="fixed bottom-24 left-0 z-20 flex flex-col items-start gap-2 sm:left-0.5">
        {!isProjectPage && (
          // 天気の手動切り替え（押し直すと自動に戻る）
          <div
            role="group"
            aria-label={env.ja ? "天気を切り替える" : "Switch weather"}
            className="flex flex-col gap-1"
          >
            {WEATHER_TOGGLES.map(({ kind, en, ja, icon }) => (
              <button
                key={kind}
                type="button"
                aria-pressed={weather === kind}
                aria-label={env.ja ? ja : en}
                title={env.ja ? ja : en}
                onClick={() =>
                  setManualWeather((current) =>
                    current === kind ? null : kind,
                  )
                }
                className="flex h-6 w-6 items-center justify-center rounded border border-green-300/25 bg-zinc-950/80 text-green-200/80 transition-colors hover:text-green-50 focus-visible:outline-1 focus-visible:outline-green-300/70 aria-pressed:border-green-300/60 aria-pressed:bg-green-500/25 aria-pressed:text-green-50"
              >
                {icon}
              </button>
            ))}
          </div>
        )}
        {/* 計器表示。ホバー・フォーカス（キーボード）・タップで短い説明を出す */}
        <div className="group relative">
          <button
            type="button"
            aria-describedby="local-sky-info"
            onKeyDown={(event) => {
              if (event.key === "Escape") event.currentTarget.blur();
            }}
            className="local-sky-readout cursor-help select-none rounded px-1 py-2 font-mono text-[11px] uppercase leading-none tracking-[0.2em] text-green-200/80 transition-colors hover:text-green-100 focus-visible:text-green-50 focus-visible:outline-1 focus-visible:outline-green-300/60"
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

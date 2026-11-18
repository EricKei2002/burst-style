"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getSkyPhase,
  isSkyPhase,
  isSkyWeather,
  type LocalSkyResponse,
  type SkyPhase,
  type SkyWeather,
} from "../../lib/localSky";

type SkyState = {
  phase: SkyPhase;
  weather: SkyWeather | null;
  city: string | null;
  time: string;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * 見ている人の現地時間（ブラウザの時刻）と天気（/api/local-sky）を、
 * 星空背景の色味（朝・昼・夕方は画面下端のグラデーション）、雨・雪・もや、
 * 画面左端の小さな計器表示に反映する。どれも本文の後ろ（z-index が負）に置き、
 * クリックは通し、読み上げからは隠す。マウント後に描くので LCP には関わらない。
 * 確認用: ?sky=morning|day|evening|night&weather=clear|cloudy|rain|snow|none
 */
export default function LocalSky() {
  const pathname = usePathname();
  const isProjectPage = pathname.startsWith("/projects/");
  const [sky, setSky] = useState<SkyState | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forcedPhase = params.get("sky");
    const forcedWeather = params.get("weather");
    const phaseOverride = isSkyPhase(forcedPhase) ? forcedPhase : null;
    const weatherForced = forcedWeather !== null;
    const weatherOverride = isSkyWeather(forcedWeather) ? forcedWeather : null;

    const tick = () => {
      const now = new Date();
      setSky((prev) => ({
        phase: phaseOverride ?? getSkyPhase(now.getHours()),
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
    if (sky.weather) root.dataset.weather = sky.weather;
    else delete root.dataset.weather;
  }, [sky]);

  if (!sky) return null;

  const readout = [
    [sky.city?.toUpperCase(), sky.time].filter(Boolean).join(" "),
    sky.weather?.toUpperCase(),
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <>
      {!isProjectPage && (
        <>
          <div className="local-sky-veil" aria-hidden="true" />
          {sky.weather && sky.weather !== "clear" && (
            <div className="local-sky-haze" aria-hidden="true" />
          )}
          {(sky.weather === "rain" || sky.weather === "snow") && (
            // 雨は斜めの細い線、雪はゆっくり落ちる粒。動きを減らす設定では CSS で非表示
            <div
              className="local-sky-precip"
              data-kind={sky.weather}
              aria-hidden="true"
            >
              <span />
              <span />
            </div>
          )}
        </>
      )}
      <p className="local-sky-readout pointer-events-none fixed bottom-24 left-1 z-20 select-none font-mono text-[10px] uppercase leading-none tracking-[0.25em] text-green-200/55 sm:left-1.5">
        {readout}
      </p>
    </>
  );
}

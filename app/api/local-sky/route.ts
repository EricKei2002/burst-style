import { NextResponse } from "next/server";

import { mapWeatherCode, type LocalSkyResponse } from "../../lib/localSky";

// 訪問者ごとの IP ヘッダーを読むため、レスポンス自体は共有キャッシュしない
export const dynamic = "force-dynamic";

/** Open-Meteo の結果を共有する時間（秒）。座標は丸めてからキーにする */
const WEATHER_REVALIDATE_SECONDS = 1800;
const WEATHER_TIMEOUT_MS = 3000;

function readHeader(headers: Headers, name: string): string | null {
  const value = headers.get(name)?.trim();
  return value ? value : null;
}

function decodeCity(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

/** 位置の精度を落とす（小数 1 桁 ≒ 約 10km） */
function roundCoord(value: number): number {
  return Math.round(value * 10) / 10;
}

type OpenMeteoCurrent = {
  current?: {
    weather_code?: number;
    cloud_cover?: number;
    is_day?: number;
  };
};

export async function GET(request: Request) {
  const { headers } = request;
  const city = decodeCity(readHeader(headers, "x-vercel-ip-city"));
  const timezone = readHeader(headers, "x-vercel-ip-timezone");
  const lat = Number(readHeader(headers, "x-vercel-ip-latitude"));
  const lon = Number(readHeader(headers, "x-vercel-ip-longitude"));

  const body: LocalSkyResponse = { city, timezone, weather: null };

  const hasCoords =
    readHeader(headers, "x-vercel-ip-latitude") !== null &&
    readHeader(headers, "x-vercel-ip-longitude") !== null &&
    Number.isFinite(lat) &&
    Number.isFinite(lon);

  if (hasCoords) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(roundCoord(lat)));
    url.searchParams.set("longitude", String(roundCoord(lon)));
    url.searchParams.set("current", "weather_code,cloud_cover,is_day");

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS),
        next: { revalidate: WEATHER_REVALIDATE_SECONDS },
      });
      if (res.ok) {
        const data = (await res.json()) as OpenMeteoCurrent;
        const code = data.current?.weather_code;
        if (typeof code === "number") {
          const cloud = data.current?.cloud_cover;
          body.weather = mapWeatherCode(
            code,
            typeof cloud === "number" ? cloud : null,
          );
        }
      }
    } catch {
      // タイムアウト・通信失敗は天気なし（時間だけ）に落とす。座標はログに残さない
    }
  }

  return NextResponse.json<LocalSkyResponse>(body, {
    headers: {
      // 訪問者の位置に依存するので CDN では共有せず、ブラウザだけで 10 分使い回す
      "Cache-Control": "private, max-age=600",
    },
  });
}

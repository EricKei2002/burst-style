/** 見ている人の現地時間と天気を、星空背景へ控えめに反映するための共通定義 */

const SKY_PHASES = ["morning", "day", "evening", "night"] as const;
export type SkyPhase = (typeof SKY_PHASES)[number];

const SKY_WEATHERS = ["clear", "cloudy", "rain", "snow"] as const;
export type SkyWeather = (typeof SKY_WEATHERS)[number];

export type LocalSkyResponse = {
  /** 都市名（取れなければ null） */
  city: string | null;
  /** IANA タイムゾーン（取れなければ null） */
  timezone: string | null;
  /** 天気（ヘッダー無し・取得失敗時は null → 時間だけで表示） */
  weather: SkyWeather | null;
  /** 太陽高度の計算用に小数 1 桁（約 10km）へ丸めた位置。取れなければ null（ブラウザの時計で 4 段階） */
  lat: number | null;
  lon: number | null;
};

/** ブラウザの現地時刻（時）から 4 段階に分ける */
export function getSkyPhase(hour: number): SkyPhase {
  if (hour >= 5 && hour < 10) return "morning";
  if (hour >= 10 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

/**
 * WMO weather code（Open-Meteo）を 4 種類に丸める。
 * https://open-meteo.com/en/docs の "WMO Weather interpretation codes"
 */
export function mapWeatherCode(
  code: number,
  cloudCover: number | null,
): SkyWeather {
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) {
    return "rain";
  }
  if (code === 2 || code === 3 || code === 45 || code === 48) return "cloudy";
  if (cloudCover !== null && cloudCover >= 70) return "cloudy";
  return "clear";
}

export function isSkyPhase(value: string | null): value is SkyPhase {
  return value !== null && (SKY_PHASES as readonly string[]).includes(value);
}

export function isSkyWeather(value: string | null): value is SkyWeather {
  return value !== null && (SKY_WEATHERS as readonly string[]).includes(value);
}

/** 流れ星の出現間隔の倍率（1 より大きいほど少ない）。<html data-*> から読む */
export function getShootingStarDelayFactor(): number {
  if (typeof document === "undefined") return 1;
  const { sky, weather } = document.documentElement.dataset;
  const phaseFactor =
    sky === "night"
      ? 0.75
      : sky === "day"
        ? 1.6
        : sky === "morning"
          ? 1.3
          : sky === "evening"
            ? 1.1
            : 1;
  const weatherFactor =
    weather === "rain" || weather === "snow"
      ? 1.8
      : weather === "cloudy"
        ? 1.4
        : 1;
  return phaseFactor * weatherFactor;
}

/** 雨か雪が降っているか（<html data-weather> から読む）。降っている間は流れ星を出さない */
export function isPrecipitating(): boolean {
  if (typeof document === "undefined") return false;
  const { weather } = document.documentElement.dataset;
  return weather === "rain" || weather === "snow";
}

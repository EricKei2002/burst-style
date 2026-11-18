/**
 * 太陽高度と、それに合わせた空の色（連続的に変える）。
 * 参考: iconicllc.jp のキーフレーム（8° 昼 / 2.5° 夕方 / -0.5° 日没直後 / -4° 薄暮 / -8° 夜）と、
 * 日没後もしばらく夕方の色を残す（高度 3.5° 相当で保持）作り。
 */

import type { SkyPhase } from "./localSky";

const RAD = Math.PI / 180;

/**
 * 太陽高度（度）。NOAA の簡易式（誤差はおおむね 0.5° 以内）。
 * lat / lon は度（東経・北緯が正）。
 */
export function solarElevation(date: Date, lat: number, lon: number): number {
  const n = date.getTime() / 86_400_000 + 2440587.5 - 2451545.0;
  const meanLongitude = (280.46 + 0.9856474 * n) % 360;
  const meanAnomaly = ((357.528 + 0.9856003 * n) % 360) * RAD;
  const eclipticLongitude =
    (meanLongitude +
      1.915 * Math.sin(meanAnomaly) +
      0.02 * Math.sin(2 * meanAnomaly)) *
    RAD;
  const obliquity = (23.439 - 0.0000004 * n) * RAD;
  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude),
  );
  const declination = Math.asin(
    Math.sin(obliquity) * Math.sin(eclipticLongitude),
  );
  const gmstHours = (18.697374558 + 24.06570982441908 * n) % 24;
  const hourAngle = (gmstHours * 15 + lon) * RAD - rightAscension;
  const sinElevation =
    Math.sin(lat * RAD) * Math.sin(declination) +
    Math.cos(lat * RAD) * Math.cos(declination) * Math.cos(hourAngle);
  return Math.asin(Math.max(-1, Math.min(1, sinElevation))) / RAD;
}

/** 日没の高度（大気差と太陽の半径を含む） */
const SUNSET_ELEVATION = -0.833;
/** 夕方の色を保つ高度と、日没後に保つ時間（分）・そのあと夜へ移る時間（分） */
export const EVENING_HOLD_ELEVATION = 3.5;
export const EVENING_HOLD_MINUTES = 125;
const EVENING_RELEASE_MINUTES = 30;

export type SkyLook = {
  /** 色を決めるのに使う高度（日没後の保持を反映したもの） */
  elevation: number;
  /** 朝（太陽が昇っている）か */
  rising: boolean;
};

/** 日没（-0.833° を下向きに通過）から何分たったか。日没前・見つからなければ null */
function minutesSinceSunset(date: Date, lat: number, lon: number) {
  const t = date.getTime();
  for (let m = 0; m <= EVENING_HOLD_MINUTES + EVENING_RELEASE_MINUTES; m++) {
    const before = solarElevation(new Date(t - (m + 1) * 60_000), lat, lon);
    const after = solarElevation(new Date(t - m * 60_000), lat, lon);
    if (before >= SUNSET_ELEVATION && after < SUNSET_ELEVATION) return m;
  }
  return null;
}

/** 現在の位置と時刻から、空の色を決める高度を出す（日没後は夕方の色を少し長く残す） */
export function getSkyLook(date: Date, lat: number, lon: number): SkyLook {
  const elevation = solarElevation(date, lat, lon);
  const later = solarElevation(new Date(date.getTime() + 5 * 60_000), lat, lon);
  const rising = later > elevation;
  if (rising || elevation >= EVENING_HOLD_ELEVATION) {
    return { elevation, rising };
  }
  const sinceSunset = minutesSinceSunset(date, lat, lon);
  // 日没前（3.5° を下回ってから日没まで）と日没後 125 分は 3.5° 相当で保つ
  if (sinceSunset === null) {
    // 日没前、または日没から十分たった夜
    return elevation > SUNSET_ELEVATION
      ? { elevation: EVENING_HOLD_ELEVATION, rising }
      : { elevation, rising };
  }
  if (sinceSunset <= EVENING_HOLD_MINUTES) {
    return { elevation: EVENING_HOLD_ELEVATION, rising };
  }
  const t = (sinceSunset - EVENING_HOLD_MINUTES) / EVENING_RELEASE_MINUTES;
  return {
    elevation:
      EVENING_HOLD_ELEVATION + (elevation - EVENING_HOLD_ELEVATION) * t,
    rising,
  };
}

/** ?sky= の上書きや、位置が取れないときの時計ベースの段階を、高度に置き換える */
export function lookForPhase(phase: SkyPhase): SkyLook {
  switch (phase) {
    case "morning":
      return { elevation: 1, rising: true };
    case "day":
      return { elevation: 30, rising: true };
    case "evening":
      return { elevation: 2.5, rising: false };
    default:
      return { elevation: -20, rising: false };
  }
}

/** 色を決める高度から、data-sky に置く段階名を出す（流れ星の頻度などで使う） */
export function phaseForLook({ elevation, rising }: SkyLook): SkyPhase {
  if (elevation >= 8) return "day";
  if (elevation >= -4) return rising ? "morning" : "evening";
  return "night";
}

type Rgba = [number, number, number, number];
export type SkyPalette = {
  low: Rgba;
  mid: Rgba;
  wash: Rgba;
  star: number;
};
type Keyframe = [elevation: number, palette: SkyPalette];

const NIGHT: SkyPalette = {
  low: [40, 30, 90, 0],
  mid: [40, 30, 90, 0],
  wash: [40, 30, 90, 0],
  star: 1,
};
const DAY: SkyPalette = {
  low: [110, 170, 245, 0.3],
  mid: [80, 135, 225, 0.16],
  wash: [70, 120, 210, 0.1],
  star: 0.75,
};

/** 夕方側（太陽が沈んでいく）。高度の高い順 */
const EVENING_KEYFRAMES: Keyframe[] = [
  [8, DAY],
  [
    2.5,
    {
      low: [255, 128, 40, 0.34],
      mid: [150, 60, 190, 0.22],
      wash: [90, 40, 140, 0.06],
      star: 0.9,
    },
  ],
  [
    -0.5,
    {
      low: [235, 95, 60, 0.3],
      mid: [120, 50, 170, 0.2],
      wash: [70, 35, 120, 0.06],
      star: 0.92,
    },
  ],
  [
    -4,
    {
      low: [150, 60, 130, 0.2],
      mid: [70, 40, 140, 0.14],
      wash: [40, 30, 90, 0.05],
      star: 0.96,
    },
  ],
  [-8, NIGHT],
];

/** 朝側（太陽が昇っていく）。淡い青からピンク */
const MORNING_KEYFRAMES: Keyframe[] = [
  [8, DAY],
  [
    2.5,
    {
      low: [255, 185, 205, 0.24],
      mid: [140, 190, 255, 0.2],
      wash: [130, 180, 250, 0.07],
      star: 0.8,
    },
  ],
  [
    -0.5,
    {
      low: [255, 168, 205, 0.28],
      mid: [150, 196, 255, 0.2],
      wash: [150, 196, 255, 0.05],
      star: 0.85,
    },
  ],
  [
    -4,
    {
      low: [200, 140, 190, 0.18],
      mid: [110, 140, 220, 0.12],
      wash: [60, 70, 140, 0.04],
      star: 0.95,
    },
  ],
  [-8, NIGHT],
];

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRgba = (a: Rgba, b: Rgba, t: number): Rgba =>
  [0, 1, 2, 3].map((i) => mix(a[i], b[i], t)) as Rgba;

/** 高度から空の色を補間して出す（キーフレームの間は線形） */
export function paletteForLook({ elevation, rising }: SkyLook): SkyPalette {
  const frames = rising ? MORNING_KEYFRAMES : EVENING_KEYFRAMES;
  if (elevation >= frames[0][0]) return frames[0][1];
  for (let i = 0; i < frames.length - 1; i++) {
    const [hi, upper] = frames[i];
    const [lo, lower] = frames[i + 1];
    if (elevation >= lo) {
      const t = (hi - elevation) / (hi - lo);
      return {
        low: mixRgba(upper.low, lower.low, t),
        mid: mixRgba(upper.mid, lower.mid, t),
        wash: mixRgba(upper.wash, lower.wash, t),
        star: mix(upper.star, lower.star, t),
      };
    }
  }
  return NIGHT;
}

export function rgbaString([r, g, b, a]: Rgba): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a.toFixed(3)})`;
}

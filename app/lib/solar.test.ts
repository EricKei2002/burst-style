import assert from "node:assert/strict";
import {
  EVENING_HOLD_ELEVATION,
  getSkyLook,
  lookForPhase,
  paletteForLook,
  phaseForLook,
  solarElevation,
} from "./solar";

const TOKYO = { lat: 35.7, lon: 139.7 };
const close = (actual: number, expected: number, tol: number, label: string) =>
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `${label}: ${actual.toFixed(2)} (expected ${expected}±${tol})`,
  );

function testSolarElevation() {
  // 春分ごろの赤道・経度 0 の正午（UTC 12:07 ごろが南中）はほぼ真上
  close(
    solarElevation(new Date("2026-03-20T12:07:00Z"), 0, 0),
    90,
    1.5,
    "equator noon",
  );
  // 東京の夏至の南中（11:43 JST ごろ）は約 77.8°
  close(
    solarElevation(new Date("2026-06-21T02:43:00Z"), TOKYO.lat, TOKYO.lon),
    77.8,
    0.6,
    "tokyo solstice noon",
  );
  // 東京の冬至の南中は約 30.9°
  close(
    solarElevation(new Date("2026-12-22T02:39:00Z"), TOKYO.lat, TOKYO.lon),
    30.9,
    0.6,
    "tokyo winter noon",
  );
  // 真夜中は大きくマイナス
  assert.ok(
    solarElevation(new Date("2026-06-21T15:00:00Z"), TOKYO.lat, TOKYO.lon) <
      -20,
  );
  // 東京 2026-11-18 の日の入りは 16:31 JST ごろ（07:31Z）。前後で符号が変わる
  assert.ok(
    solarElevation(new Date("2026-11-18T07:20:00Z"), TOKYO.lat, TOKYO.lon) >
      -0.833,
  );
  assert.ok(
    solarElevation(new Date("2026-11-18T07:45:00Z"), TOKYO.lat, TOKYO.lon) <
      -0.833,
  );
}

function testEveningHold() {
  // 日没 1 時間後でも夕方の色（3.5° 相当）を保つ
  const hour = getSkyLook(
    new Date("2026-11-18T08:31:00Z"),
    TOKYO.lat,
    TOKYO.lon,
  );
  assert.equal(hour.elevation, EVENING_HOLD_ELEVATION);
  assert.equal(hour.rising, false);
  assert.equal(phaseForLook(hour), "evening");
  // 日没 4 時間後は夜
  const late = getSkyLook(
    new Date("2026-11-18T11:31:00Z"),
    TOKYO.lat,
    TOKYO.lon,
  );
  assert.equal(phaseForLook(late), "night");
  // 朝は保持しない（実際の高度のまま）
  const morning = getSkyLook(
    new Date("2026-11-18T21:30:00Z"),
    TOKYO.lat,
    TOKYO.lon,
  );
  assert.equal(morning.rising, true);
  assert.equal(phaseForLook(morning), "morning");
}

function testPalette() {
  // 夜は色を付けない、昼は青、夕方はオレンジ寄り
  assert.equal(paletteForLook(lookForPhase("night")).low[3], 0);
  assert.equal(paletteForLook(lookForPhase("day")).low[2], 245);
  const evening = paletteForLook(lookForPhase("evening"));
  assert.ok(evening.low[0] > evening.low[2]);
  // コントラストのため、下端の色の濃さは上限 0.34 を超えない
  for (let e = -10; e <= 40; e += 0.5) {
    for (const rising of [true, false]) {
      const p = paletteForLook({ elevation: e, rising });
      assert.ok(p.low[3] <= 0.34 + 1e-9, `alpha at ${e}`);
    }
  }
  // 連続している（0.1° の差で大きく跳ばない）
  const a = paletteForLook({ elevation: 2.55, rising: false });
  const b = paletteForLook({ elevation: 2.45, rising: false });
  assert.ok(Math.abs(a.low[3] - b.low[3]) < 0.01);
}

testSolarElevation();
testEveningHold();
testPalette();
console.log("solar.test.ts: ok");

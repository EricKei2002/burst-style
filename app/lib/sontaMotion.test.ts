import {
  BLINK_MAX_S,
  BLINK_MIN_S,
  linearToSrgb255,
  nextBlinkDelay,
  SONTA_GLB_URL,
  sontaDriftArea,
  sontaDriftPose,
} from "./sontaMotion";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(SONTA_GLB_URL === "/models/sonta_v3.glb", "shared GLB url");

// 瞬きの間隔は乱数の端でも範囲に収まる
assert(nextBlinkDelay(() => 0) === BLINK_MIN_S, "blink min");
assert(nextBlinkDelay(() => 0.999999) <= BLINK_MAX_S, "blink max");
assert(nextBlinkDelay(() => 2) === BLINK_MAX_S, "blink clamps high");
assert(nextBlinkDelay(() => -1) === BLINK_MIN_S, "blink clamps low");
for (let i = 0; i < 200; i++) {
  const d = nextBlinkDelay();
  assert(d >= BLINK_MIN_S && d <= BLINK_MAX_S, `blink random in range: ${d}`);
}

// GLB の色（線形）→ sRGB の期待値
assert(linearToSrgb255(0) === 0 && linearToSrgb255(1) === 255, "srgb ends");
const srgb = (rgb: number[]) => rgb.map(linearToSrgb255).join(",");
assert(
  srgb([0.9734452962875366, 0.9734452962875366, 0.8796223998069763]) ===
    "252,252,241",
  "M_Body",
);
assert(
  srgb([0.9734452962875366, 0.9822505712509155, 0.9301108717918396]) ===
    "252,253,247",
  "M_Cream",
);
assert(
  srgb([0.011612244881689548, 0.33716362714767456, 0.4564110338687897]) ===
    "28,157,180",
  "M_Button",
);

// 漂う位置は、横長でも縦長でも決めた範囲から出ない（長時間たどる）
for (const aspect of [16 / 9, 4 / 3, 390 / 844, 1]) {
  const area = sontaDriftArea(aspect);
  for (let t = 0; t < 600; t += 0.37) {
    const p = sontaDriftPose(t, aspect);
    assert(
      p.ndcX >= area.xMin - 1e-9 && p.ndcX <= area.xMax + 1e-9,
      `x in area (aspect ${aspect}, t ${t}): ${p.ndcX}`,
    );
    assert(
      p.ndcY >= area.yMin - 1e-9 && p.ndcY <= area.yMax + 1e-9,
      `y in area (aspect ${aspect}, t ${t}): ${p.ndcY}`,
    );
    assert(Math.abs(p.rotZ) <= 0.2, "gentle tilt");
  }
}

// 横長では本文（中央）を避けて右側、縦長は下側
assert(sontaDriftArea(16 / 9).xMin > 0.5, "wide stays on the right");
assert(sontaDriftArea(390 / 844).yMax < -0.5, "tall stays near the bottom");
assert(
  sontaDriftArea(390 / 844).height < sontaDriftArea(16 / 9).height,
  "smaller on mobile",
);

// 実際に動く（1.5 秒で位置が変わる）
const a = sontaDriftPose(10, 16 / 9);
const b = sontaDriftPose(11.5, 16 / 9);
assert(
  Math.hypot(a.ndcX - b.ndcX, a.ndcY - b.ndcY) > 0.005,
  "drift moves over time",
);

// 動きを減らす設定では時間によらず同じ姿勢
const r1 = sontaDriftPose(0, 16 / 9, true);
const r2 = sontaDriftPose(123.4, 16 / 9, true);
assert(JSON.stringify(r1) === JSON.stringify(r2), "reduced motion is static");

console.log("sontaMotion tests passed");

import {
  BLINK_MAX_S,
  BLINK_MIN_S,
  clampYaw,
  composeLook,
  createLookState,
  damp,
  linearToSrgb255,
  nextBlinkDelay,
  POINTER_PITCH_CAP,
  POINTER_YAW_CAP,
  pointerToLook,
  SONTA_BASE_PITCH,
  SONTA_BASE_YAW,
  SONTA_GLB_URL,
  SONTA_PITCH_MAX,
  SONTA_PITCH_MIN,
  SONTA_STATIC_LOOK,
  SONTA_YAW_LIMIT,
  sontaDriftArea,
  sontaDriftPose,
  stepLook,
  SWING_AMPLITUDE,
  SWING_PERIOD_S,
  swingOffset,
  THUMBS_CLIP_S,
  THUMBS_REST,
  thumbsUpEnvelope,
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

// 動きを減らす設定では時間によらず同じ姿勢（傾きもなし）
const r1 = sontaDriftPose(0, 16 / 9, true);
const r2 = sontaDriftPose(123.4, 16 / 9, true);
assert(JSON.stringify(r1) === JSON.stringify(r2), "reduced motion is static");
assert(r1.rotX === 0 && r1.rotZ === 0, "reduced has no wobble");

// ---- 向き ----
const DEG = Math.PI / 180;
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;

// 基本は斜め（25〜30°）、上限は 45° 前後。基本＋スイングは上限の内側
assert(
  SONTA_BASE_YAW >= 25 * DEG && SONTA_BASE_YAW <= 30 * DEG,
  "oblique base",
);
assert(near(SONTA_YAW_LIMIT, 45 * DEG), "yaw limit 45°");
assert(SONTA_BASE_YAW + SWING_AMPLITUDE <= SONTA_YAW_LIMIT, "swing fits");
assert(SONTA_BASE_PITCH >= 5 * DEG && SONTA_BASE_PITCH <= 10 * DEG, "pitch");

// clampYaw は極端な値・数でない値でも上限を超えない
for (const v of [1e9, -1e9, Infinity, -Infinity, NaN, 3, -3, 0.2]) {
  const c = clampYaw(v);
  assert(Math.abs(c) <= SONTA_YAW_LIMIT, `clampYaw(${v}) = ${c}`);
}
assert(clampYaw(0.2) === 0.2, "clampYaw passes small values");
assert(clampYaw(NaN) === SONTA_BASE_YAW, "clampYaw NaN → base");

// スイング：±振幅、周期どおり、両端で止まる（正弦）
assert(near(swingOffset(0), 0), "swing starts at base");
assert(near(swingOffset(SWING_PERIOD_S / 4), SWING_AMPLITUDE), "swing max");
assert(near(swingOffset((SWING_PERIOD_S * 3) / 4), -SWING_AMPLITUDE), "min");
assert(near(swingOffset(SWING_PERIOD_S * 5), 0, 1e-9), "swing periodic");
for (let t = 0; t < 40; t += 0.13) {
  assert(Math.abs(swingOffset(t)) <= SWING_AMPLITUDE + 1e-12, "swing bound");
}

// ポインター → 角度：右なら右（正）、上なら上を向く（pitch は負）。外側は頭打ち
assert(pointerToLook(1, 0).yaw === POINTER_YAW_CAP, "pointer right");
assert(pointerToLook(-50, 0).yaw === -POINTER_YAW_CAP, "pointer far left");
assert(pointerToLook(0, 1).pitch === -POINTER_PITCH_CAP, "pointer up");
assert(pointerToLook(0, -9).pitch === POINTER_PITCH_CAP, "pointer down");
assert(pointerToLook(NaN, NaN).yaw === 0, "pointer NaN");

// 減衰：フレームレートによらない（60fps×60 と 15fps×15 でほぼ同じ）
{
  let a60 = 0;
  for (let i = 0; i < 60; i++) a60 = damp(a60, 1, 4, 1 / 60);
  let a15 = 0;
  for (let i = 0; i < 15; i++) a15 = damp(a15, 1, 4, 1 / 15);
  assert(near(a60, a15, 1e-9), `damp fps independent ${a60} ${a15}`);
  assert(near(a60, 1 - Math.exp(-4), 1e-9), "damp closed form");
  assert(damp(0.3, 1, 4, 0) === 0.3 && damp(0.3, 1, 4, NaN) === 0.3, "dt 0");
}

// 極端な入力を長く与えても、体・頭とも ±45° を超えない
{
  const extremes = [
    { nx: 1e6, ny: 1e6 },
    { nx: -1e6, ny: -1e6 },
    { nx: Infinity, ny: -Infinity },
    { nx: NaN, ny: NaN },
    { nx: 1, ny: 0 },
    { nx: -1, ny: 0 },
    null,
  ];
  for (const twist of [0, -12 * DEG, 10, -10, NaN]) {
    for (const dt of [1 / 120, 1 / 15, 0.5, 5]) {
      const s = createLookState();
      for (let i = 0; i < 400; i++) {
        const pointer = extremes[i % extremes.length];
        const l = stepLook(
          s,
          { t: i * 0.37, pointer, twist, thumbs: (i % 7) / 3 },
          dt,
        );
        const what = `twist ${twist} dt ${dt} i ${i}`;
        assert(Math.abs(l.bodyYaw) <= SONTA_YAW_LIMIT + 1e-12, `body ${what}`);
        assert(
          Math.abs(l.bodyYaw + l.headYaw) <= SONTA_YAW_LIMIT + 1e-12,
          `head ${what}`,
        );
        assert(
          l.pitch >= SONTA_PITCH_MIN - 1e-12 &&
            l.pitch <= SONTA_PITCH_MAX + 1e-12,
          `pitch ${what}`,
        );
        assert(Number.isFinite(l.headPitch), `head pitch ${what}`);
      }
    }
  }
  // 壊れた state を直接渡しても上限を超えない
  const broken = composeLook(
    { yaw: 1e9, pitch: -1e9, weight: 1e9 },
    { t: 2, twist: 1e9, thumbs: 1 },
  );
  assert(Math.abs(broken.bodyYaw) <= SONTA_YAW_LIMIT, "broken body");
  assert(Math.abs(broken.bodyYaw + broken.headYaw) <= SONTA_YAW_LIMIT, "head");
}

// 追従：マウスを右に置き続けると右（上限）へ、離すと基本＋スイングへ戻る
{
  const s = createLookState();
  let l = stepLook(s, { t: 0, pointer: null }, 1 / 60);
  assert(near(l.bodyYaw, SONTA_BASE_YAW, 1e-6), "starts at base");
  for (let i = 0; i < 180; i++) {
    l = stepLook(s, { t: 0, pointer: { nx: -1, ny: 0 } }, 1 / 60);
  }
  // 左（画面の左）へ向く：基本 27° − 18° ≒ 9°（正面寄り）。頭はさらに左
  assert(l.bodyYaw < SONTA_BASE_YAW - 15 * DEG, `follows left: ${l.bodyYaw}`);
  assert(l.headYaw < 0, "head turns further than body");
  for (let i = 0; i < 180; i++) {
    l = stepLook(s, { t: 0, pointer: { nx: 1, ny: 1 } }, 1 / 60);
  }
  assert(near(l.bodyYaw, SONTA_YAW_LIMIT, 1e-6), "right is clamped to 45°");
  assert(l.pitch < SONTA_BASE_PITCH, "looks up");
  for (let i = 0; i < 600; i++) {
    l = stepLook(s, { t: 0, pointer: null }, 1 / 60);
  }
  assert(s.weight < 0.01, `eases back: ${s.weight}`);
  assert(near(l.bodyYaw, SONTA_BASE_YAW, 0.01), "back to base");
}

// 動きを減らす設定の姿勢は斜め（正面ではない）
assert(SONTA_STATIC_LOOK.bodyYaw === SONTA_BASE_YAW, "static is oblique");
assert(SONTA_STATIC_LOOK.bodyYaw > 20 * DEG, "static is not frontal");

// ---- サムズアップの強調 ----
assert(thumbsUpEnvelope(null) === THUMBS_REST, "rest when not playing");
assert(thumbsUpEnvelope(0) === THUMBS_REST, "rest at 0");
assert(thumbsUpEnvelope(THUMBS_CLIP_S) === THUMBS_REST, "rest at end");
assert(thumbsUpEnvelope(NaN) === THUMBS_REST, "rest at NaN");
{
  let maxHop = 0;
  let maxAmount = 0;
  let prev = thumbsUpEnvelope(0);
  for (let t = 0; t <= THUMBS_CLIP_S; t += 0.005) {
    const e = thumbsUpEnvelope(t);
    maxHop = Math.max(maxHop, e.hop);
    maxAmount = Math.max(maxAmount, e.amount);
    assert(e.squashY > 0.9 && e.squashY < 1.1, `subtle squash ${t}`);
    assert(e.hop >= 0, "never below the floor");
    // 途切れない（5ms でほとんど変わらない）
    assert(Math.abs(e.hop - prev.hop) < 0.005, `hop continuous ${t}`);
    assert(Math.abs(e.twist - prev.twist) < 0.01, `twist continuous ${t}`);
    prev = e;
  }
  assert(maxHop > 0.06 && maxAmount > 0.99, "visible hop and full amount");
  // 腕を上げて保つ 0.6〜1.4 秒は効きが最大
  assert(thumbsUpEnvelope(1).amount > 0.99, "holds during the pose");
  // 1.95 秒（終わる直前）にはほぼ何も足さない → Idle へなめらかに戻る
  const late = thumbsUpEnvelope(1.95);
  assert(late.amount < 1e-6 && late.hop === 0, "settles before the end");
}

console.log("sontaMotion tests passed");

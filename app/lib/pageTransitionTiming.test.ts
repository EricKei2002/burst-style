import assert from "node:assert/strict";
import {
  SHADER_NAVIGATE_AFTER_CLOSE_MS,
  SHADER_OPEN_PAUSE_MS,
  SHADER_OPEN_TO_IDLE_MS,
  SHADER_WARP_CLOSE_MS,
  SHADER_WARP_OPEN_MS,
  navigateDelayFor,
  pickPageTransitionOverlay,
} from "./pageTransitionTiming";

function testOverlayChoice() {
  assert.equal(
    pickPageTransitionOverlay({ shaderReady: true, reducedMotion: false }),
    "shader",
  );
  // 動きを減らす設定ではシェーダーを使わない
  assert.equal(
    pickPageTransitionOverlay({ shaderReady: true, reducedMotion: true }),
    "none",
  );
  // 未読み込み・WebGL 不可・コンテキスト喪失は覆わずに切り替える
  assert.equal(
    pickPageTransitionOverlay({ shaderReady: false, reducedMotion: false }),
    "none",
  );
}

function testDelays() {
  assert.equal(navigateDelayFor("none"), 0);
  assert.equal(navigateDelayFor("shader"), SHADER_NAVIGATE_AFTER_CLOSE_MS);
  // 覆い切ってから router.push する
  assert.ok(SHADER_NAVIGATE_AFTER_CLOSE_MS >= SHADER_WARP_CLOSE_MS);
  assert.ok(SHADER_OPEN_TO_IDLE_MS >= SHADER_WARP_OPEN_MS);
  assert.ok(SHADER_WARP_CLOSE_MS >= 1200 && SHADER_WARP_CLOSE_MS <= 1500);
  assert.ok(SHADER_OPEN_PAUSE_MS >= 200 && SHADER_OPEN_PAUSE_MS <= 400);
  assert.ok(SHADER_WARP_OPEN_MS >= 1000 && SHADER_WARP_OPEN_MS <= 1500);
}

testOverlayChoice();
testDelays();
console.log("pageTransitionTiming.test.ts: ok");

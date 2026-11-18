import assert from "node:assert/strict";
import {
  HANGAR_DOOR_CLOSE_MS,
  HANGAR_NAVIGATE_AFTER_CLOSE_MS,
  HANGAR_OPEN_PAUSE_MS,
  HANGAR_OPEN_TO_IDLE_MS,
} from "./hangarTransitionTiming";

/** Node 上でタイミング定数の整合だけ検証（再現計測は scripts/measure-project-transition.mjs） */
function testHangarTimingRelationships() {
  assert.ok(HANGAR_NAVIGATE_AFTER_CLOSE_MS > HANGAR_DOOR_CLOSE_MS);
  assert.ok(HANGAR_OPEN_TO_IDLE_MS >= HANGAR_DOOR_CLOSE_MS);
  assert.ok(
    HANGAR_OPEN_PAUSE_MS > 0 && HANGAR_OPEN_PAUSE_MS < HANGAR_DOOR_CLOSE_MS,
  );
}

testHangarTimingRelationships();
console.log("spaceshipVideoPreload.test.ts: ok");

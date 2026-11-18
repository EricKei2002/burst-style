import assert from "node:assert/strict";
import { getSkyPhase, mapWeatherCode } from "./localSky";

function testSkyPhase() {
  assert.equal(getSkyPhase(4), "night");
  assert.equal(getSkyPhase(5), "morning");
  assert.equal(getSkyPhase(10), "day");
  assert.equal(getSkyPhase(17), "evening");
  assert.equal(getSkyPhase(20), "night");
}

function testWeatherCode() {
  assert.equal(mapWeatherCode(0, 10), "clear");
  assert.equal(mapWeatherCode(1, 80), "cloudy");
  assert.equal(mapWeatherCode(3, null), "cloudy");
  assert.equal(mapWeatherCode(45, null), "cloudy");
  assert.equal(mapWeatherCode(61, null), "rain");
  assert.equal(mapWeatherCode(81, null), "rain");
  assert.equal(mapWeatherCode(95, null), "rain");
  assert.equal(mapWeatherCode(73, null), "snow");
  assert.equal(mapWeatherCode(86, null), "snow");
}

testSkyPhase();
testWeatherCode();
console.log("localSky.test.ts: ok");

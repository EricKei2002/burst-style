import assert from "node:assert/strict";
import {
  hashForSection,
  sectionFromHash,
  sectionFromLocation,
} from "./homeSections";

function testSectionFromHash() {
  assert.equal(sectionFromHash(""), "home");
  assert.equal(sectionFromHash("#"), "home");
  assert.equal(sectionFromHash("#top"), "home");
  assert.equal(sectionFromHash("#now"), "home");
  assert.equal(sectionFromHash("#projects"), "projects");
  assert.equal(sectionFromHash("#About"), "about");
  assert.equal(sectionFromHash("#about-lab-todo"), "about");
  assert.equal(sectionFromHash("#contact"), "contact");
  assert.equal(sectionFromHash("#name"), null);
  assert.equal(sectionFromHash("#%E0%A4%A"), null);
}

function testSectionFromLocation() {
  assert.equal(sectionFromLocation("", ""), "home");
  assert.equal(sectionFromLocation("#about", "?section=contact"), "about");
  assert.equal(sectionFromLocation("", "?section=contact"), "contact");
  assert.equal(sectionFromLocation("", "?sky=evening&weather=rain"), "home");
}

function testHashForSection() {
  assert.equal(hashForSection("home"), "");
  assert.equal(hashForSection("projects"), "#projects");
}

testSectionFromHash();
testSectionFromLocation();
testHashForSection();
console.log("homeSections.test.ts: ok");

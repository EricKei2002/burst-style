import assert from "node:assert/strict";
import {
  adjacentSection,
  hashForSection,
  sectionFromDigit,
  sectionPageLabel,
  swipeDirection,
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
  assert.equal(sectionFromHash("#projects-index"), "projects");
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

function testNavigationHelpers() {
  assert.equal(adjacentSection("home", -1), "home");
  assert.equal(adjacentSection("home", 1), "projects");
  assert.equal(adjacentSection("contact", 1), "contact");
  assert.equal(adjacentSection("about", -1), "projects");
  assert.equal(sectionFromDigit("1"), "home");
  assert.equal(sectionFromDigit("4"), "contact");
  assert.equal(sectionFromDigit("5"), null);
  assert.equal(sectionFromDigit("0"), null);
  assert.equal(sectionFromDigit("a"), null);
  assert.equal(sectionPageLabel("projects"), "02/04");
  assert.equal(swipeDirection(-120, 10, 300), 1);
  assert.equal(swipeDirection(120, 10, 300), -1);
  assert.equal(swipeDirection(-120, 80, 300), null);
  assert.equal(swipeDirection(-40, 0, 300), null);
  assert.equal(swipeDirection(-120, 0, 1200), null);
}

testSectionFromHash();
testNavigationHelpers();
testSectionFromLocation();
testHashForSection();
console.log("homeSections.test.ts: ok");

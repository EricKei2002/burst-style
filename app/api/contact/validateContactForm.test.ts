import assert from "node:assert/strict";
import {
  CONTACT_LIMITS,
  validateContactForm,
} from "./validateContactForm";

function testRejectsEmptyFields() {
  const result = validateContactForm({
    name: "   ",
    email: "",
    message: "\n",
    locale: "en",
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.fieldErrors.name);
  assert.ok(result.fieldErrors.email);
  assert.ok(result.fieldErrors.message);
}

function testAcceptsValidPayload() {
  const result = validateContactForm({
    name: "Eric Kei",
    email: "user@example.com",
    message: "Hello there",
    locale: "ja",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.name, "Eric Kei");
  assert.equal(result.data.email, "user@example.com");
  assert.equal(result.data.message, "Hello there");
}

function testRejectsInvalidEmail() {
  const result = validateContactForm({
    name: "Test",
    email: "not-an-email",
    message: "Hi",
    locale: "ja",
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.fieldErrors.email);
  assert.match(result.fieldErrors.email!, /メール/);
}

function testRejectsOverlongMessage() {
  const result = validateContactForm({
    name: "Test",
    email: "a@b.co",
    message: "x".repeat(CONTACT_LIMITS.messageMax + 1),
    locale: "en",
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.fieldErrors.message);
}

testRejectsEmptyFields();
testAcceptsValidPayload();
testRejectsInvalidEmail();
testRejectsOverlongMessage();
console.log("validateContactForm.test.ts: ok");
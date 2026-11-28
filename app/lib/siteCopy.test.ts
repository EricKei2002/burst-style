import assert from "node:assert/strict";
import { HOME_SECTIONS } from "./homeSections";
import { buildSiteCopy } from "./siteCopy";

// スマホでは tagline1 と tagline2 の間の <br> が出ない。英語は空白でつなぎ、和文は句点の後に空けない
const en = buildSiteCopy("en").hero;
const ja = buildSiteCopy("ja").hero;

assert.equal(en.taglineSeparator, " ");
assert.equal(ja.taglineSeparator, "");
assert.ok(
  (en.tagline1 + en.taglineSeparator + en.tagline2).includes("experiences. As"),
  "EN: sentences are separated by a space",
);
assert.ok(
  (ja.tagline1 + ja.taglineSeparator + ja.tagline2).includes("形にする。Web"),
  "JA: no space after the full stop",
);

// ヘッダーと下部タブの項目はセクション（キー 1〜4・番号 01/04）と一対一。作品一覧への項目は置かない
for (const locale of ["en", "ja"] as const) {
  assert.deepEqual(
    Object.keys(buildSiteCopy(locale).header.tabShort),
    [...HOME_SECTIONS],
    `${locale}: one tab per section`,
  );
}

console.log("siteCopy tests passed");

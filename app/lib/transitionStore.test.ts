import assert from "node:assert/strict";
import { beginLeaveTransition, useTransitionStore } from "./store";

// ブラウザの window のうち、遷移の待機が使う分だけを用意する
Object.assign(globalThis, { window: { setTimeout, clearTimeout } });

async function main() {
  // 待っている途中で WebGL 不可が分かったら、timeout を待たずに覆わず進む
  let startedAt = Date.now();
  const pending = beginLeaveTransition();
  useTransitionStore.getState().setShaderUnavailable();
  assert.equal(await pending, 0);
  assert.ok(Date.now() - startedAt < 500, "resolves without the 1s wait");
  assert.equal(useTransitionStore.getState().overlay, "none");

  // 分かったあとの遷移は最初から待たない
  startedAt = Date.now();
  assert.equal(await beginLeaveTransition(), 0);
  assert.ok(Date.now() - startedAt < 500, "later navigations do not wait");

  console.log("transitionStore tests passed");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

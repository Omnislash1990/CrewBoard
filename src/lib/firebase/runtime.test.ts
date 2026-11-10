import assert from "node:assert/strict";
import test from "node:test";
import { canUsePersistentFirestoreCache } from "./runtime.ts";

test("persistent Firestore cache stays off outside the browser", () => {
  assert.equal(typeof window, "undefined");
  assert.equal(canUsePersistentFirestoreCache(), false);
});

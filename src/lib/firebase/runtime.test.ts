import assert from "node:assert/strict";
import test from "node:test";
import { canUsePersistentFirestoreCache } from "./runtime.ts";

test("Firestore persistence stays off during SSR", () => {
  assert.equal(typeof window, "undefined");
  assert.equal(canUsePersistentFirestoreCache(), false);
});

test("Firestore persistence is on only when window and IndexedDB exist", () => {
  const previousWindow = globalThis.window;
  const previousIndexedDb = globalThis.indexedDB;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  });
  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    value: {},
  });

  try {
    assert.equal(canUsePersistentFirestoreCache(), true);

    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: undefined,
    });
    assert.equal(canUsePersistentFirestoreCache(), false);
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: previousWindow,
    });
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: previousIndexedDb,
    });
  }
});

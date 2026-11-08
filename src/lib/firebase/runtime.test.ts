import assert from "node:assert/strict";
import test from "node:test";
import { canUsePersistentFirestoreCache } from "./runtime.ts";

test("Firestore persistence is on only in a browser with IndexedDB", () => {
  assert.equal(typeof window, "undefined");
  assert.equal(canUsePersistentFirestoreCache(), false);

  const globals = globalThis as typeof globalThis & {
    window?: unknown;
    indexedDB?: unknown;
  };
  const hadWindow = Object.hasOwn(globals, "window");
  const hadIndexedDb = Object.hasOwn(globals, "indexedDB");
  const previousWindow = globals.window;
  const previousIndexedDb = globals.indexedDB;

  function restore(name: "window" | "indexedDB", had: boolean, previous: unknown) {
    if (!had) {
      delete globals[name];
      return;
    }
    Object.defineProperty(globals, name, {
      configurable: true,
      writable: true,
      value: previous,
    });
  }

  try {
    Object.defineProperty(globals, "window", {
      configurable: true,
      writable: true,
      value: {},
    });
    Object.defineProperty(globals, "indexedDB", {
      configurable: true,
      writable: true,
      value: {},
    });
    assert.equal(canUsePersistentFirestoreCache(), true);

    Object.defineProperty(globals, "indexedDB", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    assert.equal(canUsePersistentFirestoreCache(), false);

    Object.defineProperty(globals, "indexedDB", {
      configurable: true,
      get() {
        throw new Error("indexedDB blocked");
      },
    });
    assert.equal(canUsePersistentFirestoreCache(), false);
  } finally {
    restore("window", hadWindow, previousWindow);
    restore("indexedDB", hadIndexedDb, previousIndexedDb);
  }
});

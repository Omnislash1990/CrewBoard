import assert from "node:assert/strict";
import test from "node:test";
import { canonicalRole } from "./roles.ts";

test("only an admin role stays an admin", () => {
  assert.equal(canonicalRole("admin"), "admin");
  assert.equal(canonicalRole(" Admin "), "admin");
  assert.equal(canonicalRole("ADMIN"), "admin");
});

test("missing or non-admin roles are workers", () => {
  assert.equal(canonicalRole("worker"), "worker");
  assert.equal(canonicalRole("Worker"), "worker");
  assert.equal(canonicalRole("worker "), "worker");
  assert.equal(canonicalRole(""), "worker");
  assert.equal(canonicalRole(undefined), "worker");
  assert.equal(canonicalRole(null), "worker");
});

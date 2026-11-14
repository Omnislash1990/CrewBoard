import assert from "node:assert/strict";
import test from "node:test";
import type { JobPart } from "@/types";
import { mergePartProgress, partsWaitingForReview } from "./parts.ts";

function part(overrides: Partial<JobPart> = {}): JobPart {
  return {
    id: "part-1",
    trade: "Carpenters",
    assignedWorkerIds: ["worker-1"],
    status: "open",
    completedBy: "",
    ...overrides,
  };
}

test("a completion on the server is kept when the form is still open", () => {
  const merged = mergePartProgress(
    part(),
    part({ status: "completed", completedBy: "worker-1" }),
  );
  assert.equal(merged.status, "completed");
  assert.equal(merged.completedBy, "worker-1");
});

test("an office review is not overwritten by a stale completed part", () => {
  const merged = mergePartProgress(
    part({ status: "completed", completedBy: "worker-1" }),
    part({ status: "reviewed", completedBy: "worker-1" }),
  );
  assert.equal(merged.status, "reviewed");
});

test("changing the crew keeps the office copy", () => {
  const merged = mergePartProgress(
    part({ assignedWorkerIds: ["worker-2"] }),
    part({ status: "completed", completedBy: "worker-1" }),
  );
  assert.equal(merged.status, "open");
  assert.deepEqual(merged.assignedWorkerIds, ["worker-2"]);
});

test("waiting for review means completed and not yet reviewed", () => {
  const waiting = partsWaitingForReview([
    part({ id: "a", status: "completed" }),
    part({ id: "b", status: "reviewed" }),
    part({ id: "c", status: "open" }),
  ]);
  assert.deepEqual(
    waiting.map((item) => item.id),
    ["a"],
  );
});

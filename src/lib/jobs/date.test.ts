import assert from "node:assert/strict";
import test from "node:test";
import {
  compareJobsByDate,
  formatJobDate,
  isJobDate,
  jobDateFromDate,
  parseJobDate,
  todayJobDate,
} from "./date.ts";

test("a job date is a real YYYY-MM-DD day", () => {
  assert.equal(isJobDate("2026-11-02"), true);
  assert.equal(isJobDate("2026-02-31"), false);
  assert.equal(isJobDate("02/11/2026"), false);
  assert.equal(isJobDate("2026-11-2"), false);
  assert.equal(parseJobDate("2026-02-31"), null);
  const parsed = parseJobDate("2026-11-02");
  assert.ok(parsed);
  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 10);
  assert.equal(parsed.getDate(), 2);
});

test("today and a stored instant use the local calendar day", () => {
  const afternoon = new Date(2026, 10, 14, 18, 30);
  assert.equal(todayJobDate(afternoon), "2026-11-14");
  assert.equal(jobDateFromDate(new Date(2026, 0, 15, 23, 30)), "2026-01-15");
});

test("cards show the chosen date in en-GB and fall back when it is missing", () => {
  const added = new Date(2026, 0, 15, 9, 0);
  assert.equal(formatJobDate("2026-11-02", added), "2 Nov 2026");
  assert.equal(formatJobDate("", added), "15 Jan 2026");
  assert.equal(formatJobDate("2026-02-31", added), "15 Jan 2026");
});

test("jobs sort by the chosen date, then by when they were added", () => {
  const older = {
    jobDate: "",
    createdAt: new Date(2026, 0, 15),
  };
  const november = {
    jobDate: "2026-11-02",
    createdAt: new Date(2026, 10, 1),
  };
  const laterSameDay = {
    jobDate: "2026-11-02",
    createdAt: new Date(2026, 10, 14),
  };
  const sorted = [older, november, laterSameDay].sort(compareJobsByDate);
  assert.deepEqual(
    sorted.map((job) => job.createdAt.getDate()),
    [14, 1, 15],
  );
});

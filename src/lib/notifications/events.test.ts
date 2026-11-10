import assert from "node:assert/strict";
import test from "node:test";
import {
  draftsForDeletedJob,
  draftsForJobUpdate,
  draftsForNewJob,
  type JobNotice,
} from "./events.ts";

const base: JobNotice = {
  client: "Hargreaves",
  title: "Bathroom reinstatement",
  duration: "3h",
  notes: "Escape of water",
  status: "assigned",
  assignedWorkerIds: ["worker-1"],
};

test("a new job notifies each assigned worker once", () => {
  const drafts = draftsForNewJob("job-1", {
    ...base,
    assignedWorkerIds: ["worker-1", "worker-1", "worker-2"],
  });
  assert.deepEqual(
    drafts.map((draft) => draft.userId),
    ["worker-1", "worker-2"],
  );
  assert.equal(drafts[0]?.kind, "job_assigned");
  assert.match(drafts[0]?.body ?? "", /Bathroom reinstatement/);
});

test("an edit tells new, remaining, and removed crew different things", () => {
  const drafts = draftsForJobUpdate(
    "job-1",
    base,
    {
      ...base,
      title: "Bathroom ceiling",
      assignedWorkerIds: ["worker-2"],
    },
  );
  assert.deepEqual(
    drafts.map((draft) => [draft.userId, draft.kind]),
    [
      ["worker-2", "job_assigned"],
      ["worker-1", "job_unassigned"],
    ],
  );
});

test("a content change notifies people who stayed on the job", () => {
  const drafts = draftsForJobUpdate("job-1", base, {
    ...base,
    notes: "Bring boards",
  });
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0]?.kind, "job_updated");
  assert.equal(drafts[0]?.userId, "worker-1");
});

test("deleting a job notifies the crew who had it", () => {
  const drafts = draftsForDeletedJob("job-1", base);
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0]?.kind, "job_removed");
  assert.match(drafts[0]?.title ?? "", /Hargreaves/);
});

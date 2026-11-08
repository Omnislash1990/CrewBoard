import assert from "node:assert/strict";
import test from "node:test";
import { parseCreateJobRequest } from "./create-job-request.ts";

test("accepts a job title, client, and worker ids", () => {
  const result = parseCreateJobRequest({
    jobTitle: "  Bathroom reinstatement  ",
    client: " Hargreaves ",
    workerIds: [" uid-1 ", "uid-1", "uid-2"],
    duration: "ignored",
  });

  assert.deepEqual(result, {
    ok: true,
    job: {
      jobTitle: "Bathroom reinstatement",
      client: "Hargreaves",
      workerIds: ["uid-1", "uid-2"],
    },
  });
});

test("allows a job with no assigned workers", () => {
  const result = parseCreateJobRequest({
    jobTitle: "Survey",
    client: "North",
    workerIds: [],
  });

  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.job.workerIds, []);
});

test("rejects a missing or non-object body", () => {
  for (const body of [null, undefined, [], "job", 1]) {
    const result = parseCreateJobRequest(body);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /JSON object/);
    }
  }
});

test("rejects a missing or blank job title and client", () => {
  assert.equal(
    parseCreateJobRequest({ client: "Hargreaves", workerIds: [] }).ok,
    false,
  );
  const title = parseCreateJobRequest({
    jobTitle: "   ",
    client: "Hargreaves",
    workerIds: [],
  });
  assert.equal(title.ok, false);
  if (!title.ok) assert.match(title.error, /jobTitle/);

  const client = parseCreateJobRequest({
    jobTitle: "Survey",
    client: 12,
    workerIds: [],
  });
  assert.equal(client.ok, false);
  if (!client.ok) assert.match(client.error, /client/);
});

test("rejects workerIds that are not an array of strings", () => {
  for (const workerIds of [undefined, "uid-1", { id: "uid-1" }, [1], ["ok", ""], [null]]) {
    const result = parseCreateJobRequest({
      jobTitle: "Survey",
      client: "North",
      workerIds,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "workerIds must be an array of strings.");
  }
});

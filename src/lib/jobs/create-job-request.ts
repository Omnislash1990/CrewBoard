export type CreateJobRequest = {
  jobTitle: string;
  client: string;
  workerIds: string[];
};

export type CreateJobRequestResult =
  | { ok: true; job: CreateJobRequest }
  | { ok: false; error: string };

const OBJECT_ERROR =
  "Request body must be a JSON object with jobTitle, client, and workerIds.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredText(
  value: unknown,
  field: "jobTitle" | "client",
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, error: `${field} must be a non-empty string.` };
  }
  return { ok: true, value: value.trim() };
}

function workerIdsFrom(
  value: unknown,
): { ok: true; value: string[] } | { ok: false; error: string } {
  if (!Array.isArray(value)) {
    return { ok: false, error: "workerIds must be an array of strings." };
  }

  const ids: string[] = [];
  for (const id of value) {
    if (typeof id !== "string" || id.trim().length === 0) {
      return { ok: false, error: "workerIds must be an array of strings." };
    }
    const trimmed = id.trim();
    if (!ids.includes(trimmed)) ids.push(trimmed);
  }
  return { ok: true, value: ids };
}

/** Validate the POST /api/notify-worker body. Does not write to Firestore. */
export function parseCreateJobRequest(body: unknown): CreateJobRequestResult {
  if (!isRecord(body)) {
    return { ok: false, error: OBJECT_ERROR };
  }

  const jobTitle = requiredText(body.jobTitle, "jobTitle");
  if (!jobTitle.ok) return jobTitle;

  const client = requiredText(body.client, "client");
  if (!client.ok) return client;

  const workerIds = workerIdsFrom(body.workerIds);
  if (!workerIds.ok) return workerIds;

  return {
    ok: true,
    job: {
      jobTitle: jobTitle.value,
      client: client.value,
      workerIds: workerIds.value,
    },
  };
}

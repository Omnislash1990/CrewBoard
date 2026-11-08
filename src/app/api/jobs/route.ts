import { parseCreateJobRequest } from "@/lib/jobs/create-job-request";

/**
 * POST /api/jobs
 *
 * Body: `{ jobTitle: string, client: string, workerIds: string[] }`
 *
 * The admin Toggl paste screen still saves through the browser Firestore
 * client (`createJob`). This route only checks the HTTP contract. It does not
 * import that client, and it does not open a persistent local cache.
 *
 * Stephen must add Firebase Admin credentials before this route can persist
 * jobs. Do not commit a service account for that.
 */
const NOT_PERSISTED =
  "Validated the job. This server cannot write to Firestore without Firebase Admin credentials. The admin Toggl paste screen still saves jobs in the browser.";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error:
          "Request body must be a JSON object with jobTitle, client, and workerIds.",
      },
      { status: 400 },
    );
  }

  const parsed = parseCreateJobRequest(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  return Response.json(
    {
      jobTitle: parsed.job.jobTitle,
      client: parsed.job.client,
      workerIds: parsed.job.workerIds,
      persisted: false,
      message: NOT_PERSISTED,
    },
    { status: 202 },
  );
}

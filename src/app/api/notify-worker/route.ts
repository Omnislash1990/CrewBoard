import { NextResponse } from "next/server";
import { parseCreateJobRequest } from "@/lib/jobs/create-job-request";

/**
 * POST /api/notify-worker
 *
 * Body: `{ jobTitle: string, client: string, workerIds: string[] }`
 *
 * The job is already stored in Firestore by the browser. This route only
 * logs the dispatch so a later webhook or SMS call can be added here.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Request body must be a JSON object with jobTitle, client, and workerIds.",
      },
      { status: 400 },
    );
  }

  const parsed = parseCreateJobRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  console.log(parsed.job);
  // Paste a fetch to a Make.com webhook or Twilio API here when dispatch
  // notifications are ready.

  return NextResponse.json({ ok: true });
}

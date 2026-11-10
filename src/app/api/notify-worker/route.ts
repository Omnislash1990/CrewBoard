import { NextResponse } from "next/server";
import { bearerToken } from "@/lib/auth/bearer";
import { verifyFirebaseIdToken } from "@/lib/auth/verify-id-token";
import { readEmailConfig, sendNotificationEmail } from "@/lib/notifications/email";
import { readStoredUser } from "@/lib/notifications/firestore-rest";
import { parseNotifyRequest } from "@/lib/notifications/request";

export const runtime = "nodejs";

/**
 * Sends optional crew email. The session cookie is ignored. In-app alerts are
 * written by the signed-in admin client and checked by Firestore rules.
 */
export async function POST(request: Request) {
  const token = bearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json(
      { error: "A Firebase ID token is required." },
      { status: 401 },
    );
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    return NextResponse.json(
      { error: "Firebase project is not configured." },
      { status: 500 },
    );
  }

  let uid: string;
  try {
    uid = (await verifyFirebaseIdToken(token, projectId)).uid;
  } catch {
    return NextResponse.json(
      { error: "The Firebase ID token was rejected." },
      { status: 401 },
    );
  }

  let caller: Awaited<ReturnType<typeof readStoredUser>>;
  try {
    caller = await readStoredUser(projectId, uid, token);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not check the caller profile." },
      { status: 403 },
    );
  }
  if (caller?.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access is required." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Expected a notifications list." },
      { status: 400 },
    );
  }
  const parsed = parseNotifyRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const emailConfig = readEmailConfig(process.env);
  if (!emailConfig) {
    return NextResponse.json({
      ok: true,
      email: "skipped",
      sent: 0,
      skipped: parsed.notifications.length,
      failed: 0,
    });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const note of parsed.notifications) {
    try {
      const recipient = await readStoredUser(projectId, note.userId, token);
      const email = recipient?.email.trim();
      if (!email) {
        skipped += 1;
        continue;
      }
      await sendNotificationEmail(emailConfig, {
        to: email,
        subject: note.title,
        text: note.body,
      });
      sent += 1;
    } catch (error) {
      console.error(error);
      failed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    email: failed > 0 ? "partial" : "sent",
    sent,
    skipped,
    failed,
  });
}

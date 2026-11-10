import { tryGetFirebase } from "@/lib/firebase/client";
import type { NotificationDraft } from "@/lib/notifications/events";
import { addNotification } from "@/lib/notifications/store";

export async function publishNotifications(drafts: NotificationDraft[]) {
  if (drafts.length === 0) return { email: "skipped" as const };
  const firebase = tryGetFirebase();
  const current = firebase?.auth.currentUser;
  if (!firebase || !current) {
    throw new Error("Sign in again before notifying the crew.");
  }

  await Promise.all(drafts.map((draft) => addNotification(firebase.db, draft)));

  try {
    const token = await current.getIdToken();
    const response = await fetch("/api/notify-worker", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notifications: drafts.map((draft) => ({
          userId: draft.userId,
          title: draft.title,
          body: draft.body,
        })),
      }),
    });
    if (!response.ok) {
      console.error("Notification email failed", response.status);
      return { email: "failed" as const };
    }
    const payload = (await response.json()) as { email?: string };
    return {
      email: payload.email === "sent" ? ("sent" as const) : ("skipped" as const),
    };
  } catch (error) {
    console.error(error);
    return { email: "failed" as const };
  }
}

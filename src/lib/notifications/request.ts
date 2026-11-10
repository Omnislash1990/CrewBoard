export type NotifyItem = {
  userId: string;
  title: string;
  body: string;
};

const USER_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function parseNotifyRequest(
  body: unknown,
): { ok: true; notifications: NotifyItem[] } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null || !("notifications" in body)) {
    return { ok: false, error: "Expected a notifications list." };
  }

  const { notifications } = body;
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return { ok: false, error: "Expected a notifications list." };
  }
  if (notifications.length > 30) {
    return { ok: false, error: "Too many notifications in one request." };
  }

  const parsed: NotifyItem[] = [];
  for (const item of notifications) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, error: "Each notification must be an object." };
    }
    const userId = "userId" in item ? item.userId : undefined;
    const title = "title" in item ? item.title : undefined;
    const text = "body" in item ? item.body : undefined;
    if (typeof userId !== "string" || !USER_ID.test(userId)) {
      return { ok: false, error: "Each notification needs a user id." };
    }
    if (typeof title !== "string" || title.trim().length === 0 || title.length > 200) {
      return { ok: false, error: "Each notification needs a short title." };
    }
    if (typeof text !== "string" || text.trim().length === 0 || text.length > 2000) {
      return { ok: false, error: "Each notification needs a short message." };
    }
    parsed.push({ userId, title: title.trim(), body: text.trim() });
  }

  return { ok: true, notifications: parsed };
}

import { addDoc, collection, doc, serverTimestamp, updateDoc, type Firestore, type QueryDocumentSnapshot } from "firebase/firestore";
import type { CrewNotification, NotificationKind } from "@/types";
import type { NotificationDraft } from "@/lib/notifications/events";

export async function addNotification(db: Firestore, draft: NotificationDraft) {
  await addDoc(collection(db, "notifications"), {
    userId: draft.userId,
    jobId: draft.jobId,
    kind: draft.kind,
    title: draft.title,
    body: draft.body,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function markNotificationRead(db: Firestore, notificationId: string) {
  await updateDoc(doc(db, "notifications", notificationId), { read: true });
}

export function notificationFromDoc(snap: QueryDocumentSnapshot): CrewNotification {
  const data = snap.data();
  const createdAt = data.createdAt?.toDate?.() ?? new Date();
  return {
    id: snap.id,
    userId: typeof data.userId === "string" ? data.userId : "",
    title: typeof data.title === "string" ? data.title : "",
    body: typeof data.body === "string" ? data.body : "",
    read: data.read === true,
    createdAt,
    jobId: typeof data.jobId === "string" ? data.jobId : "",
    kind: isKind(data.kind) ? data.kind : "job_updated",
  };
}

function isKind(value: unknown): value is NotificationKind {
  return (
    value === "job_assigned" ||
    value === "job_updated" ||
    value === "job_unassigned" ||
    value === "job_removed"
  );
}

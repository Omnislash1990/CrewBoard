import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { mergePartProgress } from "@/lib/jobs/parts";
import type { JobPart, JobPartRecord, JobPartStatus } from "@/types";

function isPartStatus(value: unknown): value is JobPartStatus {
  return value === "open" || value === "completed" || value === "reviewed";
}

export function partFromDoc(snap: QueryDocumentSnapshot): JobPartRecord {
  const data = snap.data();
  return {
    id: snap.id,
    jobId: snap.ref.parent.parent?.id ?? "",
    trade: typeof data.trade === "string" ? data.trade : "",
    assignedWorkerIds: Array.isArray(data.assignedWorkerIds)
      ? data.assignedWorkerIds.filter((id: unknown): id is string => typeof id === "string")
      : [],
    status: isPartStatus(data.status) ? data.status : "open",
    completedBy: typeof data.completedBy === "string" ? data.completedBy : "",
  };
}

function partPayload(part: JobPart) {
  return {
    id: part.id,
    trade: part.trade.trim(),
    assignedWorkerIds: [
      ...new Set(part.assignedWorkerIds.filter((id) => id.trim().length > 0)),
    ],
    status: part.status,
    completedBy: part.completedBy,
  };
}

export async function saveJobParts(
  db: Firestore,
  jobId: string,
  parts: JobPart[],
) {
  const existing = await getDocs(collection(db, "jobs", jobId, "parts"));
  const stored = new Map(existing.docs.map((docSnap) => [docSnap.id, partFromDoc(docSnap)]));
  const nextIds = new Set(parts.map((part) => part.id));

  await Promise.all([
    ...parts.map((part) => {
      const merged = mergePartProgress(part, stored.get(part.id));
      return setDoc(doc(db, "jobs", jobId, "parts", part.id), partPayload(merged));
    }),
    ...existing.docs
      .filter((docSnap) => !nextIds.has(docSnap.id))
      .map((docSnap) => deleteDoc(docSnap.ref)),
  ]);
}

export async function reviewJobPart(db: Firestore, jobId: string, partId: string) {
  await updateDoc(doc(db, "jobs", jobId, "parts", partId), {
    status: "reviewed",
  });
}

export async function completeJobPart(
  db: Firestore,
  jobId: string,
  partId: string,
  workerId: string,
) {
  await updateDoc(doc(db, "jobs", jobId, "parts", partId), {
    status: "completed",
    completedBy: workerId,
  });
}

export function subscribeJobParts(
  db: Firestore,
  onParts: (parts: JobPartRecord[]) => void,
  onError?: (error: unknown) => void,
) {
  return onSnapshot(
    collectionGroup(db, "parts"),
    (snap) => {
      onParts(snap.docs.map(partFromDoc).filter((part) => part.jobId.length > 0));
    },
    (error) => {
      console.error("Job parts listener failed", error);
      onError?.(error);
    },
  );
}

export function subscribeAssignedParts(
  db: Firestore,
  workerId: string,
  onParts: (parts: JobPartRecord[]) => void,
  onError?: (error: unknown) => void,
) {
  const assigned = query(
    collectionGroup(db, "parts"),
    where("assignedWorkerIds", "array-contains", workerId),
  );
  return onSnapshot(
    assigned,
    (snap) => {
      onParts(snap.docs.map(partFromDoc).filter((part) => part.jobId.length > 0));
    },
    (error) => {
      console.error("Assigned parts listener failed", error);
      onError?.(error);
    },
  );
}

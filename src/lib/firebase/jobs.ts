import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { Job, JobStatus } from "@/types";

export type JobInput = {
  client: string;
  title: string;
  duration: string;
  notes: string;
  status: JobStatus;
  assignedWorkerIds: string[];
};

export function jobFromDoc(snap: QueryDocumentSnapshot): Job {
  const data = snap.data();
  const createdAt = data.createdAt?.toDate?.() ?? new Date();

  return {
    id: snap.id,
    client: typeof data.client === "string" ? data.client : "",
    title: typeof data.title === "string" ? data.title : "",
    duration: typeof data.duration === "string" ? data.duration : "",
    notes: typeof data.notes === "string" ? data.notes : "",
    status: isJobStatus(data.status) ? data.status : "unassigned",
    assignedWorkerIds: Array.isArray(data.assignedWorkerIds)
      ? data.assignedWorkerIds.filter((id: unknown) => typeof id === "string")
      : [],
    createdAt,
  };
}

export async function createJob(
  db: Firestore,
  input: Omit<Job, "id" | "createdAt" | "status"> & { status?: JobStatus },
) {
  const ref = doc(collection(db, "jobs"));
  const assignedWorkerIds = [...new Set(input.assignedWorkerIds)];
  const status: JobStatus =
    input.status ??
    (assignedWorkerIds.length > 0 ? "assigned" : "unassigned");

  await setDoc(ref, {
    id: ref.id,
    client: input.client,
    title: input.title,
    duration: input.duration,
    notes: input.notes,
    status,
    assignedWorkerIds,
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

export function normalizeJobInput(input: JobInput): JobInput {
  const assignedWorkerIds = [
    ...new Set(input.assignedWorkerIds.filter((id) => id.trim().length > 0)),
  ];
  return {
    client: input.client.trim(),
    title: input.title.trim(),
    duration: input.duration.trim(),
    notes: input.notes.trim(),
    assignedWorkerIds,
    status: statusForAssignees(input.status, assignedWorkerIds),
  };
}

export async function updateJob(db: Firestore, jobId: string, input: JobInput) {
  const next = normalizeJobInput(input);
  await updateDoc(doc(db, "jobs", jobId), next);
  return next;
}

export async function deleteJob(db: Firestore, jobId: string) {
  await deleteDoc(doc(db, "jobs", jobId));
}

export async function updateJobStatus(
  db: Firestore,
  jobId: string,
  status: JobStatus,
) {
  await updateDoc(doc(db, "jobs", jobId), { status });
}

function statusForAssignees(status: JobStatus, assignedWorkerIds: string[]) {
  if (assignedWorkerIds.length === 0) {
    return status === "assigned" ? "unassigned" : status;
  }
  if (status === "unassigned") return "assigned";
  return status;
}

function isJobStatus(value: unknown): value is JobStatus {
  return (
    value === "unassigned" ||
    value === "assigned" ||
    value === "in_progress" ||
    value === "completed"
  );
}

import type { JobStatus, NotificationKind } from "@/types";

export type JobNotice = {
  client: string;
  title: string;
  address?: string;
  duration: string;
  notes: string;
  status: JobStatus;
  assignedWorkerIds: string[];
  jobDate?: string;
  createdAt?: Date;
};

export type NotificationDraft = {
  userId: string;
  jobId: string;
  kind: NotificationKind;
  title: string;
  body: string;
};

function uniqueIds(ids: string[]) {
  return [...new Set(ids.filter((id) => id.trim().length > 0))];
}

function shownJobDate(job: JobNotice): string {
  const value = job.jobDate?.trim() ?? "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return value;
    }
  }
  if (job.createdAt instanceof Date && !Number.isNaN(job.createdAt.getTime())) {
    const year = job.createdAt.getFullYear();
    const month = String(job.createdAt.getMonth() + 1).padStart(2, "0");
    const day = String(job.createdAt.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return "";
}

function assignedCopy(job: JobNotice) {
  const address = job.address?.trim();
  return {
    title: `New job: ${job.client}`,
    body: address
      ? `${job.title} is on your rota. Address: ${address}.`
      : `${job.title} is on your rota.`,
  };
}

export function draftsForNewJob(jobId: string, job: JobNotice): NotificationDraft[] {
  return uniqueIds(job.assignedWorkerIds).map((userId) => ({
    userId,
    jobId,
    kind: "job_assigned",
    ...assignedCopy(job),
  }));
}

export function draftsForJobUpdate(
  jobId: string,
  before: JobNotice,
  after: JobNotice,
): NotificationDraft[] {
  const beforeIds = new Set(uniqueIds(before.assignedWorkerIds));
  const afterIds = uniqueIds(after.assignedWorkerIds);
  const afterSet = new Set(afterIds);
  const drafts: NotificationDraft[] = [];

  for (const userId of afterIds) {
    if (!beforeIds.has(userId)) {
      drafts.push({
        userId,
        jobId,
        kind: "job_assigned",
        ...assignedCopy(after),
      });
    }
  }

  for (const userId of beforeIds) {
    if (!afterSet.has(userId)) {
      drafts.push({
        userId,
        jobId,
        kind: "job_unassigned",
        title: `Removed from ${before.client}`,
        body: `${before.title} is no longer on your rota.`,
      });
    }
  }

  const contentChanged =
    before.client !== after.client ||
    before.title !== after.title ||
    (before.address ?? "") !== (after.address ?? "") ||
    before.notes !== after.notes ||
    before.status !== after.status ||
    shownJobDate(before) !== shownJobDate(after);

  if (contentChanged) {
    for (const userId of afterIds) {
      if (beforeIds.has(userId)) {
        drafts.push({
          userId,
          jobId,
          kind: "job_updated",
          title: `Updated: ${after.client}`,
          body: `${after.title} was updated on your rota.`,
        });
      }
    }
  }

  return drafts;
}

export function draftsForDeletedJob(
  jobId: string,
  job: Pick<JobNotice, "client" | "title" | "assignedWorkerIds">,
): NotificationDraft[] {
  return uniqueIds(job.assignedWorkerIds).map((userId) => ({
    userId,
    jobId,
    kind: "job_removed",
    title: `Cancelled: ${job.client}`,
    body: `${job.title} was removed from your rota.`,
  }));
}

import type { JobStatus, NotificationKind } from "@/types";

export type JobNotice = {
  client: string;
  title: string;
  duration: string;
  notes: string;
  status: JobStatus;
  assignedWorkerIds: string[];
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

function assignedCopy(job: JobNotice) {
  const time = job.duration.trim();
  return {
    title: `New job: ${job.client}`,
    body: time
      ? `${job.title} (${time}) is on your rota.`
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
    before.duration !== after.duration ||
    before.notes !== after.notes ||
    before.status !== after.status;

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

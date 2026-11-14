import type { JobPart, JobPartStatus } from "@/types";

export const TRADE_PRESETS = [
  "Carpenters",
  "Painters",
  "Floorers",
  "Electricians",
] as const;

const STATUS_RANK: Record<JobPartStatus, number> = {
  open: 0,
  completed: 1,
  reviewed: 2,
};

export function partStatusLabel(status: JobPartStatus) {
  switch (status) {
    case "open":
      return "Assigned";
    case "completed":
      return "Completed — waiting for review";
    case "reviewed":
      return "Reviewed";
  }
}

export function sameWorkerIds(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const rightIds = new Set(right);
  return left.every((id) => rightIds.has(id));
}

/**
 * Keeps a worker's completion if the office form was opened before they
 * marked the part completed. An office review still wins over a stale
 * "completed" copy of the same part.
 */
export function mergePartProgress(local: JobPart, server?: JobPart): JobPart {
  if (!server) return local;
  if (server.id !== local.id) return local;
  if (server.trade !== local.trade) return local;
  if (!sameWorkerIds(server.assignedWorkerIds, local.assignedWorkerIds)) {
    return local;
  }
  if (STATUS_RANK[server.status] > STATUS_RANK[local.status]) {
    return {
      ...local,
      status: server.status,
      completedBy: server.completedBy,
    };
  }
  return local;
}

export function partsWaitingForReview<T extends { status: JobPartStatus }>(
  parts: T[],
) {
  return parts.filter((part) => part.status === "completed");
}

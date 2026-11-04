"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/format";
import type { Job, JobStatus } from "@/types";

export function WorkerJobCard({
  job,
  updating,
  onStatus,
}: {
  job: Job;
  updating: boolean;
  onStatus: (status: JobStatus) => void;
}) {
  const nextAction =
    job.status === "assigned"
      ? { label: "Start job", status: "in_progress" as const }
      : job.status === "in_progress"
        ? { label: "Mark complete", status: "completed" as const }
        : null;

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">
            {job.client}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-barlow)] text-xl font-semibold text-stone-900">
            {job.title}
          </h2>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-stone-50 px-3 py-2">
          <dt className="text-xs uppercase tracking-wide text-stone-500">Time</dt>
          <dd className="mt-0.5 font-medium text-stone-900">
            {job.duration || "Not set"}
          </dd>
        </div>
        <div className="rounded-2xl bg-stone-50 px-3 py-2">
          <dt className="text-xs uppercase tracking-wide text-stone-500">Added</dt>
          <dd className="mt-0.5 font-medium text-stone-900">
            {formatDateTime(job.createdAt)}
          </dd>
        </div>
      </dl>

      {job.notes ? (
        <p className="mt-3 text-sm leading-6 text-stone-600">{job.notes}</p>
      ) : null}

      {nextAction ? (
        <button
          type="button"
          onClick={() => onStatus(nextAction.status)}
          disabled={updating}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-700 text-sm font-semibold text-white hover:bg-orange-800 disabled:opacity-60"
        >
          {updating ? <Spinner className="h-4 w-4" /> : null}
          {nextAction.label}
        </button>
      ) : null}
    </article>
  );
}

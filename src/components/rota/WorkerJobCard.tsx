"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/format";
import { partStatusLabel } from "@/lib/jobs/parts";
import type { Job, JobPartRecord, JobStatus } from "@/types";

export function WorkerJobCard({
  job,
  parts,
  updating,
  updatingPartId,
  onStatus,
  onCompletePart,
}: {
  job: Job;
  parts: JobPartRecord[];
  updating: boolean;
  updatingPartId: string | null;
  onStatus: (status: JobStatus) => void;
  onCompletePart: (partId: string) => void;
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

      <section className="mt-4 rounded-2xl bg-stone-50 px-3 py-3" aria-label="Address">
        <h3 className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Address
        </h3>
        <p className="mt-1 text-sm font-medium text-stone-900">
          {job.address.trim() || "No address yet"}
        </p>
      </section>

      <dl className="mt-3">
        <div className="rounded-2xl bg-stone-50 px-3 py-2">
          <dt className="text-xs uppercase tracking-wide text-stone-500">Date</dt>
          <dd className="mt-0.5 font-medium text-stone-900">
            {formatDate(job.createdAt)}
          </dd>
        </div>
      </dl>

      {job.notes ? (
        <p className="mt-3 text-sm leading-6 text-stone-600">{job.notes}</p>
      ) : null}

      {parts.length > 0 ? (
        <section className="mt-4" aria-label="Your trade parts">
          <h3 className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Your parts
          </h3>
          <ul className="mt-2 space-y-2">
            {parts.map((part) => {
              const pending = updatingPartId === part.id;
              return (
                <li
                  key={part.id}
                  className="rounded-2xl border border-stone-200 px-3 py-3"
                >
                  <p className="text-sm font-semibold text-stone-900">
                    {part.trade}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {partStatusLabel(part.status)}
                  </p>
                  {part.status === "open" ? (
                    <button
                      type="button"
                      onClick={() => onCompletePart(part.id)}
                      disabled={pending}
                      className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-700 text-sm font-semibold text-white hover:bg-orange-800 disabled:opacity-60"
                    >
                      {pending ? <Spinner className="h-4 w-4" /> : null}
                      Mark completed
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {nextAction ? (
        <button
          type="button"
          onClick={() => onStatus(nextAction.status)}
          disabled={updating}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
        >
          {updating ? <Spinner className="h-4 w-4" /> : null}
          {nextAction.label}
        </button>
      ) : null}
    </article>
  );
}

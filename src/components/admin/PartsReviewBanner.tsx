"use client";

import { partStatusLabel } from "@/lib/jobs/parts";
import type { Job, JobPartRecord } from "@/types";

export function PartsReviewBanner({
  jobs,
  parts,
  reviewingId,
  onReview,
}: {
  jobs: Job[];
  parts: JobPartRecord[];
  reviewingId: string | null;
  onReview: (part: JobPartRecord) => void;
}) {
  const waiting = parts.filter((part) => part.status === "completed");
  if (waiting.length === 0) return null;

  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const heading =
    waiting.length === 1
      ? "1 trade part is completed and waiting for review"
      : `${waiting.length} trade parts are completed and waiting for review`;

  return (
    <section
      className="rounded-3xl border border-amber-300 bg-amber-50 p-4 shadow-sm md:p-5"
      aria-live="polite"
    >
      <h2 className="font-[family-name:var(--font-barlow)] text-lg font-semibold text-amber-950">
        {heading}
      </h2>
      <ul className="mt-3 space-y-2">
        {waiting.map((part) => {
          const job = jobsById.get(part.jobId);
          return (
            <li
              key={`${part.jobId}-${part.id}`}
              className="flex flex-col gap-2 rounded-2xl bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900">
                  {part.trade}
                  <span className="font-normal text-stone-500">
                    {" "}
                    · {partStatusLabel(part.status)}
                  </span>
                </p>
                <p className="truncate text-sm text-stone-600">
                  {job ? `${job.client} — ${job.title}` : "Job"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onReview(part)}
                disabled={reviewingId === part.id}
                className="min-h-11 shrink-0 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
              >
                {reviewingId === part.id ? "Saving…" : "Mark reviewed"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

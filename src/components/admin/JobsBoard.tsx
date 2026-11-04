"use client";

import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AppUser, Job } from "@/types";

export function JobsBoard({
  jobs,
  workers,
}: {
  jobs: Job[];
  workers: AppUser[];
}) {
  const names = new Map(workers.map((worker) => [worker.uid, worker.name]));

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-barlow)] text-xl font-semibold text-stone-900">
          Live jobs
        </h2>
        <span className="text-sm text-stone-500">{jobs.length} total</span>
      </div>

      {jobs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-500">
          Dispatched jobs will land here in real time.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-stone-500">
              <tr className="border-b border-stone-200">
                <th className="py-2 pr-4 font-medium">Client</th>
                <th className="py-2 pr-4 font-medium">Job</th>
                <th className="py-2 pr-4 font-medium">Time</th>
                <th className="py-2 pr-4 font-medium">Crew</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-stone-100 align-top">
                  <td className="py-3 pr-4 font-medium text-stone-900">
                    {job.client}
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-stone-800">{job.title}</p>
                    {job.notes ? (
                      <p className="mt-1 max-w-xs text-xs text-stone-500">
                        {job.notes}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4 text-stone-600">{job.duration || "—"}</td>
                  <td className="py-3 pr-4 text-stone-600">
                    {job.assignedWorkerIds.length === 0
                      ? "—"
                      : job.assignedWorkerIds
                          .map((id) => names.get(id) ?? id.slice(0, 6))
                          .join(", ")}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="py-3 whitespace-nowrap text-stone-500">
                    {formatDateTime(job.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

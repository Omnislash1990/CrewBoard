"use client";

import { WorkerPicker } from "@/components/admin/WorkerPicker";
import { Spinner } from "@/components/ui/Spinner";
import type { AppUser } from "@/types";

export type JobDraft = {
  client: string;
  title: string;
  duration: string;
  notes: string;
  assignedWorkerIds: string[];
  valid: boolean;
  error?: string;
  raw: string;
};

export function JobPreviewCard({
  draft,
  workers,
  saving,
  saved,
  error,
  onChange,
  onSave,
}: {
  draft: JobDraft;
  workers: AppUser[];
  saving: boolean;
  saved: boolean;
  error?: string;
  onChange: (patch: Partial<JobDraft>) => void;
  onSave: () => void;
}) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">
          Job card preview
        </p>
        {saved ? (
          <span className="text-xs font-semibold text-teal-700">Dispatched</span>
        ) : null}
      </div>

      {!draft.valid ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {draft.error ?? "Could not parse this line."}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <Field
          label="Client"
          value={draft.client}
          onChange={(value) => onChange({ client: value })}
        />
        <Field
          label="Job"
          value={draft.title}
          onChange={(value) => onChange({ title: value })}
        />
        <Field
          label="Time"
          value={draft.duration}
          onChange={(value) => onChange({ duration: value })}
        />
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Assign crew
          </span>
          <WorkerPicker
            workers={workers}
            selectedIds={draft.assignedWorkerIds}
            onChange={(assignedWorkerIds) => onChange({ assignedWorkerIds })}
          />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Notes
          </span>
          <textarea
            value={draft.notes}
            onChange={(event) => onChange({ notes: event.target.value })}
            rows={2}
            className="w-full resize-y rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-orange-700/30 focus:border-orange-700 focus:ring-4"
          />
        </label>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={!draft.valid || saving || saved || !draft.client || !draft.title}
          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Spinner className="h-4 w-4" /> : null}
          {saved ? "Saved" : "Dispatch job"}
        </button>
      </div>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-orange-700/30 focus:border-orange-700 focus:ring-4"
      />
    </label>
  );
}

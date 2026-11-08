"use client";

import { useMemo, useState } from "react";
import { JobPreviewCard, type JobDraft } from "@/components/admin/JobPreviewCard";
import { Spinner } from "@/components/ui/Spinner";
import { createJob } from "@/lib/firebase/jobs";
import { db, tryGetFirebase } from "@/lib/firebase/client";
import { parseTogglText, SAMPLE_TOGGL_PASTE } from "@/lib/parser/toggl";
import type { AppUser } from "@/types";

export function TogglParser({ workers }: { workers: AppUser[] }) {
  const [raw, setRaw] = useState("");
  const [drafts, setDrafts] = useState<JobDraft[]>([]);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [bulkSaving, setBulkSaving] = useState(false);

  const parsedCount = useMemo(
    () => drafts.filter((draft) => draft.valid).length,
    [drafts],
  );

  function applyParse(value: string) {
    setRaw(value);
    const parsed = parseTogglText(value);
    setDrafts(
      parsed.map((job) => ({
        client: job.client,
        title: job.title,
        duration: job.duration,
        notes: job.notes,
        assignedWorkerIds: [],
        valid: job.valid,
        error: job.error,
        raw: job.raw,
      })),
    );
    setSaved({});
    setErrors({});
  }

  function patchDraft(index: number, patch: Partial<JobDraft>) {
    setDrafts((current) =>
      current.map((draft, draftIndex) =>
        draftIndex === index ? { ...draft, ...patch, valid: true } : draft,
      ),
    );
  }

  async function saveDraft(index: number) {
    const draft = drafts[index];
    if (!draft || !tryGetFirebase() || !db) return;

    setSavingIndex(index);
    setErrors((current) => {
      const next = { ...current };
      delete next[index];
      return next;
    });

    try {
      await createJob(db, {
        client: draft.client.trim(),
        title: draft.title.trim(),
        duration: draft.duration.trim(),
        notes: draft.notes.trim(),
        assignedWorkerIds: draft.assignedWorkerIds,
      });
      setSaved((current) => ({ ...current, [index]: true }));
    } catch (err) {
      console.error(err);
      setErrors((current) => ({
        ...current,
        [index]: "Could not save this job to Firestore.",
      }));
    } finally {
      setSavingIndex(null);
    }
  }

  async function saveAll() {
    setBulkSaving(true);
    for (let index = 0; index < drafts.length; index += 1) {
      const draft = drafts[index];
      if (!draft?.valid || saved[index] || !draft.client || !draft.title) continue;
      await saveDraft(index);
    }
    setBulkSaving(false);
  }

  return (
    <section className="rounded-3xl border border-stone-200 bg-stone-50/80 p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-barlow)] text-2xl font-semibold tracking-tight text-stone-900">
            Toggl dispatch
          </h2>
          <p className="mt-1 max-w-xl text-sm text-stone-500">
            Paste copied Toggl lines in the shape{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-stone-700">
              Client - Job - Time - Notes
            </code>
            . Preview the card, pick crew, then save to the live rota.
          </p>
        </div>
        <button
          type="button"
          onClick={() => applyParse(SAMPLE_TOGGL_PASTE)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
        >
          Load sample
        </button>
      </div>

      <label className="mt-5 block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
          Paste from Toggl
        </span>
        <textarea
          value={raw}
          onChange={(event) => applyParse(event.target.value)}
          placeholder="Hargreaves - Bathroom reinstatement - 3:15 - Escape of water, strip ceiling"
          rows={7}
          className="w-full resize-y rounded-2xl border border-stone-300 bg-white px-4 py-3 font-mono text-sm leading-6 text-stone-900 outline-none ring-orange-700/30 focus:border-orange-700 focus:ring-4"
        />
      </label>

      {drafts.length > 0 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-stone-500">
            {parsedCount} job{parsedCount === 1 ? "" : "s"} ready to dispatch
          </p>
          <button
            type="button"
            onClick={saveAll}
            disabled={bulkSaving || parsedCount === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-800 disabled:opacity-50"
          >
            {bulkSaving ? <Spinner className="h-4 w-4" /> : null}
            Dispatch all
          </button>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4">
        {drafts.map((draft, index) => (
          <JobPreviewCard
            key={`${draft.raw}-${index}`}
            draft={draft}
            workers={workers}
            saving={savingIndex === index || bulkSaving}
            saved={Boolean(saved[index])}
            error={errors[index]}
            onChange={(patch) => patchDraft(index, patch)}
            onSave={() => saveDraft(index)}
          />
        ))}
      </div>
    </section>
  );
}

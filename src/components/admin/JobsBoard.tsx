"use client";

import { useState } from "react";
import { WorkerPicker } from "@/components/admin/WorkerPicker";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import { deleteJob, normalizeJobInput, updateJob, type JobInput } from "@/lib/firebase/jobs";
import { tryGetFirebase } from "@/lib/firebase/client";
import { formatDateTime, statusLabel } from "@/lib/format";
import {
  draftsForDeletedJob,
  draftsForJobUpdate,
} from "@/lib/notifications/events";
import { publishNotifications } from "@/lib/notifications/publish";
import type { AppUser, Job, JobStatus } from "@/types";

const STATUSES: JobStatus[] = [
  "unassigned",
  "assigned",
  "in_progress",
  "completed",
];

export function JobsBoard({
  jobs,
  workers,
}: {
  jobs: Job[];
  workers: AppUser[];
}) {
  const names = new Map(workers.map((worker) => [worker.uid, worker.name]));
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = jobs.find((job) => job.id === editingId) ?? null;

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-barlow)] text-xl font-semibold text-stone-900">
          Live jobs
        </h2>
        <span className="text-sm text-stone-500">{jobs.length} total</span>
      </div>

      {editing ? (
        <EditJobForm
          key={editing.id}
          job={editing}
          workers={workers}
          onClose={() => setEditingId(null)}
        />
      ) : null}

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
                <th className="py-2 pr-4 font-medium">Created</th>
                <th className="py-2 font-medium">Actions</th>
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
                  <td className="py-3 whitespace-nowrap pr-4 text-stone-500">
                    {formatDateTime(job.createdAt)}
                  </td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(job.id)}
                      className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                    >
                      Edit
                    </button>
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

function EditJobForm({
  job,
  workers,
  onClose,
}: {
  job: Job;
  workers: AppUser[];
  onClose: () => void;
}) {
  const [client, setClient] = useState(job.client);
  const [title, setTitle] = useState(job.title);
  const [duration, setDuration] = useState(job.duration);
  const [notes, setNotes] = useState(job.notes);
  const [status, setStatus] = useState<JobStatus>(job.status);
  const [assignedWorkerIds, setAssignedWorkerIds] = useState(job.assignedWorkerIds);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSave() {
    const firebase = tryGetFirebase();
    if (!firebase) return;
    const next: JobInput = normalizeJobInput({
      client,
      title,
      duration,
      notes,
      status,
      assignedWorkerIds,
    });
    if (!next.client || !next.title) {
      setError("Client and job title are required.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await updateJob(firebase.db, job.id, next);
      try {
        const email = await publishNotifications(
          draftsForJobUpdate(job.id, job, saved),
        );
        if (email.email === "failed") {
          setNotice("Job updated. The in-app alert was saved, but email did not send.");
          return;
        }
      } catch (notifyError) {
        console.error(notifyError);
        setNotice("Job updated, but the crew alert could not be sent.");
        return;
      }
      onClose();
    } catch (saveError) {
      console.error(saveError);
      setError("Could not update this job.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    const firebase = tryGetFirebase();
    if (!firebase) return;
    setSaving(true);
    setError(null);
    try {
      const drafts = draftsForDeletedJob(job.id, job);
      await deleteJob(firebase.db, job.id);
      try {
        await publishNotifications(drafts);
      } catch (notifyError) {
        console.error(notifyError);
      }
      onClose();
    } catch (deleteError) {
      console.error(deleteError);
      setError("Could not delete this job.");
      setSaving(false);
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-[family-name:var(--font-barlow)] text-lg font-semibold text-stone-900">
          Edit {job.client}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-stone-500 hover:text-stone-800"
        >
          Close
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Client
          </span>
          <input
            value={client}
            onChange={(event) => setClient(event.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none ring-orange-700/30 focus:border-orange-700 focus:ring-4"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Job
          </span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none ring-orange-700/30 focus:border-orange-700 focus:ring-4"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Time
          </span>
          <input
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none ring-orange-700/30 focus:border-orange-700 focus:ring-4"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Status
          </span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as JobStatus)}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none ring-orange-700/30 focus:border-orange-700 focus:ring-4"
          >
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {statusLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <div className="md:col-span-2">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Crew
          </span>
          <WorkerPicker
            workers={workers}
            selectedIds={assignedWorkerIds}
            onChange={setAssignedWorkerIds}
          />
        </div>
        <label className="block text-sm md:col-span-2">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Notes
          </span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            className="w-full resize-y rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none ring-orange-700/30 focus:border-orange-700 focus:ring-4"
          />
        </label>
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="mt-3 text-sm text-amber-800">{notice}</p> : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-600">Delete this job?</span>
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-50"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            Delete job
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !client.trim() || !title.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
        >
          {saving ? <Spinner className="h-4 w-4" /> : null}
          Save changes
        </button>
      </div>
    </div>
  );
}

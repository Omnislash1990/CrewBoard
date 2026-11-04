"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Logo } from "@/components/brand/Logo";
import { WorkerJobCard } from "@/components/rota/WorkerJobCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { jobFromDoc, updateJobStatus } from "@/lib/firebase/jobs";
import { tryGetFirebase } from "@/lib/firebase/client";
import { formatDayLabel } from "@/lib/format";
import type { Job, JobStatus } from "@/types";

export function RotaFeed() {
  const { profile, signOut } = useAuth();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const firebase = tryGetFirebase();
    if (!firebase || !profile) return;

    const jobsQuery = query(
      collection(firebase.db, "jobs"),
      where("assignedWorkerIds", "array-contains", profile.uid),
    );

    const unsubscribe = onSnapshot(
      jobsQuery,
      (snap) => {
        const next = snap.docs
          .map(jobFromDoc)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setJobs(next);
      },
      (error) => {
        console.error("Rota listener failed", error);
        setJobs([]);
      },
    );

    return unsubscribe;
  }, [profile]);

  const visibleJobs = useMemo(() => {
    if (!jobs) return [];
    return showCompleted
      ? jobs
      : jobs.filter((job) => job.status !== "completed");
  }, [jobs, showCompleted]);

  async function onStatus(jobId: string, status: JobStatus) {
    const firebase = tryGetFirebase();
    if (!firebase) return;
    setUpdatingId(jobId);
    try {
      await updateJobStatus(firebase.db, jobId, status);
    } finally {
      setUpdatingId(null);
    }
  }

  if (!profile || jobs === null) {
    return <FullPageSpinner label="Loading rota" />;
  }

  return (
    <div className="min-h-dvh bg-stone-100">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-100/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={() => signOut()}
            className="text-sm font-medium text-stone-600"
          >
            Sign out
          </button>
        </div>
        <div className="mx-auto mt-3 max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
            {formatDayLabel()}
          </p>
          <h1 className="font-[family-name:var(--font-barlow)] text-2xl font-semibold text-stone-900">
            {profile.name ? `${profile.name.split(" ")[0]}'s rota` : "Your rota"}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-3 px-4 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <label className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm text-stone-600 shadow-sm">
          <span>Show completed jobs</span>
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(event) => setShowCompleted(event.target.checked)}
            className="h-4 w-4 accent-orange-700"
          />
        </label>

        {visibleJobs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-5 py-16 text-center">
            <p className="font-[family-name:var(--font-barlow)] text-lg font-semibold text-stone-900">
              Nothing on your rota yet
            </p>
            <p className="mt-1 text-sm text-stone-500">
              New jobs assigned to you will appear here instantly.
            </p>
          </div>
        ) : (
          visibleJobs.map((job) => (
            <WorkerJobCard
              key={job.id}
              job={job}
              updating={updatingId === job.id}
              onStatus={(status) => onStatus(job.id, status)}
            />
          ))
        )}

        {updatingId ? (
          <p className="flex items-center justify-center gap-2 text-xs text-stone-500">
            <Spinner className="h-3.5 w-3.5" /> Updating job
          </p>
        ) : null}
      </main>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { TogglParser } from "@/components/admin/TogglParser";
import { JobsBoard } from "@/components/admin/JobsBoard";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/components/providers/AuthProvider";
import { jobFromDoc } from "@/lib/firebase/jobs";
import { tryGetFirebase } from "@/lib/firebase/client";
import { subscribeCrewWorkers } from "@/lib/firebase/users";
import type { AppUser, Job } from "@/types";

export function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [workers, setWorkers] = useState<AppUser[]>([]);

  useEffect(() => {
    const firebase = tryGetFirebase();
    if (!firebase) return;

    const jobsQuery = query(
      collection(firebase.db, "jobs"),
      orderBy("createdAt", "desc"),
    );
    const unsubJobs = onSnapshot(
      jobsQuery,
      (snap) => {
        setJobs(snap.docs.map(jobFromDoc));
      },
      (error) => {
        console.error("Jobs listener failed", error);
      },
    );

    const unsubWorkers = subscribeCrewWorkers(firebase.db, setWorkers);

    return () => {
      unsubJobs();
      unsubWorkers();
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Open",
        value: jobs.filter((job) => job.status !== "completed").length,
      },
      {
        label: "Unassigned",
        value: jobs.filter((job) => job.status === "unassigned").length,
      },
      {
        label: "On site",
        value: jobs.filter((job) => job.status === "in_progress").length,
      },
      {
        label: "Crew",
        value: workers.length,
      },
    ],
    [jobs, workers.length],
  );

  return (
    <div className="min-h-dvh bg-[#f4efe6]">
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-6">
            <Logo />
            <span className="hidden text-sm text-stone-500 md:inline">
              Office dispatch
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-stone-600 sm:inline">
              {profile?.name}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div>
          <h1 className="font-[family-name:var(--font-barlow)] text-3xl font-semibold tracking-tight text-stone-900">
            Dispatch board
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Turn Toggl copy into assigned jobs. Crew see updates on their rota
            immediately.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                {stat.label}
              </p>
              <p className="mt-1 font-[family-name:var(--font-barlow)] text-3xl font-semibold text-stone-900">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <TogglParser workers={workers} />
        <JobsBoard jobs={jobs} workers={workers} parts={[]} />
      </main>
    </div>
  );
}

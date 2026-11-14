"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { PartsReviewBanner } from "@/components/admin/PartsReviewBanner";
import { TogglParser } from "@/components/admin/TogglParser";
import { JobsBoard } from "@/components/admin/JobsBoard";
import { jobFromDoc } from "@/lib/firebase/jobs";
import { sortJobsByDate } from "@/lib/jobs/date";
import { reviewJobPart, subscribeJobParts } from "@/lib/firebase/parts";
import { tryGetFirebase } from "@/lib/firebase/client";
import { subscribeCrewWorkers } from "@/lib/firebase/users";
import type { AppUser, Job, JobPartRecord } from "@/types";

export function TogglJobParser() {
  const [workers, setWorkers] = useState<AppUser[]>([]);
  const [workersError, setWorkersError] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [parts, setParts] = useState<JobPartRecord[]>([]);
  const [partsError, setPartsError] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    const firebase = tryGetFirebase();
    if (!firebase) return;

    const unsubWorkers = subscribeCrewWorkers(
      firebase.db,
      (next) => {
        setWorkers(next);
        setWorkersError(false);
      },
      () => setWorkersError(true),
    );

    const jobsQuery = query(
      collection(firebase.db, "jobs"),
      orderBy("createdAt", "desc"),
    );
    const unsubJobs = onSnapshot(
      jobsQuery,
      (snap) => {
        // Keep the createdAt query so older jobs with no jobDate still load,
        // then order the list by the date the office chose.
        setJobs(sortJobsByDate(snap.docs.map(jobFromDoc)));
      },
      (error) => {
        console.error("Jobs listener failed", error);
      },
    );

    const unsubParts = subscribeJobParts(
      firebase.db,
      (next) => {
        setParts(next);
        setPartsError(false);
      },
      () => setPartsError(true),
    );

    return () => {
      unsubWorkers();
      unsubJobs();
      unsubParts();
    };
  }, []);

  async function onReview(part: JobPartRecord) {
    const firebase = tryGetFirebase();
    if (!firebase) return;
    setReviewingId(part.id);
    try {
      await reviewJobPart(firebase.db, part.jobId, part.id);
    } catch (error) {
      console.error(error);
    } finally {
      setReviewingId(null);
    }
  }

  const workersHint = workersError
    ? "The crew list could not be loaded."
    : undefined;

  return (
    <div className="space-y-6">
      {partsError ? (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="alert">
          Trade parts could not be loaded. Deploy the latest Firestore rules, then reload.
        </p>
      ) : (
        <PartsReviewBanner
          jobs={jobs}
          parts={parts}
          reviewingId={reviewingId}
          onReview={onReview}
        />
      )}
      <TogglParser workers={workers} workersHint={workersHint} />
      <JobsBoard
        jobs={jobs}
        workers={workers}
        parts={parts}
        workersHint={workersHint}
      />
    </div>
  );
}

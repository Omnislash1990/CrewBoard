"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { TogglParser } from "@/components/admin/TogglParser";
import { JobsBoard } from "@/components/admin/JobsBoard";
import { jobFromDoc } from "@/lib/firebase/jobs";
import { tryGetFirebase } from "@/lib/firebase/client";
import { userFromDoc } from "@/lib/firebase/users";
import type { AppUser, Job } from "@/types";

export function TogglJobParser() {
  const [workers, setWorkers] = useState<AppUser[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const firebase = tryGetFirebase();
    if (!firebase) return;

    const workersQuery = query(
      collection(firebase.db, "users"),
      where("role", "==", "worker"),
    );
    const unsubWorkers = onSnapshot(workersQuery, (snap) => {
      setWorkers(
        snap.docs.map((docSnap) => userFromDoc(docSnap.id, docSnap.data())),
      );
    });

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

    return () => {
      unsubWorkers();
      unsubJobs();
    };
  }, []);

  return (
    <div className="space-y-6">
      <TogglParser workers={workers} />
      <JobsBoard jobs={jobs} workers={workers} />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import { tryGetFirebase } from "@/lib/firebase/client";
import { setUserRole, userFromDoc } from "@/lib/firebase/users";
import type { AppUser, UserRole } from "@/types";

export function CrewManager() {
  const { profile } = useAuth();
  const [people, setPeople] = useState<AppUser[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const firebase = tryGetFirebase();
    if (!firebase) return;
    const unsubscribe = onSnapshot(
      collection(firebase.db, "users"),
      (snap) => {
        const next = snap.docs
          .map((docSnap) => userFromDoc(docSnap.id, docSnap.data()))
          .sort((a, b) => {
            if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
        setPeople(next);
      },
      (listenError) => {
        console.error(listenError);
        setError("Could not load the crew.");
        setPeople([]);
      },
    );
    return unsubscribe;
  }, []);

  const adminCount = people?.filter((person) => person.role === "admin").length ?? 0;

  async function changeRole(person: AppUser, role: UserRole) {
    const firebase = tryGetFirebase();
    if (!firebase) return;
    setPendingId(person.uid);
    setError(null);
    try {
      await setUserRole(firebase.db, person.uid, role);
    } catch (changeError) {
      console.error(changeError);
      setError(
        changeError instanceof FirebaseError &&
          changeError.code === "permission-denied"
          ? "That role change was blocked. You can't change your own admin access."
          : "Could not update that role.",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4">
        <h1 className="font-[family-name:var(--font-barlow)] text-2xl font-semibold text-stone-900">
          Crew roles
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-stone-500">
          Promote office staff or return them to the rota. You cannot change
          your own role, so the last admin cannot lock everyone out.
        </p>
      </div>

      {adminCount < 2 ? (
        <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          You&apos;re the only admin. Promote someone else before anyone
          removes admin access. Removing your own is blocked.
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {people === null ? (
        <p className="text-sm text-stone-500">Loading crew…</p>
      ) : people.length === 0 ? (
        <p className="text-sm text-stone-500">No profiles yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-stone-500">
              <tr className="border-b border-stone-200">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 font-medium">Access</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => {
                const isSelf = person.uid === profile?.uid;
                const demoteBlocked =
                  person.role === "admin" && (isSelf || adminCount < 2);
                const pending = pendingId === person.uid;
                return (
                  <tr key={person.uid} className="border-b border-stone-100 align-top">
                    <td className="py-3 pr-4 font-medium text-stone-900">
                      {person.name}
                      {isSelf ? (
                        <span className="ml-2 text-xs font-normal text-stone-500">
                          You
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 text-stone-600">{person.email || "—"}</td>
                    <td className="py-3 pr-4 capitalize text-stone-700">{person.role}</td>
                    <td className="py-3">
                      {person.role === "worker" ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => changeRole(person, "admin")}
                          className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
                        >
                          {pending ? "Saving…" : "Make admin"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={pending || demoteBlocked}
                          onClick={() => changeRole(person, "worker")}
                          title={
                            isSelf
                              ? "Another admin has to change your role."
                              : undefined
                          }
                          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {pending ? "Saving…" : "Make worker"}
                        </button>
                      )}
                      {isSelf ? (
                        <p className="mt-1 max-w-xs text-xs text-stone-500">
                          Another admin has to change your role.
                        </p>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

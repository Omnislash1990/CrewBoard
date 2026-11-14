"use client";

import { useAuth } from "@/context/AuthContext";
import { TogglJobParser } from "@/components/admin/TogglJobParser";

export default function AdminPage() {
  const { profile, signOut } = useAuth();

  return (
    <div>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Welcome, {profile?.name}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Manage the daily rota, paste jobs, and dispatch them to the crew.
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Sign Out
        </button>
      </header>

      <TogglJobParser />
    </div>
  );
}

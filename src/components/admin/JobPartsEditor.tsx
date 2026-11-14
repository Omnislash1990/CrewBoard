"use client";

import { useState } from "react";
import { WorkerPicker } from "@/components/admin/WorkerPicker";
import { TRADE_PRESETS, partStatusLabel } from "@/lib/jobs/parts";
import type { AppUser, JobPart } from "@/types";

const CUSTOM = "custom";

export function JobPartsEditor({
  parts,
  workers,
  workersHint,
  onChange,
}: {
  parts: JobPart[];
  workers: AppUser[];
  workersHint?: string;
  onChange: (parts: JobPart[]) => void;
}) {
  const [tradeChoice, setTradeChoice] = useState<string>(TRADE_PRESETS[0]);
  const [customTrade, setCustomTrade] = useState("");
  const [workerIds, setWorkerIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const tradeName =
    tradeChoice === CUSTOM ? customTrade.trim() : tradeChoice;

  function addPart() {
    if (!tradeName) {
      setFormError("Enter a trade name.");
      return;
    }
    if (tradeName.length > 60) {
      setFormError("Trade names need to be under 60 characters.");
      return;
    }
    if (workerIds.length === 0) {
      setFormError("Assign at least one person to this part.");
      return;
    }
    if (parts.length >= 12) {
      setFormError("A job can have up to 12 trade parts.");
      return;
    }
    setFormError(null);
    onChange([
      ...parts,
      {
        id: crypto.randomUUID(),
        trade: tradeName,
        assignedWorkerIds: workerIds,
        status: "open",
        completedBy: "",
      },
    ]);
    setWorkerIds([]);
    setCustomTrade("");
  }

  function updatePart(partId: string, patch: Partial<JobPart>) {
    onChange(
      parts.map((part) => (part.id === partId ? { ...part, ...patch } : part)),
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-stone-900">Trade parts</h4>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          Split the job by trade and assign who does each part. They can mark
          their own part completed. You review it here.
        </p>
      </div>

      {parts.length > 0 ? (
        <ul className="mb-3 space-y-3">
          {parts.map((part) => (
            <li
              key={part.id}
              className="rounded-xl border border-stone-200 bg-stone-50 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    {part.trade}
                  </p>
                  <p className="text-xs text-stone-500">
                    {partStatusLabel(part.status)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onChange(parts.filter((item) => item.id !== part.id))
                  }
                  className="min-h-11 shrink-0 rounded-lg px-2 text-xs font-semibold text-stone-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="mt-2">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
                  Assigned to
                </span>
                <WorkerPicker
                  workers={workers}
                  selectedIds={part.assignedWorkerIds}
                  emptyMessage={workersHint}
                  onChange={(assignedWorkerIds) =>
                    updatePart(part.id, { assignedWorkerIds })
                  }
                />
              </div>
              {part.status === "completed" ? (
                <button
                  type="button"
                  onClick={() => updatePart(part.id, { status: "reviewed" })}
                  className="mt-3 min-h-11 w-full rounded-xl bg-teal-800 px-3 text-sm font-semibold text-white hover:bg-teal-900"
                >
                  Mark reviewed
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-sm text-stone-500">No trade parts yet.</p>
      )}

      <div className="grid gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Trade
          </span>
          <select
            value={tradeChoice}
            onChange={(event) => setTradeChoice(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none ring-orange-700/30 focus:border-orange-700 focus:ring-4"
          >
            {TRADE_PRESETS.map((trade) => (
              <option key={trade} value={trade}>
                {trade}
              </option>
            ))}
            <option value={CUSTOM}>Other trade</option>
          </select>
        </label>
        {tradeChoice === CUSTOM ? (
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
              Trade name
            </span>
            <input
              value={customTrade}
              onChange={(event) => setCustomTrade(event.target.value)}
              placeholder="For example, Plasterers"
              maxLength={60}
              className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none ring-orange-700/30 focus:border-orange-700 focus:ring-4"
            />
          </label>
        ) : null}
        <div>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Assign this part
          </span>
          <WorkerPicker
            workers={workers}
            selectedIds={workerIds}
            emptyMessage={workersHint}
            onChange={setWorkerIds}
          />
        </div>
        {formError ? (
          <p className="text-sm text-red-700" role="alert">
            {formError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={addPart}
          className="min-h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
        >
          Add trade part
        </button>
      </div>
    </div>
  );
}

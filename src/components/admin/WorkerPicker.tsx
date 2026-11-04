"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { initials } from "@/lib/format";
import type { AppUser } from "@/types";

export function WorkerPicker({
  workers,
  selectedIds,
  onChange,
}: {
  workers: AppUser[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => workers.filter((worker) => selectedIds.includes(worker.uid)),
    [selectedIds, workers],
  );

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function toggle(uid: string) {
    if (selectedIds.includes(uid)) {
      onChange(selectedIds.filter((id) => id !== uid));
    } else {
      onChange([...selectedIds, uid]);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-stone-300 bg-white px-3 py-2 text-left text-sm text-stone-800 outline-none ring-orange-700/30 transition hover:border-stone-400 focus:border-orange-700 focus:ring-4"
      >
        <span className="truncate">
          {selected.length === 0
            ? "Select crew"
            : selected.map((worker) => worker.name).join(", ")}
        </span>
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 text-stone-500 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          aria-hidden
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-stone-200 bg-white p-1 shadow-xl">
          {workers.length === 0 ? (
            <p className="px-3 py-2 text-sm text-stone-500">
              No workers in Firestore yet.
            </p>
          ) : (
            workers.map((worker) => {
              const checked = selectedIds.includes(worker.uid);
              return (
                <label
                  key={worker.uid}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-stone-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(worker.uid)}
                    className="h-4 w-4 accent-orange-700"
                  />
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200 text-[11px] font-semibold text-stone-700">
                    {initials(worker.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-stone-900">
                      {worker.name}
                    </span>
                    {worker.phone ? (
                      <span className="block truncate text-xs text-stone-500">
                        {worker.phone}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

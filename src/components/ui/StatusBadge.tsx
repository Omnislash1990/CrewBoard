import { statusLabel } from "@/lib/format";
import type { JobStatus } from "@/types";

const STYLES: Record<JobStatus, string> = {
  unassigned: "bg-stone-200 text-stone-700",
  assigned: "bg-sky-100 text-sky-800",
  in_progress: "bg-amber-100 text-amber-900",
  completed: "bg-teal-100 text-teal-800",
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

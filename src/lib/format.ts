import type { JobStatus } from "@/types";

const dateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateOnly = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dayLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function formatDateTime(date: Date) {
  return dateTime.format(date);
}

export function formatDate(date: Date) {
  return dateOnly.format(date);
}

export function formatDayLabel(date = new Date()) {
  return dayLabel.format(date);
}

export function statusLabel(status: JobStatus) {
  switch (status) {
    case "unassigned":
      return "Unassigned";
    case "assigned":
      return "Assigned";
    case "in_progress":
      return "On site";
    case "completed":
      return "Complete";
  }
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

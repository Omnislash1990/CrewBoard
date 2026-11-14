const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const jobDateLabel = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** True for a real calendar day stored as YYYY-MM-DD. */
export function isJobDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/** Local calendar day, so a UK evening does not roll into tomorrow via UTC. */
export function jobDateFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayJobDate(now = new Date()): string {
  return jobDateFromDate(now);
}

/**
 * Parse YYYY-MM-DD as a local date.
 * `new Date("YYYY-MM-DD")` is UTC midnight and can show the previous day.
 */
export function parseJobDate(value: string): Date | null {
  if (!isJobDate(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year!, month! - 1, day);
}

/** Chosen job date in en-GB, or the day the job was added when none is stored. */
export function formatJobDate(jobDate: string, fallback: Date) {
  return jobDateLabel.format(parseJobDate(jobDate) ?? fallback);
}

type DatedJob = {
  jobDate: string;
  createdAt: Date;
};

function sortKey(job: DatedJob): string {
  return isJobDate(job.jobDate) ? job.jobDate : jobDateFromDate(job.createdAt);
}

/** Later job dates first. Jobs with no jobDate use the day they were added. */
export function compareJobsByDate(a: DatedJob, b: DatedJob): number {
  const byDate = sortKey(b).localeCompare(sortKey(a));
  if (byDate !== 0) return byDate;
  return b.createdAt.getTime() - a.createdAt.getTime();
}

export function sortJobsByDate<T extends DatedJob>(jobs: T[]): T[] {
  return [...jobs].sort(compareJobsByDate);
}

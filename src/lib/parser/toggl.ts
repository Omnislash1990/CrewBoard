export type ParsedTogglJob = {
  client: string;
  title: string;
  duration: string;
  durationMinutes: number | null;
  notes: string;
  raw: string;
  valid: boolean;
  error?: string;
};

const DASH_SPLIT = /\s+[-–—]\s+/;
const TAB_SPLIT = /\t+/;

const DURATION_PATTERNS: Array<{
  re: RegExp;
  minutes: (match: RegExpExecArray) => number;
}> = [
  {
    re: /^(\d{1,3}):([0-5]\d):([0-5]\d)$/,
    minutes: (m) => Number(m[1]) * 60 + Number(m[2]) + Number(m[3]) / 60,
  },
  {
    re: /^(\d{1,3}):([0-5]\d)$/,
    minutes: (m) => Number(m[1]) * 60 + Number(m[2]),
  },
  {
    re: /^(\d+(?:\.\d+)?)\s*h(?:ours?)?(?:\s*(\d+)\s*m(?:in(?:s|utes?)?)?)?$/i,
    minutes: (m) => Number(m[1]) * 60 + Number(m[2] ?? 0),
  },
  {
    re: /^(\d+)\s*m(?:in(?:s|utes?)?)?$/i,
    minutes: (m) => Number(m[1]),
  },
];

export function parseTogglText(raw: string): ParsedTogglJob[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .filter((line) => !isHeaderRow(line))
    .map(parseTogglLine);
}

export function parseTogglLine(line: string): ParsedTogglJob {
  const parts = splitLine(line);

  if (parts.length < 2) {
    return invalid(line, "Need at least Client and Job, e.g. Client - Job - 2:30 - Notes");
  }

  const client = parts[0]?.trim() ?? "";
  const title = parts[1]?.trim() ?? "";

  if (!client || !title) {
    return invalid(line, "Client and job title are required.");
  }

  let durationRaw = "";
  let notes = "";

  if (parts.length === 2) {
    durationRaw = "";
    notes = "";
  } else if (parts.length === 3) {
    if (looksLikeDuration(parts[2] ?? "")) {
      durationRaw = parts[2] ?? "";
    } else {
      notes = parts[2] ?? "";
    }
  } else {
    const maybeDuration = parts[2] ?? "";
    if (looksLikeDuration(maybeDuration)) {
      durationRaw = maybeDuration;
      notes = parts.slice(3).join(" - ").trim();
    } else {
      notes = parts.slice(2).join(" - ").trim();
    }
  }

  const durationMinutes = durationRaw ? parseDurationMinutes(durationRaw) : null;
  const duration = formatDuration(durationMinutes, durationRaw);

  return {
    client,
    title,
    duration,
    durationMinutes,
    notes,
    raw: line,
    valid: true,
  };
}

export function formatDuration(
  minutes: number | null,
  fallback = "",
): string {
  if (minutes === null || Number.isNaN(minutes)) {
    return fallback.trim();
  }

  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins.toString().padStart(2, "0")}m`;
}

export const SAMPLE_TOGGL_PASTE = `Hargreaves - Bathroom reinstatement - 3:15 - Escape of water, strip ceiling and reboard
Oakwell HA - Void make-good - 2:00 - Kitchen units and vinyl flooring
Priory Court - Fire damage clean - 6:30 - Contents move and ozone treatment
Ashgrove - Boiler swap - 1h 45m - Like-for-like swap, gas test`;

function splitLine(line: string): string[] {
  if (line.includes("\t")) {
    return line.split(TAB_SPLIT).map((part) => part.trim()).filter(Boolean);
  }
  return line.split(DASH_SPLIT).map((part) => part.trim()).filter(Boolean);
}

function looksLikeDuration(value: string) {
  return parseDurationMinutes(value) !== null;
}

function parseDurationMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  for (const pattern of DURATION_PATTERNS) {
    const match = pattern.re.exec(trimmed);
    if (match) {
      const minutes = pattern.minutes(match);
      return Number.isFinite(minutes) ? minutes : null;
    }
  }

  return null;
}

function isHeaderRow(line: string) {
  const lower = line.toLowerCase();
  return (
    lower.includes("client") &&
    (lower.includes("duration") || lower.includes("time")) &&
    (lower.includes("job") || lower.includes("project") || lower.includes("description"))
  );
}

function invalid(raw: string, error: string): ParsedTogglJob {
  return {
    client: "",
    title: "",
    duration: "",
    durationMinutes: null,
    notes: "",
    raw,
    valid: false,
    error,
  };
}

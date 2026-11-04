import type { UserRole } from "@/types";

export type SessionPayload = {
  uid: string;
  role: UserRole;
};

export function parseSessionCookie(
  raw: string | undefined,
): SessionPayload | null {
  if (!raw) return null;

  try {
    let decoded = raw;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      decoded = raw;
    }

    const data = JSON.parse(decoded) as SessionPayload;
    if (!data.uid || (data.role !== "admin" && data.role !== "worker")) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function homePathForRole(role: UserRole) {
  return role === "admin" ? "/admin" : "/rota";
}

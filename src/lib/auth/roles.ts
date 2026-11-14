import type { UserRole } from "@/types";

/**
 * Crew screens treat anything other than admin as a worker. Role values written
 * by hand ("Worker", "worker ") must use the same rule, or the picker and the
 * crew page disagree.
 */
export function canonicalRole(value: unknown): UserRole {
  return typeof value === "string" && value.trim().toLowerCase() === "admin"
    ? "admin"
    : "worker";
}

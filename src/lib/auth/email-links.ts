import type { ActionCodeSettings } from "firebase/auth";

export const passwordResetSentMessage =
  "If that email address is valid, a reset link is on its way. Check your inbox.";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function passwordResetClientError(email: string): string | null {
  if (!EMAIL_PATTERN.test(email.trim())) {
    return "Enter a valid email address.";
  }
  return null;
}

/**
 * Unknown addresses use the same result as a real send so the form cannot
 * tell whether a CrewBoard account exists.
 */
export function isUnknownPasswordResetAccount(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "auth/user-not-found"
  );
}

export function actionCodeSettingsForOrigin(
  origin: string,
  continuePath: string,
): ActionCodeSettings {
  const path = continuePath.startsWith("/") ? continuePath : `/${continuePath}`;
  return {
    url: `${origin}${path}`,
    handleCodeInApp: false,
  };
}

/** Continue URL for Firebase emails. Omitted during SSR, where `window` is absent. */
export function browserActionCodeSettings(
  continuePath: string,
): ActionCodeSettings | undefined {
  if (typeof window === "undefined") return undefined;
  return actionCodeSettingsForOrigin(window.location.origin, continuePath);
}

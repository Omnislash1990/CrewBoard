"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { authErrorMessage } from "@/lib/auth/errors";
import { shouldPromptEmailVerification } from "@/lib/auth/email-links";
import { sendAccountVerificationEmail } from "@/lib/auth/verification";
import { tryGetFirebase } from "@/lib/firebase/client";
import type { User } from "firebase/auth";

const DISMISS_KEY = "crewboard.dismiss-email-verification";

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

const dismissListeners = new Set<() => void>();

function subscribeDismissed(listener: () => void) {
  dismissListeners.add(listener);
  return () => {
    dismissListeners.delete(listener);
  };
}

function dismissVerificationBanner() {
  try {
    sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // Hiding the banner for this view is enough if storage is blocked.
  }
  dismissListeners.forEach((listener) => listener());
}

export function EmailVerificationBanner() {
  const { user, profile } = useAuth();
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    readDismissed,
    () => false,
  );
  const [verifiedOverride, setVerifiedOverride] = useState<{
    uid: string;
    emailVerified: boolean;
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!uid) return;
    const current = tryGetFirebase()?.auth.currentUser;
    if (!current || current.uid !== uid || !shouldPromptEmailVerification(current)) {
      return;
    }
    const account: User = current;

    let cancelled = false;

    async function refresh() {
      try {
        await account.reload();
        if (cancelled) return;
        setVerifiedOverride({
          uid: account.uid,
          emailVerified: account.emailVerified,
        });
      } catch {
        // Keep the reminder if Firebase cannot be reached.
      }
    }

    void refresh();
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
    };
  }, [uid]);

  const emailVerified =
    verifiedOverride?.uid === uid
      ? verifiedOverride.emailVerified
      : (user?.emailVerified ?? false);
  const show =
    !dismissed &&
    profile !== null &&
    shouldPromptEmailVerification(
      user ? { emailVerified, providerData: user.providerData } : null,
    );

  if (!show || !user) return null;
  const signedInUser: User = user;

  async function onResend() {
    setSending(true);
    setError(null);
    setNotice(null);
    const result = await sendAccountVerificationEmail(signedInUser);
    setSending(false);
    if (!result.sent) {
      setError(
        authErrorMessage(
          result.error,
          "verify",
          typeof window === "undefined" ? undefined : window.location.host,
        ),
      );
      return;
    }
    setNotice("Confirmation email sent. Check your inbox.");
  }

  function onDismiss() {
    dismissVerificationBanner();
  }

  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Confirm your email so you can recover this account. You can keep
          using CrewBoard before you confirm.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onResend}
            disabled={sending}
            className="rounded-lg bg-orange-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-800 disabled:opacity-60"
          >
            {sending ? "Sending..." : "Resend verification email"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-amber-950 hover:bg-amber-100"
          >
            Dismiss
          </button>
        </div>
      </div>
      {notice ? (
        <p className="mx-auto mt-2 max-w-7xl" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mx-auto mt-2 max-w-7xl text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

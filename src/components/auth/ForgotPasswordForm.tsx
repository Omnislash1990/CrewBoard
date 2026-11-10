"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Logo } from "@/components/brand/Logo";
import { Spinner } from "@/components/ui/Spinner";
import {
  authErrorMessage,
  missingFirebaseConfigMessage,
} from "@/lib/auth/errors";
import {
  passwordResetClientError,
  passwordResetSentMessage,
} from "@/lib/auth/email-links";
import { requestPasswordReset } from "@/lib/auth/password-reset";

export function ForgotPasswordForm() {
  const { configured } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const validationError = passwordResetClientError(email);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    const result = await requestPasswordReset(email);
    setSubmitting(false);

    if (result.sent) {
      setSent(true);
      return;
    }

    setFormError(
      authErrorMessage(
        result.error,
        "reset",
        typeof window === "undefined" ? undefined : window.location.host,
      ),
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <h1 className="font-[family-name:var(--font-barlow)] text-2xl font-semibold text-stone-900">
            Reset your password
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Enter the email on your CrewBoard account. If it is valid, we will
            send a reset link.
          </p>
        </div>

        {!configured ? (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            {missingFirebaseConfigMessage}
          </div>
        ) : null}

        {sent ? (
          <div className="space-y-4">
            <p
              className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-950"
              role="status"
            >
              {passwordResetSentMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setFormError(null);
              }}
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-stone-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={formError ? true : undefined}
                aria-describedby={formError ? "reset-error" : undefined}
                className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 text-sm outline-none ring-orange-700/30 focus:border-orange-700 focus:ring-4"
                required
              />
            </div>

            {formError ? (
              <p
                id="reset-error"
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting || !configured}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
            >
              {submitting ? <Spinner className="h-4 w-4" /> : null}
              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-stone-500">
          <Link
            href="/login"
            className="font-semibold text-orange-700 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

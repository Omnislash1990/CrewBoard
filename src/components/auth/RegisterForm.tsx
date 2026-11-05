"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Logo } from "@/components/brand/Logo";
import { Spinner } from "@/components/ui/Spinner";
import {
  authErrorMessage,
  missingFirebaseConfigMessage,
} from "@/lib/auth/errors";
import { registerTradeWorker } from "@/lib/auth/register";
import { homePathForRole } from "@/lib/auth/session-payload";

export function RegisterForm() {
  const { configured, loading, profile, error: profileError } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const visibleError = formError ?? profileError;
  const creating = (submitting || loading) && !visibleError;

  useEffect(() => {
    if (!profile) return;
    router.replace(homePathForRole(profile.role));
  }, [profile, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const result = await registerTradeWorker(
      email.trim(),
      password,
      name.trim(),
      phone.trim(),
    );

    if (!result.success) {
      setFormError(authErrorMessage(result.error, "register"));
      setSubmitting(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 outline-none ring-orange-700/30 transition focus:border-orange-700 focus:ring-4";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-stone-50 px-5 py-12">
      <div className="w-full max-w-md">
        <Logo />
        <h1 className="mt-8 font-[family-name:var(--font-barlow)] text-3xl font-semibold tracking-tight text-stone-900">
          Join the crew
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Create a worker account. Office staff can promote you to admin later.
        </p>

        {!configured ? (
          <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {missingFirebaseConfigMessage}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">
              Full name
            </span>
            <input
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">
              Phone
            </span>
            <input
              type="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">
              Password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClass}
            />
          </label>

          {visibleError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {visibleError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!configured || creating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 py-2.5 font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? <Spinner className="h-4 w-4" /> : null}
            Create account
          </button>
        </form>

        <p className="mt-6 text-sm text-stone-500">
          Already on the crew?{" "}
          <Link href="/login" className="font-semibold text-orange-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}


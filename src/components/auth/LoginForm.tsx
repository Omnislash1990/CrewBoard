"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/components/providers/AuthProvider";
import { Logo } from "@/components/brand/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { homePathForRole } from "@/lib/auth/session-payload";

export function LoginForm() {
  const { signIn, configured, loading, profile, error } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    const next = searchParams.get("next");
    const fallback = homePathForRole(profile.role);
    const target =
      next &&
      ((profile.role === "admin" && next.startsWith("/admin")) ||
        (profile.role === "worker" && next.startsWith("/rota")))
        ? next
        : fallback;
    router.replace(target);
  }, [profile, router, searchParams]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh bg-stone-50">
      <aside className="relative hidden w-[46%] overflow-hidden bg-stone-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(194,65,12,0.28),_transparent_42%),linear-gradient(180deg,_#1c1917_0%,_#292524_100%)]" />
        <div className="relative">
          <Logo inverted markClassName="h-10 w-10 bg-orange-600" />
        </div>
        <div className="relative max-w-md space-y-4 text-stone-100">
          <p className="font-[family-name:var(--font-barlow)] text-4xl font-semibold leading-tight tracking-tight">
            Send the right crew to the right job.
          </p>
          <p className="text-base leading-relaxed text-stone-300">
            Paste Toggl time, assign trades, and push live rotas to the van.
            Built for restoration, repair and site work.
          </p>
        </div>
        <p className="relative text-sm text-stone-500">
          Dispatch for office. Rota for the crew.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-[family-name:var(--font-barlow)] text-3xl font-semibold tracking-tight text-stone-900">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Office staff land on dispatch. Crew land on today&apos;s rota.
          </p>

          {!configured ? (
            <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Add your Firebase keys to <code>.env.local</code> before signing
              in. Copy <code>.env.example</code> to get started.
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 outline-none ring-orange-700/30 transition focus:border-orange-700 focus:ring-4"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-stone-700">
                Password
              </span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 outline-none ring-orange-700/30 transition focus:border-orange-700 focus:ring-4"
              />
            </label>

            {formError || error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                {formError ?? error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!configured || submitting || loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 py-2.5 font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting || loading ? <Spinner className="h-4 w-4" /> : null}
              Continue
            </button>
          </form>

          <p className="mt-6 text-sm text-stone-500">
            New on the crew?{" "}
            <Link href="/register" className="font-semibold text-orange-700 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function authErrorMessage(err: unknown) {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email or password is incorrect.";
      case "auth/too-many-requests":
        return "Too many attempts. Try again shortly.";
      default:
        return "Could not sign in. Check your details and try again.";
    }
  }
  return "Could not sign in.";
}

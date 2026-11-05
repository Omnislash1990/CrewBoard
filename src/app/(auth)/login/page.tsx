"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Logo } from "@/components/brand/Logo";
import { Spinner } from "@/components/ui/Spinner";
import {
  authErrorMessage,
  missingFirebaseConfigMessage,
} from "@/lib/auth/errors";
import { homePathForRole } from "@/lib/auth/session-payload";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-stone-50 text-sm text-stone-500">
          Loading sign in
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const {
    signIn,
    signInWithGoogle,
    configured,
    loading,
    profile,
    error: profileError,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const visibleError = formError ?? profileError;
  const signingIn = isLoading && !visibleError;

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

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setFormError(null);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      setFormError(authErrorMessage(error, "sign-in"));
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setIsLoading(true);
    setFormError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      setFormError(
        authErrorMessage(
          error,
          "google",
          typeof window === "undefined" ? undefined : window.location.host,
        ),
      );
      setIsLoading(false);
    }
  }

  const busy = signingIn || (loading && !visibleError);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <h1 className="font-[family-name:var(--font-barlow)] text-2xl font-semibold text-stone-900">
            Sign in to CrewBoard
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Office staff land on dispatch. Crew land on today&apos;s rota.
          </p>
        </div>

        {!configured ? (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            {missingFirebaseConfigMessage}
          </div>
        ) : null}

        {visibleError ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {visibleError}
          </div>
        ) : null}

        <form onSubmit={handleEmailLogin} className="space-y-4">
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
              className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 text-sm outline-none ring-orange-700/30 focus:border-orange-700 focus:ring-4"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-stone-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 text-sm outline-none ring-orange-700/30 focus:border-orange-700 focus:ring-4"
              required
            />
          </div>
          <button
            type="submit"
            disabled={busy || !configured}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
          >
            {signingIn ? <Spinner className="h-4 w-4" /> : null}
            {signingIn ? "Signing in..." : "Sign in with Email"}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-stone-200" />
          <span className="mx-4 text-xs font-medium uppercase text-stone-400">
            Or
          </span>
          <div className="flex-grow border-t border-stone-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={busy || !configured}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>

        <p className="mt-6 text-center text-sm text-stone-500">
          New on the crew?{" "}
          <Link
            href="/register"
            className="font-semibold text-orange-700 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase/config";
import { setSessionCookie } from "@/lib/auth/session-client";
import { homePathForRole } from "@/lib/auth/session-payload";
import { Logo } from "@/components/brand/Logo";
import type { AppUser } from "@/types";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const configured = isFirebaseConfigured();

  const ensureFirestoreProfile = async (user: User): Promise<AppUser> => {
    const { db } = getFirebase();
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const newUserData: AppUser = {
        uid: user.uid,
        name: user.displayName || "New Worker",
        email: user.email || "",
        phone: user.phoneNumber || "",
        role: "worker",
      };
      await setDoc(userRef, newUserData);
      return newUserData;
    }

    const data = userSnap.data();
    return {
      uid: user.uid,
      name: typeof data.name === "string" ? data.name : user.displayName || "",
      email: typeof data.email === "string" ? data.email : user.email || "",
      phone: typeof data.phone === "string" ? data.phone : user.phoneNumber || "",
      role: data.role === "admin" ? "admin" : "worker",
    };
  };

  const redirectAfterAuth = (profile: AppUser) => {
    setSessionCookie({ uid: profile.uid, role: profile.role });
    const next = searchParams.get("next");
    const fallback = homePathForRole(profile.role);
    const target =
      next &&
      ((profile.role === "admin" && next.startsWith("/admin")) ||
        (profile.role === "worker" && next.startsWith("/rota")))
        ? next
        : fallback;
    router.replace(target);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { auth } = getFirebase();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const profile = await ensureFirestoreProfile(userCredential.user);
      redirectAfterAuth(profile);
    } catch {
      setError("Invalid email or password. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { auth } = getFirebase();
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const profile = await ensureFirestoreProfile(userCredential.user);
      redirectAfterAuth(profile);
    } catch (err) {
      setError(
        err instanceof FirebaseError
          ? googleErrorMessage(err)
          : "Google sign-in failed.",
      );
      setIsLoading(false);
    }
  };

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
            Add your Firebase keys to <code>.env.local</code> before signing in.
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 text-sm outline-none ring-orange-700/30 focus:border-orange-700 focus:ring-4"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 text-sm outline-none ring-orange-700/30 focus:border-orange-700 focus:ring-4"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !configured}
            className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign in with Email"}
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
          disabled={isLoading || !configured}
          className="flex w-full items-center justify-center space-x-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
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

function googleErrorMessage(err: FirebaseError) {
  switch (err.code) {
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled.";
    case "auth/popup-blocked":
      return "The sign-in popup was blocked. Allow popups and try again.";
    case "auth/account-exists-with-different-credential":
      return "That email already has an account. Sign in with email instead.";
    default:
      return "Google sign-in failed.";
  }
}

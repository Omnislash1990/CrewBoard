"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { db, isFirebaseConfigured, tryGetFirebase } from "@/lib/firebase/client";
import { loadOrCreateWorkerProfile } from "@/lib/firebase/users";
import { authErrorMessage } from "@/lib/auth/errors";
import { waitForProfileWrite } from "@/lib/auth/profile-write";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session-client";
import type { AppUser } from "@/types";

type AuthContextValue = {
  user: User | null;
  profile: AppUser | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const firebase = tryGetFirebase();
    if (!firebase) {
      return;
    }

    const unsubscribe = onAuthStateChanged(firebase.auth, async (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setProfile(null);
        clearSessionCookie();
        setLoading(false);
        return;
      }

      setUser(nextUser);
      setLoading(true);

      try {
        try {
          await waitForProfileWrite();
        } catch (writeError) {
          console.error(writeError);
        }

        if (!db) {
          throw new Error("Firestore is not available.");
        }
        const nextProfile = await loadOrCreateWorkerProfile(db, nextUser);

        setProfile(nextProfile);
        setSessionCookie({ uid: nextProfile.uid, role: nextProfile.role });
        setError(null);
      } catch (err) {
        console.error(err);
        setProfile(null);
        clearSessionCookie();
        setError(authErrorMessage(err, "profile"));
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const firebase = tryGetFirebase();
    if (!firebase) {
      throw new Error("Firebase is not configured.");
    }
    setError(null);
    await signInWithEmailAndPassword(firebase.auth, email, password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const firebase = tryGetFirebase();
    if (!firebase) {
      throw new Error("Firebase is not configured.");
    }
    setError(null);
    await signInWithPopup(firebase.auth, new GoogleAuthProvider());
  }, []);

  const signOut = useCallback(async () => {
    const firebase = tryGetFirebase();
    clearSessionCookie();
    if (firebase) {
      await firebaseSignOut(firebase.auth);
    }
    setUser(null);
    setProfile(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      configured,
      error,
      signIn,
      signInWithGoogle,
      signOut,
    }),
    [
      user,
      profile,
      loading,
      configured,
      error,
      signIn,
      signInWithGoogle,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

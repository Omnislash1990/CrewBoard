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
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { isFirebaseConfigured, tryGetFirebase } from "@/lib/firebase/client";
import { fetchUserProfileWithRetry } from "@/lib/firebase/users";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session-client";
import type { AppUser } from "@/types";

type AuthContextValue = {
  user: User | null;
  profile: AppUser | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
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
      setError(null);

      if (!nextUser) {
        setUser(null);
        setProfile(null);
        clearSessionCookie();
        setLoading(false);
        return;
      }

      setUser(nextUser);

      try {
        const nextProfile = await fetchUserProfileWithRetry(
          firebase.db,
          nextUser.uid,
        );
        setProfile(nextProfile);

        if (nextProfile) {
          setSessionCookie({ uid: nextProfile.uid, role: nextProfile.role });
        } else {
          clearSessionCookie();
          setError(
            "This login has no CrewBoard profile. Ask an admin to add a users document for this account.",
          );
        }
      } catch (err) {
        console.error(err);
        setProfile(null);
        clearSessionCookie();
        setError("Could not load your CrewBoard profile.");
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

  const signOut = useCallback(async () => {
    const firebase = tryGetFirebase();
    clearSessionCookie();
    if (firebase) {
      await firebaseSignOut(firebase.auth);
    }
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      configured,
      error,
      signIn,
      signOut,
    }),
    [user, profile, loading, configured, error, signIn, signOut],
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

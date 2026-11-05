import { FirebaseError } from "firebase/app";
import { doc, getDoc, setDoc, type Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { AppUser, UserRole } from "@/types";

export async function fetchUserProfile(
  db: Firestore,
  uid: string,
): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;

  const data = snap.data();
  const role: UserRole = data.role === "admin" ? "admin" : "worker";

  return {
    uid,
    name: typeof data.name === "string" ? data.name : "",
    email: typeof data.email === "string" ? data.email : "",
    role,
    phone: typeof data.phone === "string" ? data.phone : "",
  };
}

export async function loadOrCreateWorkerProfile(
  db: Firestore,
  user: User,
  details?: { name?: string; phone?: string },
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await ensureWorkerProfile(db, user, details);
    } catch (error) {
      lastError = error;
      const retry =
        error instanceof FirebaseError &&
        (error.code === "permission-denied" ||
          error.code === "unauthenticated");
      if (!retry || attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }

  throw lastError;
}

export async function ensureWorkerProfile(
  db: Firestore,
  user: User,
  details?: { name?: string; phone?: string },
): Promise<AppUser> {
  const existing = await fetchUserProfile(db, user.uid);
  if (existing) return existing;

  const userData: AppUser = {
    uid: user.uid,
    name: details?.name?.trim() || user.displayName || "New Worker",
    email: user.email || "",
    phone: details?.phone?.trim() || user.phoneNumber || "",
    role: "worker",
  };

  try {
    await setDoc(doc(db, "users", user.uid), userData);
    return userData;
  } catch (error) {
    if (error instanceof FirebaseError && error.code === "permission-denied") {
      const raced = await fetchUserProfile(db, user.uid);
      if (raced) return raced;
    }
    throw error;
  }
}

export function userFromDoc(
  id: string,
  data: Record<string, unknown>,
): AppUser {
  return {
    uid: typeof data.uid === "string" ? data.uid : id,
    name: typeof data.name === "string" ? data.name : "Unnamed",
    email: typeof data.email === "string" ? data.email : "",
    role: data.role === "admin" ? "admin" : "worker",
    phone: typeof data.phone === "string" ? data.phone : "",
  };
}

import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  where,
  type Firestore,
  type QuerySnapshot,
} from "firebase/firestore";
import { canonicalRole } from "@/lib/auth/roles";
import type { AppUser, UserRole } from "@/types";

export async function fetchUserProfile(
  db: Firestore,
  uid: string,
): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;

  const data = snap.data();

  return {
    uid,
    name: typeof data.name === "string" ? data.name : "",
    email: typeof data.email === "string" ? data.email : "",
    role: canonicalRole(data.role),
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

function clip(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Rewrites a complete profile. A role patch on its own is rejected when a
 * hand-written document is missing `uid` or still has extra keys, so the
 * person never becomes a worker and the crew picker cannot see them.
 */
export async function setUserRole(
  db: Firestore,
  userId: string,
  role: UserRole,
) {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("That profile does not exist.");
  }
  const data = snap.data();
  const name = clip(data.name, 180) || "Crew member";
  await setDoc(ref, {
    uid: userId,
    name,
    email: clip(data.email, 300),
    phone: clip(data.phone, 30),
    role,
  });
}

export function userFromDoc(
  id: string,
  data: Record<string, unknown>,
): AppUser {
  const fieldUid = typeof data.uid === "string" ? data.uid.trim() : "";
  return {
    uid: fieldUid || id,
    name: typeof data.name === "string" && data.name.trim() ? data.name : "Unnamed",
    email: typeof data.email === "string" ? data.email : "",
    role: canonicalRole(data.role),
    phone: typeof data.phone === "string" ? data.phone : "",
  };
}

function workersFromSnapshot(snap: QuerySnapshot) {
  return snap.docs
    .map((docSnap) => userFromDoc(docSnap.id, docSnap.data()))
    .filter((person) => person.role === "worker")
    .sort((a, b) => a.name.localeCompare(b.name, "en-GB"));
}

/**
 * Admins can read the whole crew. Filtering here (instead of
 * `where("role", "==", "worker")`) keeps profiles whose role is missing or
 * not exactly the string "worker". If that read is denied, fall back to the
 * role query so a rules mismatch does not leave the picker blank.
 */
export function subscribeCrewWorkers(
  db: Firestore,
  onWorkers: (workers: AppUser[]) => void,
  onError?: (error: unknown) => void,
) {
  const users = collection(db, "users");
  let active = true;
  let current = () => {};

  const listen = (useRoleQuery: boolean) => {
    const source = useRoleQuery
      ? query(users, where("role", "==", "worker"))
      : users;
    return onSnapshot(
      source,
      (snap) => {
        if (!active) return;
        onWorkers(workersFromSnapshot(snap));
      },
      (error) => {
        console.error("Crew list failed", error);
        if (!active) return;
        if (!useRoleQuery) {
          current();
          current = listen(true);
          return;
        }
        onError?.(error);
      },
    );
  };

  current = listen(false);
  return () => {
    active = false;
    current();
  };
}

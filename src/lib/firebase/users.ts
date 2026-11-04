import { doc, getDoc, type Firestore } from "firebase/firestore";
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

export async function fetchUserProfileWithRetry(
  db: Firestore,
  uid: string,
  attempts = 6,
  delayMs = 200,
): Promise<AppUser | null> {
  for (let i = 0; i < attempts; i++) {
    const profile = await fetchUserProfile(db, uid);
    if (profile) return profile;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return null;
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

import { createUserWithEmailAndPassword } from "firebase/auth";
import { getFirebase } from "@/lib/firebase/config";
import { loadOrCreateWorkerProfile } from "@/lib/firebase/users";
import { beginProfileWrite } from "@/lib/auth/profile-write";
import type { AppUser } from "@/types";

export async function registerTradeWorker(
  email: string,
  password: string,
  name: string,
  phone: string,
): Promise<{ success: true; user: AppUser } | { success: false; error: unknown }> {
  const gate = beginProfileWrite();

  try {
    const { auth, db } = getFirebase();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = await loadOrCreateWorkerProfile(db, userCredential.user, {
      name,
      phone,
    });
    gate.resolve();
    return { success: true, user };
  } catch (error) {
    gate.reject(error);
    console.error("Registration error:", error);
    return { success: false, error };
  }
}

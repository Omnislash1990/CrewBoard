import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase/config";
import { AppUser } from "@/types";

export async function registerTradeWorker(
  email: string,
  password: string,
  name: string,
  phone: string,
) {
  try {
    const { auth, db } = getFirebase();

    // 1. Create the Auth account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // 2. Create the Firestore user document
    const userData: AppUser = {
      uid: user.uid,
      name,
      email,
      phone,
      role: "worker", // Defaults to worker per security rules
    };

    await setDoc(doc(db, "users", user.uid), userData);
    return { success: true, user: userData };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error };
  }
}

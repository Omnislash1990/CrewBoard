import { sendPasswordResetEmail } from "firebase/auth";
import {
  browserActionCodeSettings,
  isUnknownPasswordResetAccount,
} from "@/lib/auth/email-links";
import { getFirebase } from "@/lib/firebase/client";

export async function requestPasswordReset(
  email: string,
): Promise<{ sent: true } | { sent: false; error: unknown }> {
  if (typeof window === "undefined") {
    return {
      sent: false,
      error: new Error("Password reset can only be sent from the browser."),
    };
  }

  try {
    const { auth } = getFirebase();
    await sendPasswordResetEmail(
      auth,
      email.trim(),
      browserActionCodeSettings("/login"),
    );
    return { sent: true };
  } catch (error) {
    if (isUnknownPasswordResetAccount(error)) {
      return { sent: true };
    }
    console.error("Password reset error:", error);
    return { sent: false, error };
  }
}

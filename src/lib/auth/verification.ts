import { sendEmailVerification, type User } from "firebase/auth";
import { browserActionCodeSettings } from "@/lib/auth/email-links";

export async function sendAccountVerificationEmail(
  user: User,
): Promise<{ sent: true } | { sent: false; error: unknown }> {
  if (typeof window === "undefined") {
    return {
      sent: false,
      error: new Error("Verification email can only be sent from the browser."),
    };
  }

  try {
    await sendEmailVerification(user, browserActionCodeSettings("/login"));
    return { sent: true };
  } catch (error) {
    console.error("Verification email error:", error);
    return { sent: false, error };
  }
}

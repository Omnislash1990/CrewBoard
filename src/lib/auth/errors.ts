export type AuthAction = "sign-in" | "register" | "google" | "profile" | "reset";

type CodedError = {
  code: string;
  message: string;
};

export const missingFirebaseConfigMessage =
  "Firebase is not configured for this deployment. Add the web app keys and redeploy.";

function asCodedError(error: unknown): CodedError | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  const code = error.code;
  if (typeof code !== "string" || code.length === 0) return null;

  const message =
    "message" in error && typeof error.message === "string" ? error.message : "";

  return { code, message };
}

function mentionsInvalidApiKey(error: CodedError) {
  return (
    error.code.includes("api-key-not-valid") ||
    error.code === "auth/invalid-api-key" ||
    error.message.includes("API key not valid") ||
    error.message.includes("api-key-not-valid")
  );
}

function mentionsMissingDatabase(error: CodedError) {
  return (
    /database \(default\) does not exist/i.test(error.message) ||
    (error.code === "not-found" && /firestore|database/i.test(error.message))
  );
}

export function authErrorMessage(
  error: unknown,
  action: AuthAction,
  host?: string,
) {
  const coded = asCodedError(error);

  if (coded && mentionsInvalidApiKey(coded)) {
    return "The Firebase web API key on this deployment was rejected. Update NEXT_PUBLIC_FIREBASE_API_KEY in Vercel with the current web app key, then redeploy.";
  }

  if (coded && mentionsMissingDatabase(coded)) {
    return "Cloud Firestore has no default database for this project, so the crew profile could not be saved. Create the database, deploy the security rules, and try again.";
  }

  if (coded?.code === "permission-denied") {
    return "The crew profile could not be saved. Deploy the Firestore rules that let a signed-in worker create their own users document.";
  }

  if (!coded) {
    return fallback(action);
  }

  switch (coded.code) {
    case "auth/unauthorized-domain":
      return host
        ? `Google sign-in is not allowed from ${host}. Add that host under Firebase Authentication → Settings → Authorised domains.`
        : "Google sign-in is not allowed from this host. Add it under Firebase Authentication → Settings → Authorised domains.";
    case "auth/operation-not-allowed":
      if (action === "google") {
        return "Google sign-in is turned off in Firebase Authentication. Enable the Google provider and try again.";
      }
      if (action === "reset") {
        return "Password reset email is turned off in Firebase Authentication. Enable the Email/Password provider and try again.";
      }
      return "Email and password sign-in is turned off in Firebase Authentication. Enable the Email/Password provider and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled.";
    case "auth/popup-blocked":
      return "The sign-in popup was blocked. Allow popups for this site and try again.";
    case "auth/account-exists-with-different-credential":
      return "That email already has an account. Sign in with the original method.";
    case "auth/email-already-in-use":
      return "That email already has an account. Sign in instead.";
    case "auth/weak-password":
      return "Use at least 6 characters for the password.";
    case "auth/invalid-email":
    case "auth/missing-email":
      return "Enter a valid email address.";
    case "auth/unauthorized-continue-uri":
    case "auth/invalid-continue-uri":
      return host
        ? `Password reset links cannot return to ${host}. Add that host under Firebase Authentication → Settings → Authorised domains.`
        : "Password reset links cannot return to this host. Add it under Firebase Authentication → Settings → Authorised domains.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      if (action === "reset") return fallback(action);
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    case "auth/network-request-failed":
      return "Could not reach Firebase. Check the connection and try again.";
    default:
      return fallback(action);
  }
}

function fallback(action: AuthAction) {
  switch (action) {
    case "google":
      return "Google sign-in failed.";
    case "register":
      return "Could not create the account. Try again.";
    case "profile":
      return "Could not load your CrewBoard profile.";
    case "reset":
      return "Could not send the reset email. Try again.";
    default:
      return "Could not sign in. Try again.";
  }
}

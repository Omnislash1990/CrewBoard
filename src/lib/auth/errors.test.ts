import assert from "node:assert/strict";
import test from "node:test";
import { authErrorMessage } from "./errors.ts";
import { beginProfileWrite, waitForProfileWrite } from "./profile-write.ts";

test("invalid API key is explained for every auth action", () => {
  const error = {
    code: "auth/api-key-not-valid.-please-pass-a-valid-api-key.",
    message: "Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.).",
  };

  for (const action of [
    "sign-in",
    "register",
    "google",
    "profile",
    "reset",
    "verify",
  ] as const) {
    const message = authErrorMessage(error, action);
    assert.match(message, /NEXT_PUBLIC_FIREBASE_API_KEY/);
    assert.doesNotMatch(message, /password is incorrect/i);
  }
});

test("email sign-in no longer hides configuration failures as a bad password", () => {
  assert.match(
    authErrorMessage(
      { code: "auth/operation-not-allowed", message: "disabled" },
      "sign-in",
    ),
    /Email\/Password/,
  );
  assert.equal(
    authErrorMessage(
      { code: "auth/invalid-credential", message: "bad" },
      "sign-in",
    ),
    "Email or password is incorrect.",
  );
});

test("Google domain and provider failures name the host", () => {
  assert.match(
    authErrorMessage(
      { code: "auth/unauthorized-domain", message: "domain" },
      "google",
      "crew-board-chi.vercel.app",
    ),
    /crew-board-chi\.vercel\.app/,
  );
  assert.match(
    authErrorMessage(
      { code: "auth/operation-not-allowed", message: "disabled" },
      "google",
    ),
    /Google provider/,
  );
});

test("missing Firestore database is distinct from a rules denial", () => {
  assert.match(
    authErrorMessage(
      {
        code: "not-found",
        message:
          "The database (default) does not exist for project crewboard-bdbdc",
      },
      "profile",
    ),
    /no default database/,
  );
  assert.match(
    authErrorMessage({ code: "permission-denied", message: "denied" }, "profile"),
    /Firestore rules/,
  );
});

test("sign-in still treats an unknown email as a bad password", () => {
  assert.equal(
    authErrorMessage({ code: "auth/user-not-found", message: "missing" }, "sign-in"),
    "Email or password is incorrect.",
  );
});

test("reset and verification name real Firebase failures", () => {
  assert.equal(
    authErrorMessage({ code: "auth/invalid-email", message: "bad" }, "reset"),
    "Enter a valid email address.",
  );
  assert.match(
    authErrorMessage({ code: "auth/too-many-requests", message: "slow" }, "reset"),
    /Too many attempts/,
  );
  assert.match(
    authErrorMessage({ code: "auth/invalid-api-key", message: "bad" }, "verify"),
    /NEXT_PUBLIC_FIREBASE_API_KEY/,
  );
  assert.match(
    authErrorMessage(
      { code: "auth/unauthorized-continue-uri", message: "bad" },
      "reset",
      "crew.example",
    ),
    /crew\.example/,
  );
  assert.equal(
    authErrorMessage(new Error("offline"), "reset"),
    "Could not send the reset email. Try again.",
  );
  assert.equal(
    authErrorMessage(new Error("offline"), "verify"),
    "Could not send the verification email. Try again.",
  );
});

test("profile listener waits for a write opened before auth resolves", async () => {
  const gate = beginProfileWrite();
  let finished = false;
  const pending = waitForProfileWrite().then(() => {
    finished = true;
  });

  await Promise.resolve();
  assert.equal(finished, false);

  gate.resolve();
  await pending;
  assert.equal(finished, true);
  await waitForProfileWrite();
});

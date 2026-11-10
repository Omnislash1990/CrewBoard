import assert from "node:assert/strict";
import test from "node:test";
import { authErrorMessage } from "./errors.ts";
import { beginProfileWrite, waitForProfileWrite } from "./profile-write.ts";

test("invalid API key is explained for every auth action", () => {
  const error = {
    code: "auth/api-key-not-valid.-please-pass-a-valid-api-key.",
    message: "Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.).",
  };

  for (const action of ["sign-in", "register", "google", "profile"] as const) {
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

test("password reset does not reveal whether the email exists", () => {
  assert.match(
    authErrorMessage({ code: "auth/user-not-found", message: "missing" }, "reset"),
    /Could not send the reset email/,
  );
  assert.doesNotMatch(
    authErrorMessage({ code: "auth/user-not-found", message: "missing" }, "reset"),
    /no account|not found|incorrect/i,
  );
  assert.match(
    authErrorMessage(
      { code: "auth/invalid-continue-uri", message: "uri" },
      "reset",
      "crew-board-chi.vercel.app",
    ),
    /crew-board-chi\.vercel\.app/,
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

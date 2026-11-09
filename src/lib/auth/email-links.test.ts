import assert from "node:assert/strict";
import test from "node:test";
import {
  actionCodeSettingsForOrigin,
  browserActionCodeSettings,
  isUnknownPasswordResetAccount,
  passwordResetClientError,
  passwordResetSentMessage,
  shouldPromptEmailVerification,
} from "./email-links.ts";

test("password reset rejects empty and invalid emails before Firebase", () => {
  assert.equal(passwordResetClientError(""), "Enter a valid email address.");
  assert.equal(
    passwordResetClientError("not-an-email"),
    "Enter a valid email address.",
  );
  assert.equal(passwordResetClientError("a@b"), "Enter a valid email address.");
  assert.equal(passwordResetClientError("  crew@example.co.uk  "), null);
});

test("unknown password-reset accounts are concealed", () => {
  assert.equal(
    isUnknownPasswordResetAccount({ code: "auth/user-not-found" }),
    true,
  );
  assert.equal(
    isUnknownPasswordResetAccount({ code: "auth/invalid-email" }),
    false,
  );
  assert.equal(isUnknownPasswordResetAccount(null), false);
  assert.match(passwordResetSentMessage, /if that email address is valid/i);
});

test("verification prompts stay quiet for Google and verified users", () => {
  assert.equal(shouldPromptEmailVerification(null), false);
  assert.equal(shouldPromptEmailVerification(undefined), false);
  assert.equal(
    shouldPromptEmailVerification({
      emailVerified: false,
      providerData: [{ providerId: "password" }],
    }),
    true,
  );
  assert.equal(
    shouldPromptEmailVerification({
      emailVerified: true,
      providerData: [{ providerId: "password" }],
    }),
    false,
  );
  assert.equal(
    shouldPromptEmailVerification({
      emailVerified: false,
      providerData: [{ providerId: "google.com" }],
    }),
    false,
  );
  assert.equal(
    shouldPromptEmailVerification({
      emailVerified: false,
      providerData: [
        { providerId: "google.com" },
        { providerId: "password" },
      ],
    }),
    false,
  );
  assert.equal(
    shouldPromptEmailVerification({
      emailVerified: false,
      providerData: [],
    }),
    false,
  );
});

test("email continue URLs are omitted outside the browser", () => {
  assert.equal(browserActionCodeSettings("/login"), undefined);
  assert.deepEqual(actionCodeSettingsForOrigin("https://crew.example", "/login"), {
    url: "https://crew.example/login",
    handleCodeInApp: false,
  });
  assert.equal(
    actionCodeSettingsForOrigin("https://crew.example", "rota").url,
    "https://crew.example/rota",
  );
});

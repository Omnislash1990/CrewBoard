import assert from "node:assert/strict";
import { createSign, generateKeyPairSync } from "node:crypto";
import test from "node:test";
import {
  TokenVerificationError,
  verifyFirebaseIdToken,
} from "./verify-id-token.ts";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString();
const projectId = "crewboard-test";

function signToken(payload: Record<string, unknown>, kid = "test-key") {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", kid, typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const data = `${header}.${body}`;
  const signature = createSign("RSA-SHA256")
    .update(data)
    .sign(privateKey)
    .toString("base64url");
  return `${data}.${signature}`;
}

function verify(token: string, now = 1_700_000_000_000) {
  return verifyFirebaseIdToken(token, projectId, {
    now: () => now,
    loadCertificates: async () => ({ "test-key": publicPem }),
  });
}

const validPayload = {
  aud: projectId,
  iss: `https://securetoken.google.com/${projectId}`,
  sub: "admin-1",
  exp: 1_800_000_000,
  auth_time: 1_700_000_000,
  email: "sam@crew.test",
};

test("a signed Firebase ID token yields the user id", async () => {
  const verified = await verify(signToken(validPayload));
  assert.equal(verified.uid, "admin-1");
  assert.equal(verified.email, "sam@crew.test");
});

test("a bad signature, audience, or expiry is rejected", async () => {
  const token = signToken(validPayload);
  const [header, body, signature] = token.split(".");
  await assert.rejects(
    () => verify(`${header}.${body}.${signature?.slice(0, -2)}aa`),
    TokenVerificationError,
  );
  await assert.rejects(
    () => verify(signToken({ ...validPayload, aud: "other-project" })),
    /audience/i,
  );
  await assert.rejects(
    () => verify(signToken({ ...validPayload, exp: 1_600_000_000 })),
    /expired/i,
  );
});

test("a cookie is not a Firebase ID token", async () => {
  await assert.rejects(
    () => verify("crewboard_session=not-a-jwt"),
    TokenVerificationError,
  );
});

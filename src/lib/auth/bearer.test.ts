import assert from "node:assert/strict";
import test from "node:test";
import { bearerToken } from "./bearer.ts";

test("notification auth uses the bearer token and ignores a forged session cookie", () => {
  assert.equal(bearerToken(null), null);
  assert.equal(
    bearerToken(
      'cookie=crewboard_session=%7B%22uid%22%3A%22attacker%22%2C%22role%22%3A%22admin%22%7D',
    ),
    null,
  );
  assert.equal(bearerToken("Bearer firebase-id-token"), "firebase-id-token");
});

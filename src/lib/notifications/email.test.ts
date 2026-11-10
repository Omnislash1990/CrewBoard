import assert from "node:assert/strict";
import test from "node:test";
import { readEmailConfig } from "./email.ts";

test("crew email is skipped unless both provider settings are present", () => {
  assert.equal(readEmailConfig({}), null);
  assert.equal(readEmailConfig({ RESEND_API_KEY: "re_test" }), null);
  assert.equal(
    readEmailConfig({ NOTIFY_EMAIL_FROM: "CrewBoard <crew@example.com>" }),
    null,
  );
  assert.deepEqual(
    readEmailConfig({
      RESEND_API_KEY: " re_test ",
      NOTIFY_EMAIL_FROM: " CrewBoard <crew@example.com> ",
    }),
    { apiKey: "re_test", from: "CrewBoard <crew@example.com>" },
  );
});

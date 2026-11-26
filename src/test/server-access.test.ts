import { describe, it, expect, afterEach } from "vitest";
import { serverAccessKey, serverAccessHash } from "@/lib/server-access.server";

describe("website server access", () => {
  afterEach(() => { delete process.env.CRON_SECRET; });
  it("ignores secrets shorter than 16 characters", () => {
    process.env.CRON_SECRET = "short";
    expect(serverAccessKey()).toBe("");
  });
  it("stores only a 64-character SHA-256 fingerprint of the secret", async () => {
    process.env.CRON_SECRET = "a-long-enough-cron-secret";
    const hash = await serverAccessHash();
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("cron");
  });
});

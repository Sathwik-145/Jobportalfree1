import { describe, it, expect } from "vitest";
import { cleanEnvValue, cleanSupabaseUrl } from "@/lib/supabase-env";

describe("cleanSupabaseUrl", () => {
  const good = "https://abcdefghijklmnop.supabase.co";
  it.each([
    [good],
    [good + "/"],
    [good + "/rest/v1"],
    [good + "/rest/v1/"],
    [good + "/auth/v1/signup?x=1"],
    [`"${good}"`],
    [`'${good}/'`],
    [`  ${good}  `],
    ["abcdefghijklmnop.supabase.co"],
    ["abcdefghijklmnop"],
    ["HTTPS://abcdefghijklmnop.supabase.co/"],
  ])("normalises %s", (input) => {
    expect(cleanSupabaseUrl(input)).toBe(good);
  });
  it("returns empty for empty or missing values", () => {
    expect(cleanSupabaseUrl("")).toBe("");
    expect(cleanSupabaseUrl(undefined)).toBe("");
  });
  it("keeps a local address usable", () => {
    expect(cleanSupabaseUrl("http://127.0.0.1:54321/")).toBe("http://127.0.0.1:54321");
  });
});

describe("cleanEnvValue", () => {
  it("strips spaces and quotes", () => {
    expect(cleanEnvValue('  "sb_publishable_abc"  ')).toBe("sb_publishable_abc");
    expect(cleanEnvValue(undefined)).toBe("");
  });
});

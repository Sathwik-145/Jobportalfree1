import { describe, it, expect } from "vitest";
import { fastAiOptions } from "@/lib/ai-speed";

describe("fast AI options", () => {
  it("sends no provider-specific thinking fields (Gemini rejects mismatched ones)", () => {
    expect(fastAiOptions("minimal")).toEqual({});
    expect(fastAiOptions("low")).toEqual({});
  });
});

describe("fast chat models", () => {
  it("uses the lite model for live chat replies", async () => {
    const { FAST_CHAT_MODELS } = await import("@/lib/ai-speed");
    expect(FAST_CHAT_MODELS.gemini).toBe("gemini-flash-lite-latest");
  });
});

import { describe, expect, it, vi } from "vitest";
import { MockLanguageModelV3 } from "ai/test";
import { generateBatch, parseJsonLoose, friendlyError } from "@/lib/admin-assistant.server";

vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({}) }));

const modelReturning = (text: string) =>
  new MockLanguageModelV3({
    doGenerate: (async () => ({
      content: [{ type: "text", text }],
      finishReason: "stop",
      usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
      warnings: [],
    })) as any,
  });

const mcq = (q: string) => ({ type: "mcq", question: q, options: ["a", "b", "c", "d"], correct_index: 1, category: "JS", difficulty: "easy", marks: 1, explanation: "because" });

describe("admin assistant", () => {
  it("parses JSON wrapped in fences and chatter", () => {
    expect(parseJsonLoose('Sure!\n```json\n{"questions":[1]}\n```\nDone')).toEqual({ questions: [1] });
    expect(parseJsonLoose("no json here")).toBeNull();
  });

  it("generates MCQs from a fenced reply and drops duplicates", async () => {
    const reply = "```json\n" + JSON.stringify({ questions: [mcq("What is typeof null?"), mcq("what is typeof null"), mcq("Which keyword declares a constant?")] }) + "\n```";
    const out = await generateBatch([modelReturning(reply)], "mcq", 2, "JavaScript", "easy", []);
    expect(out).toHaveLength(2);
  });

  it("tolerates loose fields from the model", async () => {
    const loose = { questions: [{ question: "Q1?", options: ["a", "b", "c", "d", "e"], correctIndex: "2", marks: "1" }] };
    const out = await generateBatch([modelReturning(JSON.stringify(loose))], "mcq", 1, "JS", "easy", []);
    expect(out[0]).toMatchObject({ type: "mcq", correct_index: 2 });
  });

  it("explains failures with the real reason", async () => {
    await expect(generateBatch([modelReturning("not json")], "mcq", 1, "JS", "easy", [])).rejects.toThrow(/No valid questions/);
    expect(friendlyError(new Error("No valid questions were returned"))).toMatch(/usable questions/);
  });
});

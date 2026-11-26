import { describe, it, expect } from "vitest";
import { buildStarterPack } from "@/exam/data/starterPack";

describe("starter test pack", () => {
  const { exams, mcqs } = buildStarterPack();
  const count = (d: string) => exams.filter((e) => e.description.includes(`· ${d} ·`)).length;
  it("has 10 easy, 5 medium, 5 hard tests", () => {
    expect(count("easy")).toBe(10);
    expect(count("medium")).toBe(5);
    expect(count("hard")).toBe(5);
  });
  it("every test's MCQs exist", () => {
    const ids = new Set(mcqs.map((m) => m.id));
    for (const e of exams) for (const id of e.mcqIds) expect(ids.has(id)).toBe(true);
  });
});

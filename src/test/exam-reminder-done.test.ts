import { describe, it, expect } from "vitest";
import { computeDoneSet } from "@/lib/exam-reminder-done";

describe("reminder skip logic", () => {
  it("coding-only submission marks the exam containing that question as done", () => {
    const done = computeDoneSet({ examRows: [], codingRows: [{ student_id: "s1", question_id: "q1" }], exams: [{ id: "e1", question_ids: ["q1"] }, { id: "e2", question_ids: ["q2"] }] });
    expect(done.has("s1|e1")).toBe(true);
    expect(done.has("s1|e2")).toBe(false);
  });
  it("mcq submission marks its exam done", () => {
    const done = computeDoneSet({ examRows: [{ student_id: "s2", exam_id: "e3" }], codingRows: [], exams: [] });
    expect(done.has("s2|e3")).toBe(true);
  });
});

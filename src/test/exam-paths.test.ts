import { describe, expect, it } from "vitest";
import { isExamPage } from "@/lib/examPaths";

describe("chat assistant is hidden during exams", () => {
  for (const p of ["/exam-login", "/exam-student", "/exam-student/exam", "/exam-take/q1", "/exam-instructions", "/exam-permissions", "/system-check", "/start", "/quick-start", "/exam-apply/abc", "/exam-register", "/assessments/test"]) {
    it(`hides on ${p}`, () => expect(isExamPage(p)).toBe(true));
  }
  for (const p of ["/", "/jobs", "/jobs/123", "/assessments", "/interview-prep", "/exam-admin", "/exam-admin/tests", "/admin", "/startups"]) {
    it(`shows on ${p}`, () => expect(isExamPage(p)).toBe(false));
  }
});

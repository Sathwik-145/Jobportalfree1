import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";

// Every page that existed in the original app must still have its own address.
const PATHS = [
  "/", "/jobs", "/jobs/abc", "/login", "/register", "/assessments", "/assessments/test",
  "/exam-login", "/start", "/exam-student", "/exam-take/q1", "/exam-apply/link1",
  "/admin", "/admin/manage-jobs", "/admin/edit-job/abc", "/admin/signups",
  "/exam-admin", "/exam-admin/tests", "/exam-admin/settings", "/exam-admin/reports",
  "/exam-admin/recordings",
];

describe("page addresses", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
  for (const path of PATHS) {
    it(`matches a real page for ${path}`, () => {
      const last = router.matchRoutes(path).at(-1);
      expect(last?.routeId).not.toBe("__root__");
      expect(last?.status).not.toBe("notFound");
    });
  }
  it("falls back to not found for unknown addresses", () => {
    const matches = router.matchRoutes("/definitely-not-a-page");
    expect(matches.at(-1)?.routeId).toBe("__root__");
  });
});

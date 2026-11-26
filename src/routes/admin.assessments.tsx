import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/AdminAssessments"));

export const Route = createFileRoute("/admin/assessments")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Assessments · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: assessments." },
      { property: "og:title", content: "Assessments · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: assessments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

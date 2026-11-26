import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/FindJobs"));

export const Route = createFileRoute("/admin/find-jobs")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Find recent jobs · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: find recent jobs." },
      { property: "og:title", content: "Find recent jobs · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: find recent jobs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/ManageJobs"));

export const Route = createFileRoute("/admin/manage-jobs")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Manage jobs · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: manage jobs." },
      { property: "og:title", content: "Manage jobs · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: manage jobs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

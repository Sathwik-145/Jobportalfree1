import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/AdminApplications"));

export const Route = createFileRoute("/admin/applications")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Applications · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: applications." },
      { property: "og:title", content: "Applications · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: applications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/AdminTracking"));

export const Route = createFileRoute("/admin/tracking")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Application tracking · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: application tracking." },
      { property: "og:title", content: "Application tracking · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: application tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/AdminSecurity"));

export const Route = createFileRoute("/admin/security")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Security · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: security." },
      { property: "og:title", content: "Security · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: security." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

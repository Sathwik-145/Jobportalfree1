import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/ManageTemplates"));

export const Route = createFileRoute("/admin/templates")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Resume templates · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: resume templates." },
      { property: "og:title", content: "Resume templates · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: resume templates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/ThemeSettings"));

export const Route = createFileRoute("/admin/theme")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Theme · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: theme." },
      { property: "og:title", content: "Theme · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: theme." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/AdminControls"));

export const Route = createFileRoute("/admin/controls")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Controls · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: controls." },
      { property: "og:title", content: "Controls · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: controls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/AdminMessages"));

export const Route = createFileRoute("/admin/messages")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Messages · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: messages." },
      { property: "og:title", content: "Messages · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: messages." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

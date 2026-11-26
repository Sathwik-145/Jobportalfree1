import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/ManageHeadlines"));

export const Route = createFileRoute("/admin/headlines")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Headlines · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: headlines." },
      { property: "og:title", content: "Headlines · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: headlines." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

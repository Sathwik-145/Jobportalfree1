import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/ManageConcepts"));

export const Route = createFileRoute("/admin/concepts")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Important concepts · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: important concepts." },
      { property: "og:title", content: "Important concepts · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: important concepts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

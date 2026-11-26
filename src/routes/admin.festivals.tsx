import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/FestivalSettings"));

export const Route = createFileRoute("/admin/festivals")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Festivals · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: festivals." },
      { property: "og:title", content: "Festivals · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: festivals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

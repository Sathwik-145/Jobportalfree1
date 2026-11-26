import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/AdminAnalytics"));

export const Route = createFileRoute("/admin/analytics")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Analytics · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: analytics." },
      { property: "og:title", content: "Analytics · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

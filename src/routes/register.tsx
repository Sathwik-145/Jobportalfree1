import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/Register"));

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create account | JobPortalFree" },
      { name: "description", content: "Create a free JobPortalFree account for jobs, alerts and assessments." },
      { property: "og:title", content: "Create account | JobPortalFree" },
      { property: "og:description", content: "Create a free JobPortalFree account for jobs, alerts and assessments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

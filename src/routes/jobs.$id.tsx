import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/JobDetail"));

export const Route = createFileRoute("/jobs/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Job details | JobPortalFree" },
      { name: "description", content: "Role details, eligibility and how to apply." },
      { property: "og:title", content: "Job details | JobPortalFree" },
      { property: "og:description", content: "Role details, eligibility and how to apply." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

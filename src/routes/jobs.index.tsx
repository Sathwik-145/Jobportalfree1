import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/Jobs"));

export const Route = createFileRoute("/jobs/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Browse jobs | JobPortalFree" },
      { name: "description", content: "Search the latest jobs and internships for students and freshers." },
      { property: "og:title", content: "Browse jobs | JobPortalFree" },
      { property: "og:description", content: "Search the latest jobs and internships for students and freshers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

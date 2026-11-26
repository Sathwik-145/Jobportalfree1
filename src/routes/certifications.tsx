import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/Certifications"));

export const Route = createFileRoute("/certifications")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Free certifications | JobPortalFree" },
      { name: "description", content: "Free online certifications to strengthen your resume." },
      { property: "og:title", content: "Free certifications | JobPortalFree" },
      { property: "og:description", content: "Free online certifications to strengthen your resume." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

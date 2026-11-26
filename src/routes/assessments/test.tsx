import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/AssessmentTest"));

export const Route = createFileRoute("/assessments/test")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Assessment test | JobPortalFree" },
      { name: "description", content: "Take a timed practice assessment." },
      { property: "og:title", content: "Assessment test | JobPortalFree" },
      { property: "og:description", content: "Take a timed practice assessment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

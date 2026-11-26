import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/Assessments"));

export const Route = createFileRoute("/assessments/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Skill assessments | JobPortalFree" },
      { name: "description", content: "Practice aptitude and technical assessments for free." },
      { property: "og:title", content: "Skill assessments | JobPortalFree" },
      { property: "og:description", content: "Practice aptitude and technical assessments for free." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

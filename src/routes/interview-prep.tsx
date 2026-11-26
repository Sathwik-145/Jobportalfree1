import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/InterviewPrep"));

export const Route = createFileRoute("/interview-prep")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Interview preparation | JobPortalFree" },
      { name: "description", content: "Common interview questions and preparation tips." },
      { property: "og:title", content: "Interview preparation | JobPortalFree" },
      { property: "og:description", content: "Common interview questions and preparation tips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

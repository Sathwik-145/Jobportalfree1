import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/MockInterviews"));

export const Route = createFileRoute("/mock-interviews")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mock interviews — coming soon | JobPortalFree" },
      { name: "description", content: "Realistic mock interviews with AI feedback are on the way. Stay tuned." },
      { property: "og:title", content: "Mock interviews — coming soon | JobPortalFree" },
      { property: "og:description", content: "We're building mock interviews accurately. Stay tuned." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: Page,
});

import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/exam/pages/QuickStart"));

export const Route = createFileRoute("/start")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Start your exam | JobPortalFree" },
      { name: "description", content: "Start a CodeXam assessment in seconds." },
      { property: "og:title", content: "Start your exam | JobPortalFree" },
      { property: "og:description", content: "Start a CodeXam assessment in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

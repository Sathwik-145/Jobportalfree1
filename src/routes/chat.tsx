import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/Chat"));

export const Route = createFileRoute("/chat")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "JobBot assistant | JobPortalFree" },
      { name: "description", content: "Ask JobBot about jobs, resumes and interviews." },
      { property: "og:title", content: "JobBot assistant | JobPortalFree" },
      { property: "og:description", content: "Ask JobBot about jobs, resumes and interviews." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/Login"));

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in | JobPortalFree" },
      { name: "description", content: "Sign in to JobPortalFree to apply for jobs and track applications." },
      { property: "og:title", content: "Sign in | JobPortalFree" },
      { property: "og:description", content: "Sign in to JobPortalFree to apply for jobs and track applications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

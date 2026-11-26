import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/exam/pages/Register"));

export const Route = createFileRoute("/exam-register")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "CodeXam registration | JobPortalFree" },
      { name: "description", content: "Register for a CodeXam assessment." },
      { property: "og:title", content: "CodeXam registration | JobPortalFree" },
      { property: "og:description", content: "Register for a CodeXam assessment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

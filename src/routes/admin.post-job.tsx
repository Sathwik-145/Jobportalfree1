import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/PostJob"));

export const Route = createFileRoute("/admin/post-job")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Post a job · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: post a job." },
      { property: "og:title", content: "Post a job · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: post a job." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

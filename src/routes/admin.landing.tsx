import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/LandingSettings"));

export const Route = createFileRoute("/admin/landing")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Landing page · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: landing page." },
      { property: "og:title", content: "Landing page · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: landing page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/AdminJobAlerts"));

export const Route = createFileRoute("/admin/job-alerts")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Job alerts · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: see who gets job alert emails and switch them off per person." },
      { property: "og:title", content: "Job alerts · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: job alert subscribers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: Page,
});

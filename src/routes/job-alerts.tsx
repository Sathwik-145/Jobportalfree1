import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ProtectedRoute from "@/components/ProtectedRoute";

const Page = lazyRouteComponent(() => import("@/pages/JobAlerts"));

export const Route = createFileRoute("/job-alerts")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Job alerts | JobPortalFree" },
      { name: "description", content: "Manage your job alert preferences." },
      { property: "og:title", content: "Job alerts | JobPortalFree" },
      { property: "og:description", content: "Manage your job alert preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ProtectedRoute><Page /></ProtectedRoute>,
});

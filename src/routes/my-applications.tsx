import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ProtectedRoute from "@/components/ProtectedRoute";

const Page = lazyRouteComponent(() => import("@/pages/MyApplications"));

export const Route = createFileRoute("/my-applications")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My applications | JobPortalFree" },
      { name: "description", content: "Track the jobs you have applied for." },
      { property: "og:title", content: "My applications | JobPortalFree" },
      { property: "og:description", content: "Track the jobs you have applied for." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ProtectedRoute><Page /></ProtectedRoute>,
});

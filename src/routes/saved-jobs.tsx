import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ProtectedRoute from "@/components/ProtectedRoute";

const Page = lazyRouteComponent(() => import("@/pages/SavedJobs"));

export const Route = createFileRoute("/saved-jobs")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Saved jobs | JobPortalFree" },
      { name: "description", content: "Jobs you saved for later." },
      { property: "og:title", content: "Saved jobs | JobPortalFree" },
      { property: "og:description", content: "Jobs you saved for later." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ProtectedRoute><Page /></ProtectedRoute>,
});

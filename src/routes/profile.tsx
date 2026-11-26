import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ProtectedRoute from "@/components/ProtectedRoute";

const Page = lazyRouteComponent(() => import("@/pages/Profile"));

export const Route = createFileRoute("/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My profile | JobPortalFree" },
      { name: "description", content: "Manage your JobPortalFree profile." },
      { property: "og:title", content: "My profile | JobPortalFree" },
      { property: "og:description", content: "Manage your JobPortalFree profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ProtectedRoute><Page /></ProtectedRoute>,
});

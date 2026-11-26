import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/ResetPassword"));

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password | JobPortalFree" },
      { name: "description", content: "Choose a new password for your JobPortalFree account." },
      { property: "og:title", content: "Reset password | JobPortalFree" },
      { property: "og:description", content: "Choose a new password for your JobPortalFree account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

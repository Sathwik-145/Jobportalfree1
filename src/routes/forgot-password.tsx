import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/ForgotPassword"));

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Forgot password | JobPortalFree" },
      { name: "description", content: "Reset your JobPortalFree password by email." },
      { property: "og:title", content: "Forgot password | JobPortalFree" },
      { property: "og:description", content: "Reset your JobPortalFree password by email." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

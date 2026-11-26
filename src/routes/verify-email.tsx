import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/VerifyEmail"));

export const Route = createFileRoute("/verify-email")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Verify your email | JobPortalFree" },
      { name: "description", content: "Confirm your email address to finish creating your JobPortalFree account." },
      { property: "og:title", content: "Verify your email | JobPortalFree" },
      { property: "og:description", content: "Confirm your email address to finish creating your JobPortalFree account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

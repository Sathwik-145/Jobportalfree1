import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/SignupVerification"));

export const Route = createFileRoute("/admin/signups")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "New sign-ups · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: new sign-ups." },
      { property: "og:title", content: "New sign-ups · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: new sign-ups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

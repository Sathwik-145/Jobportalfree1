import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/ManageUsers"));

export const Route = createFileRoute("/admin/users")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Users · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: users." },
      { property: "og:title", content: "Users · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: users." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

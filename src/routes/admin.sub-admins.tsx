import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/ManageSubAdmins"));

export const Route = createFileRoute("/admin/sub-admins")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sub-admins · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: sub-admins." },
      { property: "og:title", content: "Sub-admins · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: sub-admins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

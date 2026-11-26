import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/AdminMail"));

export const Route = createFileRoute("/admin/mail")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mail · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: mail." },
      { property: "og:title", content: "Mail · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: mail." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

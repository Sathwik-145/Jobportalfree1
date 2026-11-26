import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/FestivalMails"));

export const Route = createFileRoute("/admin/festival-mails")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Festival mails · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: festival mails." },
      { property: "og:title", content: "Festival mails · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: festival mails." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/BackupData"));

export const Route = createFileRoute("/admin/backup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Backup · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: backup." },
      { property: "og:title", content: "Backup · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: backup." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

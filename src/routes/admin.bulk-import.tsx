import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/BulkImportJobs"));

export const Route = createFileRoute("/admin/bulk-import")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Bulk import · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: bulk import." },
      { property: "og:title", content: "Bulk import · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: bulk import." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/ResumeTemplates"));

export const Route = createFileRoute("/resume-templates")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Resume templates | JobPortalFree" },
      { name: "description", content: "Download free resume templates for freshers." },
      { property: "og:title", content: "Resume templates | JobPortalFree" },
      { property: "og:description", content: "Download free resume templates for freshers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

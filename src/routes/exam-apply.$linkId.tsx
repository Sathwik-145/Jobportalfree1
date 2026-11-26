import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/exam/pages/ApplyLink"));

export const Route = createFileRoute("/exam-apply/$linkId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Exam registration link | JobPortalFree" },
      { name: "description", content: "Register for a CodeXam exam with your invite link." },
      { property: "og:title", content: "Exam registration link | JobPortalFree" },
      { property: "og:description", content: "Register for a CodeXam exam with your invite link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/StudentReports"));

export const Route = createFileRoute("/exam-admin/reports")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reports · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: reports." },
      { property: "og:title", content: "Reports · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

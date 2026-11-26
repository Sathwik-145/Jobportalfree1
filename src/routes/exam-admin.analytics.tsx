import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/Analytics"));

export const Route = createFileRoute("/exam-admin/analytics")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Exam analytics · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: exam analytics." },
      { property: "og:title", content: "Exam analytics · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: exam analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

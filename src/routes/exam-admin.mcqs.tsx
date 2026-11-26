import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/ManageMCQs"));

export const Route = createFileRoute("/exam-admin/mcqs")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "MCQs · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: mcqs." },
      { property: "og:title", content: "MCQs · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: mcqs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

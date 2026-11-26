import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/student/ExamPage"));

export const Route = createFileRoute("/exam-take/$questionId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Exam in progress | JobPortalFree" },
      { name: "description", content: "CodeXam exam in progress." },
      { property: "og:title", content: "Exam in progress | JobPortalFree" },
      { property: "og:description", content: "CodeXam exam in progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="student"><Page /></ExamProtected>,
});

import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/student/StudentDashboard"));

export const Route = createFileRoute("/exam-student/exam")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My exams | JobPortalFree" },
      { name: "description", content: "Your scheduled CodeXam exams and results." },
      { property: "og:title", content: "My exams | JobPortalFree" },
      { property: "og:description", content: "Your scheduled CodeXam exams and results." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="student"><Page /></ExamProtected>,
});

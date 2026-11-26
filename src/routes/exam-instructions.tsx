import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/student/ExamInstructions"));

export const Route = createFileRoute("/exam-instructions")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Exam instructions | JobPortalFree" },
      { name: "description", content: "Read the rules before you start." },
      { property: "og:title", content: "Exam instructions | JobPortalFree" },
      { property: "og:description", content: "Read the rules before you start." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="student"><Page /></ExamProtected>,
});

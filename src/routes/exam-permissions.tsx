import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/student/MediaPermissions"));

export const Route = createFileRoute("/exam-permissions")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Exam permissions | JobPortalFree" },
      { name: "description", content: "Allow camera, microphone and screen access for proctoring." },
      { property: "og:title", content: "Exam permissions | JobPortalFree" },
      { property: "og:description", content: "Allow camera, microphone and screen access for proctoring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="student"><Page /></ExamProtected>,
});

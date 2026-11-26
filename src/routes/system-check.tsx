import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/student/SystemCheck"));

export const Route = createFileRoute("/system-check")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "System check | JobPortalFree" },
      { name: "description", content: "Check your camera, microphone and connection before the exam." },
      { property: "og:title", content: "System check | JobPortalFree" },
      { property: "og:description", content: "Check your camera, microphone and connection before the exam." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="student"><Page /></ExamProtected>,
});

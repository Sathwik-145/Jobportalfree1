import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/Recordings"));

export const Route = createFileRoute("/exam-admin/recordings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Exam recordings · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: watch and delete camera and screen recordings from monitored tests." },
      { property: "og:title", content: "Exam recordings · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: camera and screen recordings from monitored tests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/ManageStudents"));

export const Route = createFileRoute("/exam-admin/students")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Students · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: students." },
      { property: "og:title", content: "Students · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

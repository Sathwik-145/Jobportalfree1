import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/AdminDashboard"));

export const Route = createFileRoute("/exam-admin/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "CodeXam admin | JobPortalFree" },
      { name: "description", content: "Manage CodeXam tests, students and reports." },
      { property: "og:title", content: "CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "Manage CodeXam tests, students and reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

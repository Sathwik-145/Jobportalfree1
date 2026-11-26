import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/PortalSettings"));

export const Route = createFileRoute("/exam-admin/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Exam settings · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: exam settings." },
      { property: "og:title", content: "Exam settings · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: exam settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

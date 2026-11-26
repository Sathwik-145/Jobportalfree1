import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/Feedback"));

export const Route = createFileRoute("/exam-admin/feedback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Feedback · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: feedback." },
      { property: "og:title", content: "Feedback · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: feedback." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

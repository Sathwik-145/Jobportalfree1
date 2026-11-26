import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/Reevaluations"));

export const Route = createFileRoute("/exam-admin/reevaluations")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Re-evaluations · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: re-evaluations." },
      { property: "og:title", content: "Re-evaluations · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: re-evaluations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

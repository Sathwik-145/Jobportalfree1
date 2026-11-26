import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/LiveProctoring"));

export const Route = createFileRoute("/exam-admin/proctoring")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Live proctoring · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: live proctoring." },
      { property: "og:title", content: "Live proctoring · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: live proctoring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

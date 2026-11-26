import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/ManageFIB"));

export const Route = createFileRoute("/exam-admin/fib")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Fill in the blanks · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: fill in the blanks." },
      { property: "og:title", content: "Fill in the blanks · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: fill in the blanks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

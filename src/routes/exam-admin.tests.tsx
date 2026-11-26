import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/ManageTests"));

export const Route = createFileRoute("/exam-admin/tests")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tests · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: tests." },
      { property: "og:title", content: "Tests · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: tests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

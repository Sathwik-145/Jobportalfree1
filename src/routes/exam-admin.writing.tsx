import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/ManageWriting"));

export const Route = createFileRoute("/exam-admin/writing")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Writing tasks · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: writing tasks." },
      { property: "og:title", content: "Writing tasks · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: writing tasks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

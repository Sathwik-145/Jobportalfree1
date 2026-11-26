import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/LinkRegistrants"));

export const Route = createFileRoute("/exam-admin/link-registrants")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Link registrants · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: link registrants." },
      { property: "og:title", content: "Link registrants · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: link registrants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

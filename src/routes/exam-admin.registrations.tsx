import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/Registrations"));

export const Route = createFileRoute("/exam-admin/registrations")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Registrations · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: registrations." },
      { property: "og:title", content: "Registrations · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: registrations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

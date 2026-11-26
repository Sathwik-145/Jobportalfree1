import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/QuickRegistrations"));

export const Route = createFileRoute("/exam-admin/quick-registrations")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Quick sign-ups · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: quick sign-ups." },
      { property: "og:title", content: "Quick sign-ups · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: quick sign-ups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

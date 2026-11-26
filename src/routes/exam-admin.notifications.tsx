import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/Notifications"));

export const Route = createFileRoute("/exam-admin/notifications")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Notifications · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: notifications." },
      { property: "og:title", content: "Notifications · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: notifications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

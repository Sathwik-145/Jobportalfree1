import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/Leaderboard"));

export const Route = createFileRoute("/exam-admin/leaderboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Leaderboard · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: leaderboard." },
      { property: "og:title", content: "Leaderboard · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: leaderboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

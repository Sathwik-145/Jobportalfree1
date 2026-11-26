import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/exam/pages/Login"));

export const Route = createFileRoute("/exam-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "CodeXam sign in | JobPortalFree" },
      { name: "description", content: "Sign in to CodeXam to take your assigned exams." },
      { property: "og:title", content: "CodeXam sign in | JobPortalFree" },
      { property: "og:description", content: "Sign in to CodeXam to take your assigned exams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

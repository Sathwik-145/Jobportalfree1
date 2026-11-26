import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Home = lazyRouteComponent(() => import("@/pages/Index"));

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "JobPortalFree | Free jobs, prep and CodeXam assessments" },
      { name: "description", content: "Find fresher jobs and internships, prepare with free resources, and take your assigned CodeXam assessments — all in one place." },
      { property: "og:title", content: "JobPortalFree | Free jobs, prep and CodeXam assessments" },
      { property: "og:description", content: "Jobs, interview prep, certifications and online exams for students — all in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

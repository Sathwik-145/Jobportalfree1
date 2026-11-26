import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/ResumeBuilder"));

export const Route = createFileRoute("/resume-builder")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Free resume builder | JobPortalFree" },
      { name: "description", content: "Build a clean, ATS-friendly resume and download it as a PDF for free." },
      { property: "og:title", content: "Free resume builder | JobPortalFree" },
      { property: "og:description", content: "Build a clean, ATS-friendly resume and download it as a PDF for free." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

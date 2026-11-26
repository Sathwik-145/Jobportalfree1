import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ExamProtected from "@/components/ExamProtected";

const Page = lazyRouteComponent(() => import("@/exam/pages/admin/RegistrationLinks"));

export const Route = createFileRoute("/exam-admin/registration-links")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Registration links · CodeXam admin | JobPortalFree" },
      { name: "description", content: "CodeXam admin: registration links." },
      { property: "og:title", content: "Registration links · CodeXam admin | JobPortalFree" },
      { property: "og:description", content: "CodeXam admin: registration links." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => Page.preload?.(),
  component: () => <ExamProtected role="admin"><Page /></ExamProtected>,
});

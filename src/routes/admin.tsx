import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import ProtectedRoute from "@/components/ProtectedRoute";

// The admin shell renders the sidebar and an <Outlet /> for every /admin/* page.
const AdminShell = lazyRouteComponent(() => import("@/pages/admin/AdminDashboard"));

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin command center | JobPortalFree" },
      { name: "description", content: "Manage jobs, candidates, mail, the website and the CodeXam exam portal from one place." },
      { property: "og:title", content: "Admin command center | JobPortalFree" },
      { property: "og:description", content: "Every admin tool for JobPortalFree and CodeXam in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => AdminShell.preload?.(),
  component: () => (
    <ProtectedRoute requireAdmin>
      <AdminShell />
    </ProtectedRoute>
  ),
});

import { createFileRoute, redirect } from "@tanstack/react-router";

// Exam recordings now live in the CodeXam exam admin; keep the old address working.
export const Route = createFileRoute("/admin/recordings")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/exam-admin/recordings", replace: true });
  },
});

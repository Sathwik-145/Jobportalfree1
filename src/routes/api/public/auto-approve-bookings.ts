import { createFileRoute } from "@tanstack/react-router";
import { serverDb } from "@/lib/credential-mailer.server";
import { processDueAutoApprovals } from "@/lib/registration-approval.server";

// Pinged right after a slot booking (and again by the booking page when a delay ends).
// It only approves pending bookings whose admin-set delay has passed, and only when the admin
// switched automatic approval on — callers cannot choose which booking or test.
export const Route = createFileRoute("/api/public/auto-approve-bookings")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const r = await processDueAutoApprovals(serverDb());
          return Response.json({ approved: r.approved, pending: r.pending, reason: (r as any).reason });
        } catch (e: any) {
          console.error("auto-approve-bookings", e);
          return Response.json({ error: "Could not run automatic approval" }, { status: 500 });
        }
      },
    },
  },
});

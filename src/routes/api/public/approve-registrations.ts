import { createFileRoute } from "@tanstack/react-router";
import { mailAdminDb } from "@/lib/mail-auth.server";
import { localToIso, adminOrServerDb } from "@/lib/credential-mailer.server";
import { approveRegistrations, ApprovalError } from "@/lib/registration-approval.server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Admin approves registrations / slot bookings in one click: creates (or reuses) the student,
 * allocates the chosen test or a random one, opens their personal start window and emails
 * the login details. Admin-only: the caller's session must hold the admin role.
 */
export const Route = createFileRoute("/api/public/approve-registrations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const adminDb = await mailAdminDb(request);
        if (!adminDb) return Response.json({ error: "Admin sign-in required" }, { status: 401 });
        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
        const ids: string[] = Array.isArray(body?.registrationIds) ? body.registrationIds.map(String).filter((x: string) => UUID.test(x)).slice(0, 100) : [];
        // Registration-link sign-ups are addressed by their client_id.
        const clientIds: string[] = Array.isArray(body?.clientIds) ? body.clientIds.map(String).filter((x: string) => x.length > 0 && x.length <= 120).slice(0, 100) : [];
        if (!ids.length && !clientIds.length) return Response.json({ error: "No registrations selected" }, { status: 400 });
        const tz = Number.isFinite(Number(body?.tzOffsetMinutes)) ? Number(body.tzOffsetMinutes) : 330;
        try {
          const res = await approveRegistrations(adminOrServerDb(adminDb), {
            ids, clientIds, tz,
            examChoice: typeof body?.examId === "string" ? body.examId.slice(0, 80) : "",
            customStart: localToIso(typeof body?.startAt === "string" ? body.startAt : "", tz),
            useBookedSlot: body?.useBookedSlot !== false,
            sendEmail: body?.sendEmail !== false,
            loginUrl: typeof body?.loginUrl === "string" && /^https?:\/\//.test(body.loginUrl) ? body.loginUrl.slice(0, 200) : "",
            templateId: typeof body?.templateId === "string" ? body.templateId.slice(0, 60) : undefined,
            windowMinutes: body?.windowMinutes,
            source: "approval",
          });
          return Response.json(res);
        } catch (e: any) {
          const status = e instanceof ApprovalError ? e.status : 500;
          return Response.json({ error: String(e?.message || e) }, { status });
        }
      },
    },
  },
});

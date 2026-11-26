import { createFileRoute } from "@tanstack/react-router";
import { adminOrServerDb } from "@/lib/credential-mailer.server";
import { mailAdminDb } from "@/lib/mail-auth.server";
import { enqueueResults } from "@/lib/result-mailer.server";

// Admin-only: queue result emails (with optional detailed PDF) to be sent at a later time.
export const Route = createFileRoute("/api/public/schedule-results")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const adminDb = await mailAdminDb(request);
        if (!adminDb) return Response.json({ error: "Only admins can schedule result emails" }, { status: 403 });
        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
        const sendAt = Number(new Date(String(body?.sendAt || "")).getTime());
        if (!Number.isFinite(sendAt)) return Response.json({ error: "Pick a valid send time" }, { status: 400 });
        const cfg = {
          enabled: true, delayMinutes: 0,
          attachPdf: !!body?.attachPdf, includeQA: body?.includeQA !== false,
          target: body?.target === "login" ? "login" as const : "personal" as const,
          passPct: Math.max(0, Math.min(100, Number(body?.passPct ?? 40))),
        };
        const items = (Array.isArray(body?.items) ? body.items : []).slice(0, 300)
          .map((i: any) => ({ studentId: String(i?.studentId || "").slice(0, 80), examId: String(i?.examId || "").slice(0, 80) }))
          .filter((i: any) => i.studentId && i.examId)
          .map((i: any) => ({ ...i, cfg, dueAt: sendAt, source: "admin" as const, subject: String(body?.subject || "").slice(0, 200), body: String(body?.body || "").slice(0, 8000) }));
        if (!items.length) return Response.json({ error: "No reports selected" }, { status: 400 });
        const n = await enqueueResults(adminOrServerDb(adminDb), items);
        return Response.json({ queued: n });
      },
    },
  },
});

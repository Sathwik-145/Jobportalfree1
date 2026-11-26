import { createFileRoute } from "@tanstack/react-router";
import { serverDb } from "@/lib/credential-mailer.server";
import { reviewSubmittedFibs } from "@/lib/fib-review.server";
import { enqueueResults, getAutoConfig, processResultQueue, sendOneResult } from "@/lib/result-mailer.server";

// Called by the student's browser right after a test is submitted.
// Only acts when the admin enabled automatic result emails for that test, and only for a real submission.
export const Route = createFileRoute("/api/public/queue-result")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
        const studentId = String(body?.studentId || "").slice(0, 80);
        const examId = String(body?.examId || "").slice(0, 80);
        if (!studentId || !examId) return Response.json({ error: "Missing ids" }, { status: 400 });
        const db = serverDb();
        const { data: st } = await db.from("students").select("id,exam_status").eq("id", studentId).maybeSingle();
        if (!st) return Response.json({ error: "Unknown student" }, { status: 404 });
        // AI double-check of fill-in-the-blank answers runs for every submission, before any result is built.
        await new Promise((r) => setTimeout(r, 2500));
        let fibReviewed = true;
        try { await reviewSubmittedFibs(db, studentId, examId); } catch (e) { fibReviewed = false; console.error("fib-review", e); }
        const cfg = await getAutoConfig(db, examId, studentId);
        if (!cfg) return Response.json({ queued: false, reason: "auto-send off", fibReviewed });
        const delay = Math.max(0, Math.min(10080, Number(cfg.delayMinutes) || 0));
        try {
          if (delay === 0) {
            const r = await sendOneResult(db, { studentId, examId, cfg, source: "auto" });
            return Response.json({ queued: false, sent: r.sent });
          }
          await enqueueResults(db, [{ studentId, examId, cfg, source: "auto", dueAt: Date.now() + delay * 60_000 }]);
          // opportunistically flush anything else that is due
          processResultQueue(db).catch(() => {});
          return Response.json({ queued: true, delayMinutes: delay });
        } catch (e: any) {
          return Response.json({ error: String(e?.message || e) }, { status: 500 });
        }
      },
    },
  },
});

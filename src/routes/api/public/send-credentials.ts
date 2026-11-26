import { createFileRoute } from "@tanstack/react-router";
import { mailAdminDb } from "@/lib/mail-auth.server";
import { assignTests, localToIso, sendCredentialMails, adminOrServerDb } from "@/lib/credential-mailer.server";
import { validateMailAttachments } from '@/exam/lib/mailAttachments';

// Sends each selected student the chosen template; optionally assigns a test with their start time.
export const Route = createFileRoute("/api/public/send-credentials")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const adminDb = await mailAdminDb(request);
        if (!adminDb) return Response.json({ error: "Admin sign-in required" }, { status: 401 });
        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
        const ids: string[] = Array.isArray(body?.studentIds) ? body.studentIds.slice(0, 500).map(String) : [];
        const loginUrl = typeof body?.loginUrl === "string" && /^https?:\/\//.test(body.loginUrl) ? body.loginUrl.slice(0, 200) : "";
        const target = body?.target === "login" ? "login" : "personal";
        if (!ids.length) return Response.json({ error: "No students selected" }, { status: 400 });
        const templateId = typeof body?.templateId === "string" ? body.templateId.slice(0, 60) : undefined;
        const examId = typeof body?.examId === "string" ? body.examId.slice(0, 80) : "";
        const tz = Number.isFinite(Number(body?.tzOffsetMinutes)) ? Number(body.tzOffsetMinutes) : 330;
        const start = localToIso(typeof body?.startAt === "string" ? body.startAt : "", tz);
        const buffer = Number(body?.bufferMinutes ?? 10);
        const examByStudent: Record<string, string> = {};
        const startByStudent: Record<string, string | null> = {};
        ids.forEach((id) => { if (examId) examByStudent[id] = examId; startByStudent[id] = start; });
        try {
          const db = adminOrServerDb(adminDb);
          const attachments = validateMailAttachments(body.attachments);
          const r = await sendCredentialMails({ db, studentIds: ids, loginUrl, target, templateId, examByStudent, startByStudent, attachments, windowMinutes: buffer, includeExamSchedule: body?.includeExamSchedule !== false, useExamSchedule: body?.useExamSchedule !== false, tzOffsetMinutes: tz, source: "manual" });
          let assigned = 0;
          if (examId && body?.assignExam && r.sentIds.length) {
            const plan: Record<string, { examId: string; start: string | null; buffer: number }> = {};
            r.sentIds.forEach((id) => (plan[id] = { examId, start, buffer }));
            assigned = (await assignTests(db, plan)).assigned;
          }
          return Response.json({ ...r, assigned });
        } catch (e: any) {
          return Response.json({ error: String(e?.message || e) }, { status: 500 });
        }
      },
    },
  },
});

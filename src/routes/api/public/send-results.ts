import { createFileRoute } from "@tanstack/react-router";
import { mailAdminDb } from "@/lib/mail-auth.server";
import { sendResultMails, serverDb } from "@/lib/credential-mailer.server";
import { validateMailAttachments } from '@/exam/lib/mailAttachments';

// Sends result emails. Recipients are resolved server-side from student ids.
export const Route = createFileRoute("/api/public/send-results")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await mailAdminDb(request))) return Response.json({ error: "Admin sign-in required" }, { status: 401 });
        const db = serverDb();
        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
        const items = (Array.isArray(body?.items) ? body.items : []).slice(0, 300).map((i: any) => ({
          studentId: String(i?.studentId || "").slice(0, 80),
          vars: Object.fromEntries(Object.entries(i?.vars || {}).slice(0, 20).map(([k, v]) => [String(k).slice(0, 40), String(v ?? "").slice(0, 4000)])),
          attachments: i?.attachments ? validateMailAttachments(i.attachments) : [],
        })).filter((i: any) => i.studentId);
        if (!items.length) return Response.json({ error: "No students selected" }, { status: 400 });
        const subject = String(body?.subject || "Your result").slice(0, 200);
        const text = String(body?.body || "").slice(0, 8000);
        const target = body?.target === "login" ? "login" : "personal";
        try {
          return Response.json(await sendResultMails({ db, target, subject, body: text, items, attachments: validateMailAttachments(body.attachments) }));
        } catch (e: any) {
          return Response.json({ error: String(e?.message || e) }, { status: 500 });
        }
      },
    },
  },
});

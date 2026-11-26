import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { sendGenericMails, serverDb } from "@/lib/credential-mailer.server";
import { validateMailAttachments } from '@/exam/lib/mailAttachments';
import { databaseUrl, databaseKey } from "@/lib/database-target";

// Main admin panel mail: only signed-in portal admins may send.
async function isAdmin(request: Request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const url = databaseUrl();
  const key = databaseKey();
  const sb = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u } = await sb.auth.getUser(token);
  if (!u?.user) return false;
  const { data } = await sb.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
  return !!data;
}

export const Route = createFileRoute("/api/public/portal-mail")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAdmin(request))) return Response.json({ error: "Only admins can send mail" }, { status: 403 });
        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
        const recipients = (Array.isArray(body?.recipients) ? body.recipients : []).slice(0, 2000)
          .map((r: any) => ({ name: String(r?.name || "").slice(0, 120), email: String(r?.email || "").trim().slice(0, 200) }))
          .filter((r: any) => r.email);
        if (!recipients.length) return Response.json({ error: "No recipients" }, { status: 400 });
        const subject = String(body?.subject || "").slice(0, 200);
        const text = String(body?.body || "").slice(0, 10000);
        if (!subject.trim() || !text.trim()) return Response.json({ error: "Subject and message are required" }, { status: 400 });
        try {
          return Response.json(await sendGenericMails({ db: serverDb(), recipients, subject, body: text, source: "manual", senderName: String(body?.senderName || "").slice(0, 60), attachments: validateMailAttachments(body.attachments) }));
        } catch (e: any) {
          return Response.json({ error: String(e?.message || e) }, { status: 500 });
        }
      },
    },
  },
});

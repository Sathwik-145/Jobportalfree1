import { createFileRoute } from "@tanstack/react-router";
import { getSetting, sendGenericMails } from "@/lib/credential-mailer.server";
import { mailAdminDb } from "@/lib/mail-auth.server";
import { SYSTEM_TEMPLATES_KEY, resolveTemplate } from "@/lib/system-mail-templates";

// Sends the "verify your email" link for a brand-new sign-up.
// The token is only returned by the database when the server's private key matches.
// Signed-in admins get the exact reason when nothing is sent; the public only sees ok.
export const Route = createFileRoute("/api/public/send-verification")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!process.env["BREVO_API_KEY"]) return Response.json({ error: "BREVO_API_KEY is not set on the server" }, { status: 500 });
        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
        const email = String(body?.email || "").trim().toLowerCase().slice(0, 255);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "Invalid email" }, { status: 400 });

        // serverDb sends the website server header so the database hands out the token only to this server.
        const { serverDb } = await import("@/lib/credential-mailer.server");
        const db = serverDb();
        const isAdmin = !!(await mailAdminDb(request));
        const { data: token, error: rpcError } = await db.rpc("pending_verify_token", { _email: email });
        if (rpcError) {
          console.error("pending_verify_token failed:", rpcError.message);
          return Response.json({ error: isAdmin ? `Database error: ${rpcError.message}` : "Email could not be sent" }, { status: 500 });
        }
        if (!token) {
          if (!isAdmin) return Response.json({ ok: true }); // don't reveal anything to the public
          return Response.json({ error: "No link was sent. This account is already verified or was created more than 1 day ago." }, { status: 409 });
        }

        const origin = new URL(request.url).origin;
        const link = `${origin}/verify-email?token=${token}`;
        const tpl = resolveTemplate(await getSetting<any>(db, SYSTEM_TEMPLATES_KEY, {}), "verify_email");
        const r = await sendGenericMails({ db, recipients: [{ email }], subject: tpl.subject, body: tpl.body, vars: { link }, source: "verify-email" });
        if (!r.sent) {
          const reason = r.failed[0]?.error || "Brevo did not accept the email";
          console.error("Verify email failed:", reason);
          return Response.json({ error: isAdmin ? reason : "Email could not be sent" }, { status: 502 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});

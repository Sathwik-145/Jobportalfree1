import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { callerDb, sendAlertSavedMail, sendNewJobAlerts } from "@/lib/job-alert-mailer.server";
import { alertsAllowed, jobMatchesPrefs } from "@/lib/jobAlerts";

// Job alert emails.
//  - "saved": the signed-in person gets a confirmation of their own alerts (never anyone else).
//  - "jobs_posted": staff only; emails each person whose alerts match the new jobs.
// Every read runs as the caller, so the normal access rules decide what they can see.
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("saved") }),
  z.object({ action: z.literal("jobs_posted"), jobIds: z.array(z.string().uuid()).min(1).max(100) }),
]);

const siteOf = (request: Request) => (process.env["APP_URL"] || new URL(request.url).origin).replace(/\/+$/, "");

export const Route = createFileRoute("/api/public/job-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let input: z.infer<typeof schema>;
        try {
          const raw = await request.text();
          if (raw.length > 8000) throw new Error("too large");
          input = schema.parse(JSON.parse(raw));
        } catch {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }
        const caller = await callerDb(request);
        if (!caller) return Response.json({ error: "Sign in required" }, { status: 401 });
        const { db, user } = caller;
        const site = siteOf(request);
        try {
          if (input.action === "saved") {
            const { data: prefs } = await db.from("job_preferences").select("*").eq("user_id", user.id).maybeSingle();
            if (!prefs) return Response.json({ error: "Save your alerts first" }, { status: 404 });
            if ((prefs as any).admin_paused === true) return Response.json({ sent: false, reason: "paused_by_admin" });
            if (!alertsAllowed(prefs as any)) return Response.json({ sent: false, reason: "alerts_off" });
            if (!user.email) return Response.json({ sent: false, reason: "no_email" });
            const { data: recent } = await db
              .from("jobs")
              .select("id,title,company,location,job_type,skills_required,salary_range")
              .eq("is_active", true)
              .order("created_at", { ascending: false })
              .limit(60);
            const matches = (recent || []).filter((j: any) => jobMatchesPrefs(prefs as any, j)).slice(0, 5);
            await sendAlertSavedMail({ to: user.email, name: user.user_metadata?.full_name, prefs: prefs as any, matches: matches as any, site });
            return Response.json({ sent: true, matches: matches.length });
          }
          const { data: staff } = await db.rpc("is_staff", { _user_id: user.id });
          if (staff !== true) return Response.json({ error: "Only admins can send job alerts" }, { status: 403 });
          return Response.json(await sendNewJobAlerts({ db, jobIds: input.jobIds, site }));
        } catch (e: any) {
          const message = String(e?.message || e);
          console.error(`job-alerts failed: ${message}`);
          return Response.json({ error: message }, { status: message.startsWith("Brevo is not configured") ? 503 : 500 });
        }
      },
    },
  },
});

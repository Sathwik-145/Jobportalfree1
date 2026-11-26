import { createClient } from "@supabase/supabase-js";
import { createBrevoTransport } from "@/lib/brevo-mail.server";
import { alertsAllowed, jobMatchesPrefs, type AlertPrefs } from "@/lib/jobAlerts";
import { databaseUrl, databaseKey } from "@/lib/database-target";

type Job = { id: string; title: string | null; company: string | null; location: string | null; job_type: string | null; skills_required: string[] | null; salary_range: string | null };

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** A database client acting as the signed-in caller, so every read follows the normal access rules. */
export async function callerDb(request: Request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const url = databaseUrl();
  const key = databaseKey();
  if (!token || !url || !key) return null;
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  return { db, user: data.user };
}

function jobRows(jobs: Job[], site: string) {
  return jobs
    .map(
      (j) => `<tr><td style="padding:14px 16px;border:1px solid #e5e1d8;border-radius:12px;background:#faf8f3">
  <div style="font:700 15px Arial,sans-serif;color:#141b33">${esc(j.title || "New opening")}</div>
  <div style="font:13px Arial,sans-serif;color:#545b72;margin-top:4px">${esc([j.company, j.location, j.job_type, j.salary_range].filter(Boolean).join(" · "))}</div>
  <a href="${esc(`${site}/jobs/${j.id}`)}" style="display:inline-block;margin-top:10px;font:700 13px Arial,sans-serif;color:#1f45b8;text-decoration:none">View job →</a>
</td></tr><tr><td style="height:10px"></td></tr>`,
    )
    .join("");
}

function wrap(title: string, intro: string, inner: string, site: string) {
  return `<!doctype html><html><body style="margin:0;background:#ffffff;padding:24px">
<table role="presentation" width="100%" style="max-width:560px;margin:0 auto;font-family:Arial,sans-serif">
<tr><td style="padding:22px 24px;border-radius:16px;background:#1f45b8;color:#ffffff">
  <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;opacity:.8">JobPortalFree · Job alerts</div>
  <div style="font:800 22px Arial,sans-serif;margin-top:8px">${esc(title)}</div>
</td></tr>
<tr><td style="padding:18px 4px 8px;font:15px/1.6 Arial,sans-serif;color:#141b33">${intro}</td></tr>
<tr><td><table role="presentation" width="100%">${inner}</table></td></tr>
<tr><td style="padding:14px 4px;font:12px/1.6 Arial,sans-serif;color:#7a8095">You get these emails because you saved job alerts on JobPortalFree. Change or turn them off any time at <a href="${esc(`${site}/job-alerts`)}" style="color:#1f45b8">${esc(site.replace(/^https?:\/\//, ""))}/job-alerts</a>.</td></tr>
</table></body></html>`;
}

function prefsSummary(p: AlertPrefs) {
  const parts = [
    p.preferred_locations?.length ? `Locations: ${p.preferred_locations.join(", ")}` : "",
    p.preferred_job_types?.length ? `Job types: ${p.preferred_job_types.join(", ")}` : "",
    p.preferred_skills?.length ? `Skills: ${p.preferred_skills.join(", ")}` : "",
  ].filter(Boolean);
  return parts.length ? parts : ["Every new job (no filters saved)"];
}

function transport() {
  const sender = (process.env["BREVO_SENDER_EMAIL"] || "jobportalfreeofficial@gmail.com").trim();
  return createBrevoTransport(sender, "JobPortalFree Alerts");
}

/** Confirmation sent to one person right after they save their own alerts. */
export async function sendAlertSavedMail(opts: { to: string; name?: string; prefs: AlertPrefs; matches: Job[]; site: string }) {
  const list = prefsSummary(opts.prefs);
  const intro = `Hi ${esc(opts.name || "there")},<br/>Your job alerts are saved. We'll email you when a new job matches:<ul style="margin:8px 0 0;padding-left:18px">${list.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>${opts.matches.length ? `<p style="margin:14px 0 0">Here ${opts.matches.length === 1 ? "is a job" : `are ${opts.matches.length} jobs`} that already match:</p>` : ""}`;
  const html = wrap("Your job alerts are on", intro, jobRows(opts.matches, opts.site), opts.site);
  const text = `Hi ${opts.name || "there"},\nYour job alerts are saved.\n${list.join("\n")}\n\n${opts.matches.map((j) => `${j.title} – ${opts.site}/jobs/${j.id}`).join("\n")}\n\nManage alerts: ${opts.site}/job-alerts`;
  await transport().sendMail({ to: opts.to, subject: "Your JobPortalFree job alerts are on", html, text });
}

/** One email per matching person listing the newly posted jobs that fit their saved alerts. */
export async function sendNewJobAlerts(opts: { db: any; jobIds: string[]; site: string }) {
  const { db, site } = opts;
  const { data: jobs, error: jobErr } = await db.from("jobs").select("id,title,company,location,job_type,skills_required,salary_range,is_active").in("id", opts.jobIds);
  if (jobErr) throw new Error(jobErr.message);
  const live = ((jobs || []) as (Job & { is_active: boolean })[]).filter((j) => j.is_active);
  if (!live.length) return { sent: 0, failed: 0, skipped: 0, people: 0 };
  const { data: prefs, error: prefErr } = await db.from("job_preferences").select("*");
  if (prefErr) throw new Error(prefErr.message);
  const allowed = ((prefs || []) as (AlertPrefs & { user_id: string })[]).filter(alertsAllowed);
  const skipped = (prefs || []).length - allowed.length;
  if (!allowed.length) return { sent: 0, failed: 0, skipped, people: 0 };
  const { data: profiles } = await db.from("profiles").select("user_id,email,full_name").in("user_id", allowed.map((p) => p.user_id));
  const byUser = new Map<string, { email: string | null; full_name: string | null }>((profiles || []).map((p: any) => [p.user_id, p]));
  const mailer = transport();
  let sent = 0, failed = 0, people = 0;
  for (const p of allowed) {
    const person = byUser.get(p.user_id);
    if (!person?.email) continue;
    const matches = live.filter((j) => jobMatchesPrefs(p, j));
    if (!matches.length) continue;
    people++;
    const title = matches.length === 1 ? `New job: ${matches[0].title || "fresh opening"}` : `${matches.length} new jobs match your alerts`;
    const intro = `Hi ${esc(person.full_name || "there")},<br/>${matches.length === 1 ? "A new job" : "New jobs"} matching your saved alerts just went live:`;
    try {
      await mailer.sendMail({
        to: person.email,
        subject: title.slice(0, 180),
        html: wrap(title, intro, jobRows(matches, site), site),
        text: `${matches.map((j) => `${j.title} (${j.company || ""}) – ${site}/jobs/${j.id}`).join("\n")}\n\nManage alerts: ${site}/job-alerts`,
      });
      sent++;
    } catch {
      failed++;
    }
  }
  return { sent, failed, skipped, people };
}

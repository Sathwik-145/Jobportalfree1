// Server runner for automatic festival greeting mails. Called from /api/public/run-mail-schedule.
import { getSetting, putSetting, sendGenericMails } from "@/lib/credential-mailer.server";
import {
  DEFAULT_FESTIVAL_MAILS,
  FESTIVAL_MAILS_KEY,
  FESTIVAL_MAILS_STATE_KEY,
  dueFestivalMails,
  festivalMailContent,
  parseCustomEmails,
  type FestivalMailSettings,
} from "@/lib/festivalMails";
import { DEFAULT_FESTIVAL_SETTINGS, festivalAppearance, type FestivalSettings } from "@/lib/festivals";

// Festival on/off + date overrides live in the site_settings table ("festivals" key).
async function siteSetting<T>(db: any, key: string, fallback: T): Promise<T> {
  const { data } = await db.from("site_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value ?? fallback) as T;
}

async function recipientsFor(db: any, s: FestivalMailSettings): Promise<{ name?: string; email: string }[]> {
  const out: { name?: string; email: string }[] = [];
  if (s.target === "users" || s.target === "both") {
    const { data } = await db.from("profiles").select("full_name,email");
    for (const p of data || []) if (p.email) out.push({ name: p.full_name || "", email: p.email });
  }
  if (s.target === "students" || s.target === "both") {
    const { data } = await db.from("students").select("name,email");
    for (const st of data || []) if (st.email) out.push({ name: st.name || "", email: st.email });
  }
  if (s.target === "custom") for (const email of parseCustomEmails(s.customEmails || "")) out.push({ email });
  const seen = new Set<string>();
  return out.filter((r) => {
    const key = r.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Sends the greeting for each festival that is due today and not yet mailed this year.
 * force (admin "send now") ignores the send time and the already-sent record.
 */
export async function runFestivalMails(db: any, force = false) {
  const s: FestivalMailSettings = { ...DEFAULT_FESTIVAL_MAILS, ...(await getSetting<Partial<FestivalMailSettings>>(db, FESTIVAL_MAILS_KEY, {})) };
  if (!s.enabled && !force) return { ran: false, reason: "disabled" };
  const fs: FestivalSettings = { ...DEFAULT_FESTIVAL_SETTINGS, ...(await siteSetting<Partial<FestivalSettings>>(db, "festivals", {})) };

  const offset = Number(s.tzOffsetMinutes ?? 330);
  const local = new Date(Date.now() + offset * 60000);
  const today = local.toISOString().slice(0, 10);
  const nowHM = local.toISOString().slice(11, 16);
  const year = today.slice(0, 4);

  const due = dueFestivalMails(s, fs, today, force ? "23:59" : nowHM);
  if (!due.length) return { ran: false, reason: "no festival due today", date: today };

  const state = await getSetting<{ sent?: Record<string, string> }>(db, FESTIVAL_MAILS_STATE_KEY, { sent: {} });
  const sent = { ...(state.sent || {}) };
  const pending = force ? due : due.filter((f) => !sent[`${f.id}@${year}`]);
  if (!pending.length) return { ran: false, reason: "already mailed for this year", date: today };

  const recipients = await recipientsFor(db, s);
  if (!recipients.length) return { ran: false, reason: "no recipients", date: today };

  const prettyDate = new Date(`${today}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const results: any[] = [];
  for (const f of pending) {
    const shown = festivalAppearance(f, fs);
    const { subject, body } = festivalMailContent(s, f);
    try {
      const r = await sendGenericMails({
        db,
        recipients,
        subject,
        body,
        source: force ? "festival-now" : "festival",
        senderName: s.senderName || "",
        vars: { festival: shown.name, greeting: shown.greeting, date: prettyDate },
      });
      if (!r.failed.length || r.sent > 0) sent[`${f.id}@${year}`] = new Date().toISOString();
      results.push({ festival: shown.name, sent: r.sent, total: r.total, failed: r.failed.length });
    } catch (e: any) {
      results.push({ festival: shown.name, error: String(e?.message || e) });
    }
  }
  await putSetting(db, FESTIVAL_MAILS_STATE_KEY, { sent, lastRunDate: today });
  return { ran: true, date: today, results };
}

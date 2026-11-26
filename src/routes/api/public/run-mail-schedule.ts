import { createFileRoute } from "@tanstack/react-router";
import { sendGenericMails, assignTests, getSetting, logMailRun, localToIso, putSetting, sendCredentialMails, serverDb } from "@/lib/credential-mailer.server";
import { runExamReminders } from "@/lib/exam-reminders.server";
import { schedulerAuthorized } from '@/lib/mail-auth.server';
import { processResultQueue } from "@/lib/result-mailer.server";
import { PASSWORD_REMINDER_EMAIL, PASSWORD_ROTATION_DAYS, reminderDue, type PasswordMeta } from "@/lib/passwordReminder";
import { plannedExamIds } from '@/exam/lib/examAvailability';
import { readCompletedExams, unsubmittedDailyExamIds } from '@/exam/lib/dailyAssignments';
import { runFestivalMails } from "@/lib/festival-mailer.server";
import { processDueAutoApprovals } from "@/lib/registration-approval.server";

/** Emails the official inbox when the admin password has not been changed for 30 days (repeats every 30 days). */
async function runPasswordReminder() {
  const db = serverDb();
  const meta = await getSetting<PasswordMeta>(db, "admin_password_meta", {});
  if (!meta.changedAt && !meta.lastReminderAt && !meta.baselineAt) { await putSetting(db, "admin_password_meta", { ...meta, baselineAt: Date.now() }); return { sent: false, reason: "baseline set" }; }
  if (!reminderDue(meta)) return { sent: false };
  const since = meta.changedAt ? new Date(meta.changedAt).toDateString() : "a long time";
  await sendGenericMails({ db, recipients: [{ name: "Admin", email: PASSWORD_REMINDER_EMAIL }], senderName: "JobPortalFree Security", source: "password-reminder",
    subject: `Reminder: reset your admin password (every ${PASSWORD_ROTATION_DAYS} days)`,
    body: `Hi Admin,\n\n**It is time to reset your admin password.**\n\nYour admin password was last changed: ${since}. For safety, please change it every ${PASSWORD_ROTATION_DAYS} days.\n\n[button={{siteUrl}}/admin/security]Change admin password[/button]\n\nIf you already changed it, you can ignore this email.\n\nJobPortalFree` });
  await putSetting(db, "admin_password_meta", { ...meta, lastReminderAt: Date.now() });
  return { sent: true };
}

// Mails per invocation — keeps each run well inside serverless time limits; the next ping continues.
const BATCH = 15;

/** Exam start for this run: the chosen time on the run date (stale/past dates roll to today). */
function startFor(value: string | undefined, today: string, fallbackTime: string, daily: boolean) {
  const v = value || "";
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(v);
  const hm = m ? m[2] : /^\d{2}:\d{2}$/.test(v) ? v : fallbackTime;
  if (m && !daily && m[1] >= today) return `${m[1]}T${hm}`;
  return `${today}T${hm}`;
}

/** The first schedule lives in "mail_schedule"; extra ones in "mail_schedules_more", each with its own state key. */
const stateKeyFor = (id: string) => (id === "main" ? "mail_schedule_state" : `mail_schedule_state_${id}`);

async function run(request: Request, force: boolean, scheduleId?: string) {
  const db = serverDb();
  const main = await getSetting<any>(db, "mail_schedule", null);
  const more = await getSetting<any[]>(db, "mail_schedules_more", []);
  const all = [...(main ? [{ ...main, id: "main" }] : []), ...(Array.isArray(more) ? more.filter((s) => s?.id) : [])];
  const targets = force ? all.filter((s) => s.id === (scheduleId || "main")) : all;
  if (!targets.length) return { ran: false, reason: "no schedule", schedules: [] };
  const schedules: any[] = [];
  for (const sch of targets) {
    try { schedules.push({ id: sch.id, name: sch.scheduleName || (sch.id === "main" ? "Schedule 1" : sch.id), ...(await runOne(request, db, sch, stateKeyFor(sch.id), force)) }); }
    catch (e: any) { schedules.push({ id: sch.id, ran: false, error: String(e?.message || e) }); }
  }
  const first = schedules.find((s) => s.ran) || schedules[0];
  return { ...first, schedules };
}

async function runOne(request: Request, db: any, sch: any, stateKey: string, force: boolean) {
  if (!sch.enabled && !force) return { ran: false, reason: "disabled" };
  const state = await getSetting<any>(db, stateKey, { sentIds: [] });

  const offset = Number(sch.tzOffsetMinutes ?? 330);
  const local = new Date(Date.now() + offset * 60000);
  const today = local.toISOString().slice(0, 10);
  const nowHM = local.toISOString().slice(11, 16);
  const time = sch.time || "09:00";
  // A run is identified by date + time, so changing the time re-arms today's send.
  const runKey = `${today}@${time}`;

  if (!force) {
    if (state.doneKey === runKey) return { ran: false, reason: "already sent for this time today" };
    if (nowHM < time) return { ran: false, reason: "not time yet" };
    if (sch.frequency === "dates" && !(sch.dates || []).includes(today)) return { ran: false, reason: "not a scheduled date" };
    if (sch.frequency === "range") {
      if (!sch.rangeFrom || today < sch.rangeFrom || (sch.rangeTo && today > sch.rangeTo)) return { ran: false, reason: "outside date range" };
    }
    if (state.lockUntil && state.lockUntil > Date.now()) return { ran: false, reason: "run in progress" };
  }
  // short lock so overlapping pings don't double-send; expires on its own if the function dies
  const lockToken = crypto.randomUUID();
  await putSetting(db, stateKey, { ...state, lockUntil: Date.now() + 90_000, lockToken });
  // Overlapping pings (cron + GitHub + open admin tabs) can all pass the check above; only the last writer proceeds.
  await new Promise((r) => setTimeout(r, 1500));
  const claimed = await getSetting<any>(db, stateKey, {});
  if (claimed.lockToken !== lockToken) return { ran: false, reason: "run in progress" };

  let ids: string[];
  if (sch.recipients === "selected") ids = sch.studentIds || [];
  else {
    const { data } = await db.from("students").select("id");
    ids = (data || []).map((r: any) => r.id);
  }
  const sentBefore = new Set<string>(state.sentIds || []);
  const sentByDate: Record<string, string[]> = state.sentByDate || {};
  const sentThisRun = new Set<string>(state.runKey === runKey ? state.runSentIds || [] : []);
  if (!force) ids = ids.filter((id) => !sentThisRun.has(id));
  if (sch.onceEver) ids = ids.filter((id) => !sentBefore.has(id));

  const daily = sch.assignMode === "daily";
  const examByStudent: Record<string, string> = {};
  const examsByStudent: Record<string, string[]> = {};
  let availableExams: any[] = [];
  let completed: Record<string, Set<string>> = {};
  if (daily) {
    const response = await db.from('exams').select('id,status,question_ids,created_at').order('created_at', { ascending: true });
    if (response.error) throw new Error(response.error.message);
    availableExams = (response.data || []).map((e: any) => ({ id: e.id, status: e.status, questionIds: e.question_ids || [], createdAt: e.created_at }));
    completed = await readCompletedExams(db, availableExams, ids);
  }
  for (const id of ids) {
    const planned = plannedExamIds(sch, id, today);
    const all = daily ? unsubmittedDailyExamIds(planned, availableExams, completed[id] || []) : planned;
    if (all.length) { examByStudent[id] = all[0]; examsByStudent[id] = all; }
  }
  // Empty days and students who have exhausted all tests are skipped, never sent a fallback.
  if (daily) ids = ids.filter((id) => examByStudent[id]);

  const batch = ids.slice(0, BATCH);
  const remaining = ids.length - batch.length;

  let result: any = { sent: 0, total: 0, failed: [], sentIds: [] };
  let err = "";
  const startByStudent: Record<string, string | null> = {};
  let assignedCount = 0;
  if (batch.length) {
    try {
      const origin = new URL(request.url).origin;
      const plan: Record<string, { examId: string; start: string | null; buffer: number }> = {};
      for (const id of batch) {
        const raw = sch.assignMode === "different" ? sch.perStudentStart?.[id] || sch.defaultStart : sch.defaultStart;
        // Explicit one-off dates remain exact; daily plans use their actual day's start.
        // An empty custom field must not invent a start from the email send time.
        const fixedDaily = sch.examStartMode === "daily-time" && /^\d{2}:\d{2}$/.test(sch.dailyStartTime || "");
        const custom = fixedDaily
          ? localToIso(`${today}T${sch.dailyStartTime}`, offset)
          : daily && sch.examStartMode === 'custom' && raw
          ? localToIso(startFor(raw, today, time, true), offset)
          : sch.examStartMode === "custom" && raw ? localToIso(raw, offset) : null;
        startByStudent[id] = custom;
        if (examByStudent[id] && (sch.autoExam || daily)) plan[id] = { examId: examByStudent[id], start: custom, buffer: Number(sch.bufferMinutes ?? 10) };
      }
      result = await sendCredentialMails({
        db, studentIds: batch, loginUrl: `${origin}/exam-login`,
        target: sch.mailTarget === "login" ? "login" : "personal",
        usePersonalLogin: sch.usePersonalLogin === true,
        templateId: sch.templateId || "credentials", examByStudent, examsByStudent, startByStudent,
        includeExamSchedule: sch.includeExamSchedule !== false,
        useExamSchedule: sch.examStartMode !== "custom" && sch.examStartMode !== "daily-time",
        windowMinutes: Number(sch.bufferMinutes ?? 10),
        attachments: sch.attachments || [],
        tzOffsetMinutes: offset, source: force ? "run-now" : "scheduled",
        templateOverride: sch.templateSubject || sch.templateBody ? { name: sch.templateName, subject: sch.templateSubject, body: sch.templateBody } : undefined,
      });
      // Assign every exam planned for today (a day may hold several tests).
      const maxN = Math.max(0, ...result.sentIds.map((id: string) => (examsByStudent[id] || []).length));
      for (let n = 0; n < maxN; n++) {
        const okPlan: typeof plan = {};
        for (const id of result.sentIds) {
          const exId = examsByStudent[id]?.[n];
          if (plan[id] && exId) okPlan[id] = { ...plan[id], examId: exId };
        }
        if (Object.keys(okPlan).length) assignedCount += (await assignTests(db, okPlan)).assigned;
      }
      if (daily && result.sentIds.length) {
        const dailyPlan = { ...(sch.dailyPlan || {}) };
        for (const id of result.sentIds) dailyPlan[id] = { ...(dailyPlan[id] || {}), [today]: examsByStudent[id] };
        if (sch.id === 'main') await putSetting(db, 'mail_schedule', { ...sch, dailyPlan });
        else {
          const more = await getSetting<any[]>(db, 'mail_schedules_more', []);
          await putSetting(db, 'mail_schedules_more', more.map(s => s.id === sch.id ? { ...s, dailyPlan } : s));
        }
      }
    } catch (e: any) {
      err = String(e?.message || e);
      await logMailRun(db, { source: force ? "run-now" : "scheduled", template: sch.templateName || sch.templateId || "Credentials",
        results: batch.map((id) => ({ id, name: id, email: "", ok: false, error: err })) });
    }
  }

  const info = err
    ? `Error: ${err}`
    : `Sent ${result.sent} of ${result.total}${result.failed.length ? `, ${result.failed.length} failed` : ""}${assignedCount ? ` · ${assignedCount} test(s) assigned` : ""}${remaining > 0 ? ` · ${remaining} more queued` : ""}`;

  const runSent = Array.from(new Set([...sentThisRun, ...result.sentIds]));
  const dayList = Array.from(new Set([...(sentByDate[today] || []), ...result.sentIds]));
  const keepDates = Object.keys({ ...sentByDate, [today]: 1 }).sort().slice(-10);
  const nextByDate: Record<string, string[]> = {};
  for (const d of keepDates) nextByDate[d] = d === today ? dayList : sentByDate[d];

  const latest = await getSetting<any>(db, stateKey, state);
  await putSetting(db, stateKey, {
    ...latest,
    lockUntil: 0,
    // "Run now" must never touch the scheduled run bookkeeping, or the next timed run skips everyone.
    runKey: force ? latest.runKey : runKey,
    runSentIds: force ? latest.runSentIds || [] : runSent,
    // finished only when nothing is left and no hard error (so errors retry on the next ping)
    doneKey: force ? latest.doneKey : !err && !result.failed.length && remaining === 0 ? runKey : latest.doneKey,
    lastRunDate: today,
    lastRunInfo: `${today} ${nowHM} — ${info}`,
    lastRunOk: !err && !result.failed.length,
    sentIds: Array.from(new Set([...sentBefore, ...result.sentIds])),
    sentByDate: nextByDate,
  });
  return { ran: true, info, remaining, ...result };
}

/** Main admin panel scheduled announcements, sent on the same ping. */
async function runPortal(force = false) {
  const db = serverDb();
  const list = await getSetting<any[]>(db, "portal_mail_schedules", []);
  if (!Array.isArray(list) || !list.length) return [];
  const out: any[] = [];
  let changed = false;
  for (const sch of list) {
    if (!sch?.enabled) continue;
    const offset = Number(sch.tzOffsetMinutes ?? 330);
    const local = new Date(Date.now() + offset * 60000);
    const today = local.toISOString().slice(0, 10);
    const nowHM = local.toISOString().slice(11, 16);
    const time = sch.time || "09:00";
    const key = `${today}@${time}`;
    if (!force && sch.doneKey === key) continue;
    if (nowHM < time) continue;
    if (sch.frequency === "once" && (sch.date !== today)) { if (sch.date && sch.date < today) { sch.enabled = false; changed = true; } continue; }
    if (sch.frequency === "range" && (!sch.rangeFrom || today < sch.rangeFrom || (sch.rangeTo && today > sch.rangeTo))) continue;
    if (sch.lockUntil && sch.lockUntil > Date.now()) continue;
    const token = crypto.randomUUID();
    sch.lockUntil = Date.now() + 90000; sch.lockToken = token; changed = true;
    await putSetting(db, "portal_mail_schedules", list);
    await new Promise((r) => setTimeout(r, 1500));
    const fresh = await getSetting<any[]>(db, "portal_mail_schedules", []);
    if (sch.id && fresh.find((x: any) => x.id === sch.id)?.lockToken !== token) continue;
    try {
      const sent = new Set<string>(sch.runKey === key ? sch.runSentEmails || [] : []);
      const remaining = (sch.recipients || []).filter((r: any) => !sent.has(r.email));
      const batch = remaining.slice(0, BATCH);
      const r = await sendGenericMails({ db, recipients: batch, subject: sch.subject, body: sch.body, source: "scheduled", senderName: sch.senderName || "", attachments: sch.attachments || [] });
      const failed = new Set(r.failed.map((r: any) => r.email));
      for (const person of batch) if (!failed.has(person.email)) sent.add(person.email);
      sch.runKey = key; sch.runSentEmails = [...sent];
      const complete = remaining.length <= BATCH && !r.failed.length;
      if (complete) sch.doneKey = key;
      sch.lastRunInfo = `${today} ${nowHM} — Sent ${r.sent} of ${r.total}`;
      if (complete && sch.frequency === "once") sch.enabled = false;
    } catch (e: any) { sch.doneKey = ""; sch.lastRunInfo = `${today} ${nowHM} — Error: ${String(e?.message || e)}`; }
    sch.lockUntil = 0;
    out.push(sch.lastRunInfo);
  }
  if (changed) await putSetting(db, "portal_mail_schedules", list);
  return out;
}

export const Route = createFileRoute("/api/public/run-mail-schedule")({
  server: {
    handlers: {
      // Public ping (cron-job.org, browsers): only runs work that is already due, never forced sends.
      GET: async ({ request }) => {
        let portal: any[] = [];
        try { portal = await runPortal(); } catch {}
        let reminders: any = null;
        try { reminders = await runExamReminders(serverDb()); } catch (e: any) { reminders = { error: String(e?.message || e) }; }
        let password: any = null;
        try { password = await runPasswordReminder(); } catch (e: any) { password = { error: String(e?.message || e) }; }
        let results: any = null;
        try { results = await processResultQueue(serverDb()); } catch (e: any) { results = { error: String(e?.message || e) }; }
        let festivals: any = null;
        try { festivals = await runFestivalMails(serverDb()); } catch (e: any) { festivals = { error: String(e?.message || e) }; }
        let bookings: any = null;
        try { const b = await processDueAutoApprovals(serverDb()); bookings = { approved: b.approved, pending: b.pending }; } catch (e: any) { bookings = { error: String(e?.message || e) }; }
        try { return Response.json({ ...(await run(request, false)), portal, reminders, results, password, festivals, bookings }); }
        catch (e: any) { console.error("run-mail-schedule", e); return Response.json({ ran: false, error: String(e?.message || e), portal, reminders, results, festivals }); }
      },
      POST: async ({ request }) => {
        if (!(await schedulerAuthorized(request))) return Response.json({ error: 'Admin or scheduled-task authorization required' }, { status: 401 });
        let force = false;
        let scheduleId = "main";
        let festivalsNow = false;
        try {
          const b = await request.json();
          force = !!b?.force;
          festivalsNow = !!b?.festivals;
          if (typeof b?.scheduleId === "string" && /^[\w-]{1,60}$/.test(b.scheduleId)) scheduleId = b.scheduleId;
        } catch {}
        if (festivalsNow) {
          try { return Response.json(await runFestivalMails(serverDb(), true)); }
          catch (e: any) { return Response.json({ error: String(e?.message || e) }, { status: 500 }); }
        }
        try { return Response.json({ ...(await run(request, force, scheduleId)), portal: await runPortal() }); }
        catch (e: any) { return Response.json({ error: String(e?.message || e) }, { status: 500 }); }
      },
    },
  },
});

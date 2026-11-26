import { createClient } from "@supabase/supabase-js";
import { DEFAULT_TEMPLATES } from "@/exam/lib/mailTemplates";
import { renderMail, scheduledExamVars } from "@/exam/lib/mailContent";
import { validateMailAttachments, type MailAttachment } from '@/exam/lib/mailAttachments';
import { createBrevoTransport } from '@/lib/brevo-mail.server';
import { readPasswords } from '@/exam/lib/credentialStore';
import { serverAccessKey } from '@/lib/server-access.server';
import { credentialEmail, PERSONAL_LOGIN_KEY, PERSONAL_LOGIN_POLICY_KEY, DEFAULT_PERSONAL_LOGIN_POLICY } from '@/exam/lib/loginIdentity';
import { databaseUrl, databaseKey, databaseServiceKey } from "@/lib/database-target";

const imageAttachments = (items?: MailAttachment[]) => validateMailAttachments(items).map(item => ({ filename: item.name, content: item.data, encoding: 'base64' as const, contentType: item.type }));

export const fill = (t: string, v: Record<string, string>) =>
  t.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => v[k] ?? "");

/** True when the private server key is configured (otherwise serverDb() runs with public access). */
export const hasServerKey = () => !!databaseServiceKey();

/** Server key client when configured; otherwise the verified admin's own client so staff rules still apply. */
export const adminOrServerDb = (adminDb: any) => (hasServerKey() || !adminDb ? serverDb() : adminDb);

export function serverDb() {
  const url = databaseUrl();
  // Server-only: the service key lets mailers read private exam data (credentials, registrations).
  // Every route using this must verify its caller first (admin token, cron secret or a saved record).
  const key = databaseServiceKey() || databaseKey();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        // No server key: identify the website server with the private CRON_SECRET header.
        if (!hasServerKey() && serverAccessKey()) h.set("x-server-key", serverAccessKey());
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const GENERATED = /@student\.codexam\.com$/i;

export async function getSetting<T>(db: any, key: string, fallback: T): Promise<T> {
  const { data } = await db.from("codexam_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value ?? fallback) as T;
}
export async function putSetting(db: any, key: string, value: any) {
  const { error } = await db.from("codexam_settings").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw new Error('Could not save settings');
}

function fmtDate(d: Date, offsetMin: number) {
  const l = new Date(d.getTime() + offsetMin * 60000);
  const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let h = l.getUTCHours(); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
  return `${l.getUTCDate()} ${M[l.getUTCMonth()]} ${l.getUTCFullYear()}, ${h}:${String(l.getUTCMinutes()).padStart(2, "0")} ${ap}`;
}

/**
 * Sends each student a mail from the chosen template.
 * target 'personal' → personal email (falls back to login email if it is real); 'login' → login email.
 * examByStudent: studentId → examId, used for {{examTitle}} / {{examStart}} / {{examEnd}}.
 */
export async function sendCredentialMails(opts: {
  db: any;
  studentIds: string[];
  loginUrl: string;
  target: "personal" | "login";
  templateId?: string;
  examByStudent?: Record<string, string>;
  examsByStudent?: Record<string, string[]>;
  tzOffsetMinutes?: number;
  source?: string;
  startByStudent?: Record<string, string | null>;
  includeExamSchedule?: boolean;
  useExamSchedule?: boolean;
  /** Start window in minutes; the email end time becomes start + window when set. */
  windowMinutes?: number;
  templateOverride?: { name?: string; subject?: string; body?: string };
  attachments?: MailAttachment[];
  usePersonalLogin?: boolean;
}) {
  const { db, studentIds, loginUrl, target, examByStudent = {}, startByStudent = {}, tzOffsetMinutes = 330, source = "manual" } = opts;
  const attachments = imageAttachments(opts.attachments);
  const mailer = await getSetting<any>(db, "mailer", {});
  const user = (process.env['BREVO_SENDER_EMAIL'] || mailer.senderEmail || 'jobportalfreeofficial@gmail.com').trim();
  const senderName = mailer.senderName || (await examBrandName(db));
  const brandName = await examBrandName(db);

  const s = await getSetting<any>(db, "general", {});
  const tid = opts.templateId || "credentials";
  const tpl = (s.templates || []).find((t: any) => t.id === tid) || DEFAULT_TEMPLATES.find((t) => t.id === tid);
  const ov = opts.templateOverride;
  const tplName = ov?.name || tpl?.name || "Credentials";
  const subject = ov?.subject || tpl?.subject || s.emailSubject || `Your ${await examBrandName(db)} exam credentials`;
  const template = ov?.body ?? tpl?.body ?? s.emailBody ?? "Hi {{name}},\n\nLogin: {{loginUrl}}\nEmail: {{email}}\nPassword: {{password}}";
  const contacts = await getSetting<Record<string, string>>(db, "student_contacts", {});

  const { data: studentRows, error } = await db.from("students").select("id,name,email").in("id", studentIds);
  if (error) throw new Error(error.message);
  const passwordById = await readPasswords(db, studentIds);
  const students = (studentRows || []).map((st: any) => ({ ...st, password: passwordById[st.id] || "" }));

  const examIds = Array.from(new Set([...Object.values(examByStudent), ...Object.values(opts.examsByStudent || {}).flat()].filter(Boolean)));
  const examMap: Record<string, any> = {};
  if (examIds.length) {
    const { data: exs } = await db.from("exams").select("id,title,scheduled_at,started_at,start_buffer_minutes,exam_duration_minutes").in("id", examIds);
    for (const e of exs || []) examMap[e.id] = e;
  }
  const examVars = (id?: string, slotStart?: string | null) => {
    const e = id ? examMap[id] : null;
    const dur = Number(e?.exam_duration_minutes || 0);
    const buf = Number(e?.start_buffer_minutes || 0);
    return {
      examTitle: e?.title || brandName,
      ...scheduledExamVars(opts.includeExamSchedule === false ? null : slotStart || (opts.useExamSchedule === false ? null : e?.scheduled_at), tzOffsetMinutes, Number(opts.windowMinutes) > 0 ? Number(opts.windowMinutes) : buf > 0 ? buf : dur),
      examDuration: dur ? `${dur} minutes` : "as mentioned in the exam",
    };
  };

  const transport = createBrevoTransport(user, senderName);

  const aliases = await getSetting<Record<string, string>>(db, PERSONAL_LOGIN_KEY, {});
  const policy = await getSetting(db, PERSONAL_LOGIN_POLICY_KEY, DEFAULT_PERSONAL_LOGIN_POLICY);

  const results: { id: string; name: string; email: string; ok: boolean; error?: string }[] = [];
  for (const st of students || []) {
    const personal = contacts[st.id];
    let to = target === "personal" ? personal || st.email : st.email;
    if (GENERATED.test(to || "")) {
      if (personal) to = personal;
      else { results.push({ id: st.id, name: st.name, email: st.email, ok: false, error: "No personal email (generated login email can't receive mail)" }); continue; }
    }
    let loginEmail = st.email;
    try {
      loginEmail = credentialEmail(st.email, personal, opts.usePersonalLogin === true);
      if (opts.usePersonalLogin) {
        if (policy.students?.[st.id] === false) throw new Error('Personal-email sign-in is disabled for this student. Allow it in Students before sending personal credentials.');
        const duplicate = (students || []).some((other: any) => other.id !== st.id && String(other.email).toLowerCase() === loginEmail) || Object.entries(contacts).some(([id, address]) => id !== st.id && address.toLowerCase() === loginEmail);
        if (duplicate) throw new Error('This personal email belongs to another student. Use a unique address.');
        aliases[st.id] = loginEmail;
        await putSetting(db, PERSONAL_LOGIN_KEY, aliases);
      }
    } catch (e: any) { results.push({ id: st.id, name: st.name, email: to, ok: false, error: e.message }); continue; }
    const vars = { name: st.name || "Student", email: loginEmail, password: st.password || "", loginUrl, ...examVars(examByStudent[st.id], startByStudent[st.id]) };
    const planned = opts.examsByStudent?.[st.id] || (examByStudent[st.id] ? [examByStudent[st.id]] : []);
    if (planned.some(id => !examMap[id])) {
      results.push({ id: st.id, name: st.name, email: to, ok: false, error: 'An assigned test no longer exists. Update the schedule.' }); continue;
    }
    if (planned.length) vars.examTitle = planned.map(id => examMap[id].title).join(', ');
    try {
      const content = renderMail(template, vars);
      const mailSubject = fill(subject, vars).replace(/\s+(?:starts at|at)\s*$/i, '').trim();
      await transport.sendMail({ from: `"${senderName}" <${user}>`, to, subject: mailSubject, ...content, attachments });
      results.push({ id: st.id, name: st.name, email: to, ok: true });
    } catch (e: any) {
      results.push({ id: st.id, name: st.name, email: to, ok: false, error: String(e?.message || e) });
    }
  }

  try { transport.close(); } catch {}
  // Delivery log (latest 30 runs)
  try {
    const log = await getSetting<any[]>(db, "mail_log", []);
    log.unshift({ at: new Date().toISOString(), source, template: tplName, results });
    await putSetting(db, "mail_log", log.slice(0, 30));
  } catch {}

  return {
    sent: results.filter((r) => r.ok).length,
    sentIds: results.filter((r) => r.ok).map((r) => r.id),
    failed: results.filter((r) => !r.ok),
    total: results.length,
  };
}

/** datetime-local string in admin's timezone -> ISO */
export async function logMailRun(db: any, entry: any) {
  try {
    const log = await getSetting<any[]>(db, "mail_log", []);
    log.unshift({ at: new Date().toISOString(), ...entry });
    await putSetting(db, "mail_log", log.slice(0, 30));
  } catch {}
}

export function localToIso(v: string | undefined | null, offsetMin: number): string | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v);
  if (!m) return null;
  const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - offsetMin * 60000;
  return new Date(utc).toISOString();
}

/**
 * Assigns tests to students: adds them to exams.assigned_student_ids and writes their personal
 * start slot (start time + start window) so the student dashboard opens it only in their window.
 * plan: studentId -> { examId, start (ISO or null = use the test's own time), buffer }
 */
export async function assignTests(db: any, plan: Record<string, { examId: string; start: string | null; buffer: number }>) {
  const byExam: Record<string, string[]> = {};
  for (const [sid, p] of Object.entries(plan)) if (p.examId) (byExam[p.examId] ||= []).push(sid);
  const examIds = Object.keys(byExam);
  if (!examIds.length) return { assigned: 0, startByStudent: {} as Record<string, string | null> };
  const { data: exs, error } = await db.from("exams").select("id,assigned_student_ids,scheduled_at,start_buffer_minutes").in("id", examIds);
  if (error) throw new Error(`Could not read tests: ${error.message}`);
  const found: Record<string, any> = {};
  for (const e of exs || []) found[e.id] = e;
  let assigned = 0;
  for (const [examId, sids] of Object.entries(byExam)) {
    const ex = found[examId];
    if (!ex) continue;
    const cur: string[] = Array.isArray(ex.assigned_student_ids) ? ex.assigned_student_ids : [];
    const next = Array.from(new Set([...cur, ...sids]));
    const { error: uerr } = await db.from("exams").update({ assigned_student_ids: next }).eq("id", examId);
    if (uerr) throw new Error(`Could not assign test: ${uerr.message}`);
    assigned += sids.length;
  }
  const slots = await getSetting<Record<string, Record<string, any>>>(db, "student_exam_slots", {});
  const startByStudent: Record<string, string | null> = {};
  for (const [sid, p] of Object.entries(plan)) {
    const ex = found[p.examId];
    if (!ex) continue;
    const start = p.start || ex.scheduled_at || null;
    const buffer = Number.isFinite(p.buffer) && p.buffer > 0 ? p.buffer : Number(ex.start_buffer_minutes || 0);
    (slots[sid] ||= {})[p.examId] = { start, buffer };
    startByStudent[sid] = start;
  }
  await putSetting(db, "student_exam_slots", slots);
  return { assigned, startByStudent };
}

/** Emails each student their result. items carry the computed result vars; recipient is looked up server-side. */
export async function sendResultMails(opts: {
  db: any; target: "personal" | "login"; subject: string; body: string;
  items: { studentId: string; vars: Record<string, string>; attachments?: MailAttachment[] }[];
  attachments?: MailAttachment[];
}) {
  const { db, target, subject, body, items } = opts;
  const attachments = imageAttachments(opts.attachments);
  const mailer = await getSetting<any>(db, "mailer", {});
  const user = (process.env['BREVO_SENDER_EMAIL'] || mailer.senderEmail || 'jobportalfreeofficial@gmail.com').trim();
  const senderName = mailer.senderName || (await examBrandName(db));
  const contacts = await getSetting<Record<string, string>>(db, "student_contacts", {});
  const ids = Array.from(new Set(items.map((i) => i.studentId)));
  const { data: students, error } = await db.from("students").select("id,name,email").in("id", ids);
  if (error) throw new Error(error.message);
  const byId: Record<string, any> = {};
  for (const st of students || []) byId[st.id] = st;
  const transport = createBrevoTransport(user, senderName);
  const results: { id: string; name: string; email: string; ok: boolean; error?: string }[] = [];
  for (const it of items) {
    const st = byId[it.studentId];
    if (!st) continue;
    const personal = contacts[st.id];
    let to = target === "personal" ? personal || st.email : st.email;
    if (GENERATED.test(to || "")) {
      if (personal) to = personal;
      else { results.push({ id: st.id, name: st.name, email: st.email, ok: false, error: "No personal email" }); continue; }
    }
    const vars = { ...it.vars, name: st.name || "Student", email: st.email };
    try {
      await transport.sendMail({ from: `"${senderName}" <${user}>`, to, subject: fill(subject, vars), ...renderMail(body, vars, false), attachments: [...attachments, ...imageAttachments(it.attachments)] });
      results.push({ id: st.id, name: st.name, email: to, ok: true });
    } catch (e: any) {
      results.push({ id: st.id, name: st.name, email: to, ok: false, error: String(e?.message || e) });
    }
  }
  try { transport.close(); } catch {}
  try {
    const log = await getSetting<any[]>(db, "mail_log", []);
    log.unshift({ at: new Date().toISOString(), source: "results", template: "Results", results });
    await putSetting(db, "mail_log", log.slice(0, 30));
  } catch {}
  return { sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok), total: results.length };
}

/** Sends one formatted mail to each given address (main admin panel announcements). */
export async function sendGenericMails(opts: { db: any; recipients: { name?: string; email: string }[]; subject: string; body: string; source?: string; vars?: Record<string, string>; attachments?: MailAttachment[]; senderName?: string }) {
  const { db, recipients, subject, body } = opts;
  const attachments = imageAttachments(opts.attachments);
  const mailer = await getSetting<any>(db, "mailer", {});
  const user = (process.env['BREVO_SENDER_EMAIL'] || mailer.senderEmail || 'jobportalfreeofficial@gmail.com').trim();
  const savedName = await getSetting<string>(db, "portal_sender_name", "");
  const senderName = (opts.senderName || savedName || mailer.portalSenderName || "JobPortalFree").replace(/["<>\r\n]/g, "").slice(0, 60);
  const transport = createBrevoTransport(user, senderName);
  const results: { id: string; name: string; email: string; ok: boolean; error?: string }[] = [];
  for (const r of recipients) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email || "")) continue;
    const vars = { ...(opts.vars || {}), name: r.name || "there", email: r.email };
    try {
      await transport.sendMail({ from: `"${senderName}" <${user}>`, to: r.email, subject: fill(subject, vars), ...renderMail(body, vars, false), attachments });
      results.push({ id: r.email, name: r.name || "", email: r.email, ok: true });
    } catch (e: any) {
      results.push({ id: r.email, name: r.name || "", email: r.email, ok: false, error: String(e?.message || e) });
    }
  }
  try { transport.close(); } catch {}
  try {
    const log = await getSetting<any[]>(db, "portal_mail_log", []);
    log.unshift({ at: new Date().toISOString(), source: opts.source || "manual", subject, results });
    await putSetting(db, "portal_mail_log", log.slice(0, 30));
  } catch {}
  return { sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok), total: results.length };
}

/** The admin-editable exam portal name (Presentation settings → exam_branding), defaulting to CodeXam. */
export async function examBrandName(db: any): Promise<string> {
  const b = await getSetting<any>(db, "exam_branding", {});
  return (typeof b?.name === "string" && b.name.trim()) || "CodeXam";
}

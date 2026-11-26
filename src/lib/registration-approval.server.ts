// @ts-nocheck
// Shared approval for registrations, link sign-ups and slot bookings (manual one-click and automatic).
import { assignTests, getSetting, sendCredentialMails } from "@/lib/credential-mailer.server";
import { ALLOCATION_KEY, normalizeAllocation, pickRandomExam, autoApproveDueAt } from "@/exam/lib/testAllocation";
import { readPasswords, writePassword } from "@/exam/lib/credentialStore";

const genPassword = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), b => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join("");

export class ApprovalError extends Error { status: number; constructor(msg: string, status = 400) { super(msg); this.status = status; } }

export interface ApproveOptions {
  ids?: string[];
  clientIds?: string[];
  examChoice?: string;
  tz?: number;
  customStart?: string | null;
  useBookedSlot?: boolean;
  sendEmail?: boolean;
  loginUrl?: string;
  templateId?: string;
  windowMinutes?: number | null;
  source?: string;
}

/** Creates (or reuses) each student, allocates the chosen or a random test, opens their start window and emails the login. */
export async function approveRegistrations(db: any, o: ApproveOptions) {
  const ids = o.ids || [];
  const clientIds = o.clientIds || [];
  if (!ids.length && !clientIds.length) throw new ApprovalError("No registrations selected");
  const tz = Number.isFinite(Number(o.tz)) ? Number(o.tz) : 330;
  const alloc = normalizeAllocation(await getSetting(db, ALLOCATION_KEY, null));
  const windowMinutes = Number.isFinite(Number(o.windowMinutes)) && Number(o.windowMinutes) >= 5
    ? Math.min(10080, Math.round(Number(o.windowMinutes))) : alloc.approvalWindowMinutes;

  const query = db.from("registrations").select("*");
  const { data: regs, error: rErr } = ids.length ? await query.in("id", ids) : await query.in("client_id", clientIds);
  if (rErr) throw new Error(`Could not read registrations: ${rErr.message}`);
  const { data: examRows, error: eErr } = await db.from("exams").select("id,title,status,question_ids,mcq_ids,writing_ids,fib_ids");
  if (eErr) throw new Error(`Could not read tests: ${eErr.message}`);
  const exams = examRows || [];
  let chosen: any = null;
  if (o.examChoice) {
    chosen = exams.find((e: any) => e.id === o.examChoice && e.status !== "draft");
    if (!chosen) throw new ApprovalError("The selected test is not published.");
  } else if (!pickRandomExam(exams, alloc)) {
    throw new ApprovalError("No published tests are available for random allocation. Publish a test or update the random test pool.");
  }

  const now = Date.now();
  const plan: Record<string, { examId: string; start: string | null; buffer: number }> = {};
  const out: any[] = [];
  let i = 0;
  for (const r of regs || []) {
    const email = String(r.email || "").trim().toLowerCase();
    if (!email) { out.push({ id: r.id, name: r.name, email, ok: false, error: "Registration has no email" }); continue; }
    const exam = chosen || pickRandomExam(exams, alloc);
    const booked = r.answers?.slot_start && Date.parse(r.answers.slot_start) > now ? r.answers.slot_start : null;
    const start = o.customStart || (o.useBookedSlot !== false && booked) || new Date(now).toISOString();

    // Reuse an existing student with the same email so history stays together.
    const { data: existing } = await db.from("students").select("id").ilike("email", email).limit(1);
    let studentId = existing?.[0]?.id as string | undefined;
    let password = "";
    if (studentId) {
      password = (await readPasswords(db, [studentId]))[studentId] || "";
    } else {
      studentId = `s_${now}${i++}`;
      const { error: sErr } = await db.from("students").insert({ id: studentId, name: r.name || email, email, is_blocked: false, tab_switch_count: 0, max_tab_switches: alloc.maxTabSwitches, exam_status: "not_started", assigned_questions: [], retake_exam_ids: [] });
      if (sErr) { out.push({ id: r.id, name: r.name, email, ok: false, error: `Could not create student: ${sErr.message}` }); continue; }
    }
    if (!password) {
      password = genPassword();
      const cErr = await writePassword(db, studentId, password);
      if (cErr) { out.push({ id: r.id, name: r.name, email, ok: false, error: `Could not save password: ${cErr}` }); continue; }
    }
    const answers = { ...(r.answers || {}), assigned_exam_id: exam.id, assigned_exam_title: exam.title, assigned_start: start, assigned_window_minutes: windowMinutes, approved_by: o.source || "admin" };
    delete answers.auto_error;
    const { error: uErr } = await db.from("registrations").update({ status: "approved", approved_at: new Date().toISOString(), approved_student_id: studentId, answers }).eq("id", r.id);
    if (uErr) { out.push({ id: r.id, name: r.name, email, ok: false, error: `Could not update registration: ${uErr.message}` }); continue; }
    plan[studentId] = { examId: exam.id, start, buffer: windowMinutes };
    out.push({ id: r.id, clientId: r.client_id, name: r.name, email, ok: true, studentId, password, examId: exam.id, examTitle: exam.title, start, windowMinutes, mailed: false });
  }

  if (Object.keys(plan).length) await assignTests(db, plan);

  let mailError = "";
  if (o.sendEmail !== false && Object.keys(plan).length) {
    try {
      const examByStudent: Record<string, string> = {};
      const startByStudent: Record<string, string | null> = {};
      for (const [sid, p] of Object.entries(plan)) { examByStudent[sid] = p.examId; startByStudent[sid] = p.start; }
      const res = await sendCredentialMails({ db, studentIds: Object.keys(plan), loginUrl: o.loginUrl || "", target: "login", templateId: o.templateId || alloc.approvalTemplateId, examByStudent, startByStudent, windowMinutes, includeExamSchedule: true, useExamSchedule: false, tzOffsetMinutes: tz, source: o.source || "approval" });
      const sent = new Set(res.sentIds);
      const failed = Object.fromEntries(res.failed.map((f: any) => [f.id, f.error]));
      for (const row of out) if (row.ok) { row.mailed = sent.has(row.studentId); if (!row.mailed) row.mailError = failed[row.studentId] || "Not sent"; }
    } catch (e: any) { mailError = String(e?.message || e); for (const row of out) if (row.ok) row.mailError = mailError; }
  }
  return { approved: out.filter(r => r.ok).length, results: out, mailError };
}

const isBookingRow = (r: any) => r?.answers?.kind === "booking" || !!r?.answers?.slot_start || /^Booked for later/i.test(r?.notes || "");

/**
 * Approves slot bookings whose admin-chosen delay has passed. Safe to call often (cron ping, new booking,
 * admin page): each booking is claimed once, so overlapping calls never send twice.
 */
export async function processDueAutoApprovals(db: any, now = Date.now()) {
  const alloc = normalizeAllocation(await getSetting(db, ALLOCATION_KEY, null));
  if (!alloc.bookingAutoApprove) return { approved: 0, pending: 0, reason: "auto-approve off" };
  const since = alloc.bookingAutoSince ? new Date(alloc.bookingAutoSince).toISOString() : new Date(0).toISOString();
  const { data, error } = await db.from("registrations").select("id,created_at,notes,answers,status")
    .eq("status", "pending").is("link_id", null).gte("created_at", since).order("created_at", { ascending: true }).limit(200);
  if (error) throw new Error(error.message);
  const bookings = (data || []).filter(isBookingRow);
  const due = bookings.filter(r => autoApproveDueAt(r.created_at, alloc) <= now).slice(0, 10);
  let approved = 0; const errors: any[] = [];
  for (const r of due) {
    // Claim: only one caller can move this row out of "pending".
    const { data: claimed } = await db.from("registrations").update({ status: "approving" }).eq("id", r.id).eq("status", "pending").select("id");
    if (!claimed?.length) continue;
    try {
      const loginUrl = typeof r.answers?.login_url === "string" && /^https?:\/\//.test(r.answers.login_url) ? r.answers.login_url.slice(0, 200) : "";
      const res = await approveRegistrations(db, { ids: [r.id], examChoice: alloc.bookingAutoExamId || "", useBookedSlot: true, sendEmail: alloc.bookingAutoSendEmail, loginUrl, source: "auto-approval", tz: Number(r.answers?.tz_offset ?? 330) });
      if (res.approved) approved += res.approved;
      else throw new Error(res.results?.[0]?.error || "Not approved");
    } catch (e: any) {
      const msg = String(e?.message || e).slice(0, 300);
      errors.push({ id: r.id, error: msg });
      await db.from("registrations").update({ status: "pending", answers: { ...(r.answers || {}), auto_error: msg } }).eq("id", r.id);
    }
  }
  return { approved, pending: bookings.length - approved, errors };
}

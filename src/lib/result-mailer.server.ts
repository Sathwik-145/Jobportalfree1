// @ts-nocheck
// Automatic / scheduled result emails with an optional detailed PDF report.
import { getSetting, putSetting, sendResultMails } from "@/lib/credential-mailer.server";
import { dbToExam, dbToQuestion, dbToStudent } from "@/exam/lib/supabase-helpers";
import { reportPdfBase64, reportFileName, resultVars } from "@/exam/lib/resultReport";
import { DEFAULT_RESULT_TEMPLATE } from "@/exam/lib/mailTemplates";
import { correctedReport } from '@/exam/lib/reportCorrections';
import { REPORT_LAYOUT_KEY, validReportLayout } from '@/exam/lib/reportLayouts';
import { sourceResultCfg } from '@/exam/lib/resultSourceDefaults';

export interface ResultSendConfig {
  enabled: boolean;
  delayMinutes: number;
  attachPdf: boolean;
  includeQA: boolean;
  target?: "personal" | "login";
  passPct?: number;
  frequency?: 'submit' | 'daily';
  time?: string;
  tzOffsetMinutes?: number;
}
export interface QueueItem {
  id: string; studentId: string; examId: string; dueAt: number;
  cfg: ResultSendConfig; subject?: string; body?: string; source: "auto" | "admin";
}

const QUEUE = "result_mail_queue";
const CFG = "result_auto_send";

/** Which sign-up path a student came from, based on their saved registration note. */
export async function studentSource(db: any, studentId: string): Promise<"quick" | "later" | null> {
  const { data: st } = await db.from("students").select("email").eq("id", studentId).maybeSingle();
  const email = String(st?.email || "").toLowerCase();
  const { data: rows } = await db.from("registrations").select("notes,approved_student_id,email").or(`approved_student_id.eq.${studentId}${email ? `,email.eq.${email}` : ""}`).order("created_at", { ascending: false }).limit(5);
  for (const r of rows || []) {
    const n = String(r.notes || "");
    if (n.startsWith("Booked for later")) return "later";
    if (n.startsWith("Quick-start")) return "quick";
  }
  return null;
}

export async function getAutoConfig(db: any, examId: string, studentId?: string): Promise<ResultSendConfig | null> {
  if (studentId) {
    const src = await studentSource(db, studentId).catch(() => null);
    if (src) {
      const bySource = await getSetting<Record<string, any>>(db, "result_auto_source", {});
      const c = sourceResultCfg(bySource, src) as ResultSendConfig & { mode?: string };
      if (c?.mode === "manual") return null;
      if (c?.enabled) return c;
    }
  }
  const all = await getSetting<Record<string, ResultSendConfig>>(db, CFG, {});
  const global = await getSetting<ResultSendConfig | null>(db, 'result_auto_global', null);
  if (global?.enabled) return global;
  const c = all?.[examId];
  return c && c.enabled ? c : null;
}

async function loadReport(db: any, studentId: string, examId: string) {
  const [{ data: st }, { data: ex }] = await Promise.all([
    db.from("students").select("*").eq("id", studentId).maybeSingle(),
    db.from("exams").select("*").eq("id", examId).maybeSingle(),
  ]);
  if (!st || !ex) throw new Error("Student or test not found");
  const exam = dbToExam(ex);
  const qIds = exam.questionIds || [];
  const [subs, ms, ws, fs, qs, mq, wq, fq] = await Promise.all([
    qIds.length ? db.from("submissions").select("*").eq("student_id", studentId).in("question_id", qIds) : { data: [] },
    db.from("mcq_submissions").select("*").eq("student_id", studentId).eq("exam_id", examId),
    db.from("writing_submissions").select("*").eq("student_id", studentId).eq("exam_id", examId),
    db.from("fib_submissions").select("*").eq("student_id", studentId).eq("exam_id", examId),
    qIds.length ? db.from("questions").select("*").in("id", qIds) : { data: [] },
    (exam.mcqIds || []).length ? db.from("mcq_questions").select("*").in("id", exam.mcqIds) : { data: [] },
    (exam.writingIds || []).length ? db.from("writing_questions").select("*").in("id", exam.writingIds) : { data: [] },
    (exam.fibIds || []).length ? db.from("fib_questions").select("*").in("id", exam.fibIds) : { data: [] },
  ]);
  const codingSubs = (subs.data || []).map((r) => ({
    questionId: r.question_id, language: r.language, code: r.code, passedPublic: r.passed_public, totalPublic: r.total_public,
    passedPrivate: r.passed_private, totalPrivate: r.total_private, submittedAt: r.submitted_at,
    publicResults: r.public_results || [], privateResults: r.private_results || [], marks: r.marks ?? 0, maxMarks: r.max_marks ?? 10,
  }));
  const student = dbToStudent(st, codingSubs);
  return correctedReport({
    student, exam, codingSubs,
    questions: (qs.data || []).map(dbToQuestion),
    mcqs: (mq.data || []).map((r) => ({ id: r.id, question: r.question, options: r.options || [], correctIndex: r.correct_index, category: r.category, difficulty: r.difficulty, marks: r.marks, explanation: r.explanation || "" })),
    writings: (wq.data || []).map((r) => ({ id: r.id, title: r.title, prompt: r.prompt, minWords: r.min_words, maxWords: r.max_words, marks: r.marks })),
    fibs: (fq.data || []).map((r) => ({ id: r.id, sentence: r.sentence, answers: r.answers || [], caseSensitive: r.case_sensitive, marks: r.marks, difficulty: r.difficulty, explanation: r.explanation || "" })),
    mcqSubs: (ms.data || []).map((r) => ({ studentId: r.student_id, examId: r.exam_id, mcqId: r.mcq_id, selectedIndex: r.selected_index, isCorrect: r.is_correct, marksAwarded: r.marks_awarded })),
    writingSubs: (ws.data || []).map((r) => ({ studentId: r.student_id, examId: r.exam_id, writingId: r.writing_id, answerText: r.answer_text, wordCount: r.word_count, marksAwarded: r.marks_awarded, maxMarks: r.max_marks })),
    fibSubs: (fs.data || []).map((r) => ({ studentId: r.student_id, examId: r.exam_id, fibId: r.fib_id, answers: r.answers || [], isCorrect: r.is_correct, marksAwarded: r.marks_awarded, maxMarks: r.max_marks })),
  }, await getSetting(db, 'report_corrections', {}));
}

export async function sendOneResult(db: any, item: Omit<QueueItem, "id" | "dueAt">) {
  const report = await loadReport(db, item.studentId, item.examId);
  const input = { ...report, layout: validReportLayout(await getSetting(db, REPORT_LAYOUT_KEY, 'classic')), includeQA: item.cfg.includeQA !== false, passPct: item.cfg.passPct ?? 40 };
  const tpl = { ...DEFAULT_RESULT_TEMPLATE, ...((await getSetting<any>(db, "result_template", null)) || {}) };
  const attachments = item.cfg.attachPdf ? [{ name: reportFileName(input).slice(0, 110), type: "application/pdf", data: await reportPdfBase64(input) }] : [];
  return sendResultMails({
    db, target: item.cfg.target === "login" ? "login" : "personal",
    subject: item.subject || tpl.subject, body: item.body || tpl.body,
    items: [{ studentId: item.studentId, vars: resultVars(input), attachments }],
  });
}

export async function enqueueResults(db: any, items: Omit<QueueItem, "id">[]) {
  const q = await getSetting<QueueItem[]>(db, QUEUE, []);
  const key = (i: { studentId: string; examId: string }) => `${i.studentId}|${i.examId}`;
  const incoming = new Set(items.map(key));
  const kept = (Array.isArray(q) ? q : []).filter((i) => !incoming.has(key(i)));
  const added = items.map((i) => ({ ...i, id: crypto.randomUUID() }));
  await putSetting(db, QUEUE, [...kept, ...added].slice(-500));
  return added.length;
}

/** Sends every queued result that is due. Safe to call often. */
export async function processResultQueue(db: any, limit = 10) {
  const q = await getSetting<QueueItem[]>(db, QUEUE, []);
  if (!Array.isArray(q) || !q.length) return { sent: 0, pending: 0 };
  const now = Date.now();
  const due = q.filter((i) => i.dueAt <= now).slice(0, limit);
  if (!due.length) return { sent: 0, pending: q.length };
  const dueIds = new Set(due.map((i) => i.id));
  // remove first so overlapping runs don't double-send
  await putSetting(db, QUEUE, q.filter((i) => !dueIds.has(i.id)));
  let sent = 0; const failed: any[] = [];
  for (const it of due) {
    try { const r = await sendOneResult(db, it); sent += r.sent; failed.push(...(r.failed || [])); }
    catch (e: any) { failed.push({ studentId: it.studentId, error: String(e?.message || e) }); }
  }
  return { sent, failed, pending: q.length - due.length };
}

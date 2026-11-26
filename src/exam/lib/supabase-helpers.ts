// @ts-nocheck
import { readPasswords, writePassword } from './credentialStore';
import { supabase } from '@/lib/db-client';
import { Question, Student, Exam, Submission, TestCase } from '@/exam/types';

// ─── Question helpers ───

interface DbQuestion {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  default_public_count: number;
  default_private_count: number;
  languages: string[];
  time_limit: number;
  max_marks: number | null;
  sort_order: number | null;
  public_test_cases: TestCase[];
  private_test_cases: TestCase[];
  created_at: string;
}

export function dbToQuestion(row: DbQuestion): Question {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty as Question['difficulty'],
    defaultPublicCount: row.default_public_count,
    defaultPrivateCount: row.default_private_count,
    languages: row.languages,
    timeLimit: row.time_limit,
    maxMarks: row.max_marks ?? 10,
    sampleCount: (row as any).sample_count ?? 3,
    order: row.sort_order ?? 0,
    publicTestCases: (row.public_test_cases as any) || [],
    privateTestCases: (row.private_test_cases as any) || [],
    createdAt: row.created_at,
  };
}

export async function fetchQuestions(): Promise<Question[]> {
  const { data, error } = await supabase.from('questions').select('*').order('sort_order');
  if (error) { console.warn("[supabase-helpers]", error.message); return []; }
  return (data || []).map(r => dbToQuestion(r as any));
}

export async function upsertQuestion(q: Question) {
  const { error } = await supabase.from('questions').upsert({
    id: q.id,
    title: q.title,
    description: q.description,
    difficulty: q.difficulty,
    default_public_count: q.defaultPublicCount,
    default_private_count: q.defaultPrivateCount,
    languages: q.languages,
    time_limit: q.timeLimit,
    max_marks: q.maxMarks ?? 10,
    sample_count: q.sampleCount ?? 3,
    sort_order: q.order ?? 0,
    public_test_cases: q.publicTestCases as any,
    private_test_cases: q.privateTestCases as any,
    created_at: q.createdAt,
  });
  if (error) { console.warn("[supabase-helpers]", error.message); return; }
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) { console.warn("[supabase-helpers]", error.message); return; }
}

// ─── Student helpers ───

interface DbStudent {
  id: string;
  name: string;
  email: string;
  password: string;
  is_blocked: boolean;
  tab_switch_count: number;
  max_tab_switches: number;
  exam_status: string;
  assigned_questions: string[];
  retake_exam_ids?: string[] | null;
}

export function dbToStudent(row: DbStudent, submissions: Submission[] = []): Student {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    isBlocked: row.is_blocked ?? false,
    tabSwitchCount: row.tab_switch_count ?? 0,
    maxTabSwitches: row.max_tab_switches ?? 3,
    examStatus: (row.exam_status || 'not_started') as Student['examStatus'],
    assignedQuestions: Array.isArray(row.assigned_questions) ? row.assigned_questions : [],
    retakeExamIds: Array.isArray(row.retake_exam_ids) ? row.retake_exam_ids : [],
    submissions: Array.isArray(submissions) ? submissions : [],
  };
}

export async function fetchStudents(): Promise<Student[]> {
  const { data: studentRows, error: sErr } = await supabase.from('students').select('*');
  if (sErr) { console.warn("[supabase-helpers]", sErr.message); return []; }
  const { data: subRows, error: subErr } = await supabase.from('submissions').select('*').order('submitted_at', { ascending: false });
  if (subErr) { console.warn("[supabase-helpers]", subErr.message); }

  const subsByStudent: Record<string, Submission[]> = {};
  for (const row of subRows || []) {
    const sub: Submission = {
      questionId: row.question_id,
      language: row.language,
      code: row.code,
      passedPublic: row.passed_public,
      totalPublic: row.total_public,
      passedPrivate: row.passed_private,
      totalPrivate: row.total_private,
      submittedAt: row.submitted_at,
      publicResults: (row.public_results as any) || [],
      privateResults: (row.private_results as any) || [],
      marks: row.marks ?? 0,
      maxMarks: row.max_marks ?? 10,
    };
    if (!subsByStudent[row.student_id]) subsByStudent[row.student_id] = [];
    subsByStudent[row.student_id].push(sub);
  }

  // Passwords live in a staff-only table: admins get them, students' browsers get nothing.
  const passwords = await readPasswords(supabase);
  return (studentRows || []).map(row => dbToStudent({ ...(row as any), password: passwords[row.id] || '' }, subsByStudent[row.id] || []));
}

/** Saves an exam password. Staff can change any; a brand-new student can only set their first one. */
export async function saveStudentPassword(studentId: string, password: string) {
  const err = await writePassword(supabase, studentId, password);
  if (err) console.warn('[supabase-helpers]', err);
}

export async function upsertStudent(s: Student) {
  const { error } = await supabase.from('students').upsert({
    id: s.id,
    name: s.name,
    email: s.email,
    is_blocked: s.isBlocked,
    tab_switch_count: s.tabSwitchCount,
    max_tab_switches: s.maxTabSwitches,
    exam_status: s.examStatus,
    assigned_questions: s.assignedQuestions,
    retake_exam_ids: s.retakeExamIds || [],
  } as any);
  if (error) { console.warn("[supabase-helpers]", error.message); return; }
  await saveStudentPassword(s.id, s.password);
}

export async function fetchExamCompletedStudentIds(examId: string, questionIds: string[] = []): Promise<Set<string>> {
  const completed = new Set<string>();
  const { data: mcqSubs } = await supabase.from('mcq_submissions' as any).select('student_id').eq('exam_id', examId);
  for (const r of (mcqSubs as any[]) || []) completed.add(r.student_id);
  if (questionIds.length > 0) {
    const { data: subs } = await supabase.from('submissions').select('student_id, question_id').in('question_id', questionIds);
    for (const r of (subs as any[]) || []) completed.add(r.student_id);
  }
  return completed;
}

export async function deleteStudentDb(id: string) {
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) { console.warn("[supabase-helpers]", error.message); return; }
}

export async function upsertSubmission(studentId: string, sub: Submission) {
  // Delete existing submission for this student+question, then insert
  await supabase.from('submissions').delete()
    .eq('student_id', studentId)
    .eq('question_id', sub.questionId);

  const { error } = await supabase.from('submissions').insert({
    student_id: studentId,
    question_id: sub.questionId,
    language: sub.language,
    code: sub.code,
    passed_public: sub.passedPublic,
    total_public: sub.totalPublic,
    passed_private: sub.passedPrivate,
    total_private: sub.totalPrivate,
    submitted_at: sub.submittedAt,
    public_results: sub.publicResults as any,
    private_results: sub.privateResults as any,
    marks: sub.marks ?? 0,
    max_marks: sub.maxMarks ?? 10,
  });
  if (error) { console.warn("[supabase-helpers]", error.message); return; }
}

// ─── Exam helpers ───

interface DbExam {
  id: string;
  title: string;
  description: string;
  question_ids: string[];
  mcq_ids: string[] | null;
  assigned_student_ids: string[];
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  is_timed: boolean;
  start_buffer_minutes: number;
  exam_duration_minutes: number;
  created_at: string;
}

export function dbToExam(row: DbExam): Exam {
  const r = row as any;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    questionIds: Array.isArray(row.question_ids) ? row.question_ids : [],
    mcqIds: Array.isArray(row.mcq_ids) ? row.mcq_ids : [],
    writingIds: Array.isArray(r.writing_ids) ? r.writing_ids : [],
    fibIds: Array.isArray(r.fib_ids) ? r.fib_ids : [],
    sectionNames: r.section_names || { coding: 'Coding', mcq: 'Multiple Choice', writing: 'Writing', fib: 'Fill in the Blanks' },
    assignedStudentIds: Array.isArray(row.assigned_student_ids) ? row.assigned_student_ids : [],
    status: (row.status || 'draft') as Exam['status'],
    scheduledAt: row.scheduled_at ?? undefined,
    startedAt: row.started_at ?? undefined,
    endedAt: row.ended_at ?? undefined,
    isTimed: row.is_timed,
    startBufferMinutes: row.start_buffer_minutes,
    examDurationMinutes: row.exam_duration_minutes,
    allowCopyPaste: r.allow_copy_paste ?? true,
    createdAt: row.created_at,
  };
}

export async function fetchExams(): Promise<Exam[]> {
  const { data, error } = await supabase.from('exams').select('*');
  if (error) { console.warn("[supabase-helpers]", error.message); return []; }
  return (data || []).map(r => dbToExam(r as any));
}

export async function upsertExam(e: Exam) {
  const { error } = await supabase.from('exams').upsert({
    id: e.id,
    title: e.title,
    description: e.description,
    question_ids: e.questionIds,
    mcq_ids: e.mcqIds || [],
    writing_ids: e.writingIds || [],
    fib_ids: e.fibIds || [],
    section_names: e.sectionNames || { coding: 'Coding', mcq: 'Multiple Choice', writing: 'Writing', fib: 'Fill in the Blanks' },
    assigned_student_ids: e.assignedStudentIds,
    status: e.status,
    scheduled_at: e.scheduledAt || null,
    started_at: e.startedAt || null,
    ended_at: e.endedAt || null,
    is_timed: e.isTimed,
    start_buffer_minutes: e.startBufferMinutes,
    exam_duration_minutes: e.examDurationMinutes,
    allow_copy_paste: e.allowCopyPaste,
    created_at: e.createdAt,
  } as any);
  if (error) throw error;
}

export async function deleteExamDb(id: string) {
  const { error } = await supabase.from('exams').delete().eq('id', id);
  if (error) { console.warn("[supabase-helpers]", error.message); return; }
}

// ─── MCQ helpers ───

export async function fetchMCQs(): Promise<import('@/exam/types').MCQQuestion[]> {
  const { data, error } = await supabase.from('mcq_questions' as any).select('*').order('created_at');
  if (error) { console.warn("[supabase-helpers]", error.message); return []; }
  return (data || []).map((r: any) => ({
    id: r.id,
    question: r.question,
    options: r.options || [],
    correctIndex: r.correct_index,
    category: r.category,
    difficulty: r.difficulty,
    marks: r.marks,
    explanation: r.explanation || '',
    createdAt: r.created_at,
  }));
}

export async function upsertMCQ(m: import('@/exam/types').MCQQuestion) {
  const { error } = await supabase.from('mcq_questions' as any).upsert({
    id: m.id,
    question: m.question,
    options: m.options as any,
    correct_index: m.correctIndex,
    category: m.category,
    difficulty: m.difficulty,
    marks: m.marks,
    explanation: m.explanation,
  });
  if (error) { console.warn("[supabase-helpers]", error.message); return; }
}

export async function deleteMCQ(id: string) {
  const { error } = await supabase.from('mcq_questions' as any).delete().eq('id', id);
  if (error) { console.warn("[supabase-helpers]", error.message); return; }
}

const LS_MCQ_SUBS = 'codexam_mcq_submissions_local';
const readLocalMCQSubs = (): import('@/exam/types').MCQSubmission[] => {
  try { return JSON.parse(localStorage.getItem(LS_MCQ_SUBS) || '[]'); } catch { return []; }
};
const writeLocalMCQSubs = (arr: import('@/exam/types').MCQSubmission[]) => {
  try { localStorage.setItem(LS_MCQ_SUBS, JSON.stringify(arr)); } catch {}
};

export async function upsertMCQSubmission(s: import('@/exam/types').MCQSubmission) {
  // Always mirror to localStorage so admin views work even without backend tables.
  const local = readLocalMCQSubs().filter(x =>
    !(x.studentId === s.studentId && x.examId === s.examId && x.mcqId === s.mcqId));
  local.push(s);
  writeLocalMCQSubs(local);
  try {
    await supabase.from('mcq_submissions' as any).delete()
      .eq('student_id', s.studentId)
      .eq('exam_id', s.examId)
      .eq('mcq_id', s.mcqId);
    const { error } = await supabase.from('mcq_submissions' as any).insert({
      student_id: s.studentId,
      exam_id: s.examId,
      mcq_id: s.mcqId,
      selected_index: s.selectedIndex,
      is_correct: s.isCorrect,
      marks_awarded: s.marksAwarded,
      submitted_at: s.submittedAt,
    });
    if (error) throw error;
  } catch (error) { throw error; }
}

export async function fetchMCQSubmissions(): Promise<import('@/exam/types').MCQSubmission[]> {
  const local = readLocalMCQSubs();
  try {
    const { data, error } = await supabase.from('mcq_submissions' as any).select('*');
    if (error) { console.warn("[supabase-helpers]", error.message); return local; }
    const remote = (data || []).map((r: any) => ({
      id: r.id, studentId: r.student_id, examId: r.exam_id, mcqId: r.mcq_id,
      selectedIndex: r.selected_index, isCorrect: r.is_correct,
      marksAwarded: r.marks_awarded, submittedAt: r.submitted_at,
    }));
    // merge unique by (studentId+examId+mcqId)
    const seen = new Set<string>();
    const merged = [...remote, ...local].filter(s => {
      const k = `${s.studentId}|${s.examId}|${s.mcqId}`;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
    return merged;
  } catch {
    return local;
  }
}

// ─── Feedback & re-evaluation ───
export async function submitFeedback(studentId: string, examId: string, rating: number, comments: string) {
  const { error } = await supabase.from('exam_feedback' as any).insert({
    student_id: studentId, exam_id: examId, rating, comments,
  });
  if (error) { console.warn("[supabase-helpers]", error.message); return; }
}
export async function fetchFeedback(): Promise<any[]> {
  const { data, error } = await supabase.from('exam_feedback' as any).select('*').order('created_at', { ascending: false });
  if (error) { console.warn("[supabase-helpers]", error.message); return []; }
  return data || [];
}
export async function submitReevaluation(req: {
  studentId: string; studentName: string; examId: string; questionId: string; questionType: string; reason: string;
}) {
  const { data: saved, error } = await supabase.from('reevaluation_requests' as any).insert({
    student_id: req.studentId, student_name: req.studentName, exam_id: req.examId,
    question_id: req.questionId, question_type: req.questionType, reason: req.reason,
  }).select('id').single();
  if (error) { console.warn("[supabase-helpers]", error.message); return; }
  if (saved) {
    const { notifyAdmin } = await import('@/lib/notifyAdmin');
    notifyAdmin('reevaluation', { eventId: String(saved.id) });
  }
}
export async function fetchReevaluations(): Promise<any[]> {
  const { data, error } = await supabase.from('reevaluation_requests' as any).select('*').order('created_at', { ascending: false });
  if (error) { console.warn("[supabase-helpers]", error.message); return []; }
  return data || [];
}
export async function updateReevaluation(id: string, status: string, adminResponse: string) {
  const { error } = await supabase.from('reevaluation_requests' as any).update({
    status, admin_response: adminResponse, resolved_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) { console.warn("[supabase-helpers]", error.message); return; }
}
export async function fetchMyReevaluations(studentId: string): Promise<any[]> {
  const { data, error } = await supabase.from('reevaluation_requests' as any).select('*').eq('student_id', studentId).order('created_at', { ascending: false });
  if (error) { console.warn("[supabase-helpers]", error.message); return []; }
  return data || [];
}
export async function deleteFeedback(id: string) {
  const { error } = await supabase.from('exam_feedback' as any).delete().eq('id', id);
  if (error) { console.warn("[supabase-helpers]", error.message); return; }
}

// ─── Admin Notifications ───
export interface AdminNotification {
  id: string;
  message: string;
  target: 'all' | 'specific';
  target_student_ids: string[];
  duration_seconds: number | null;
  expires_at: string | null;
  created_at: string;
}
const LS_NOTIFS = 'codexam_admin_notifications_local';
const readLocalNotifs = (): AdminNotification[] => {
  try { return JSON.parse(localStorage.getItem(LS_NOTIFS) || '[]'); } catch { return []; }
};
const writeLocalNotifs = (arr: AdminNotification[]) => {
  try { localStorage.setItem(LS_NOTIFS, JSON.stringify(arr)); } catch {}
};

export async function createNotification(n: {
  message: string; target: 'all' | 'specific'; targetStudentIds: string[]; durationSeconds: number | null;
}) {
  const expires = n.durationSeconds ? new Date(Date.now() + n.durationSeconds * 1000).toISOString() : null;
  const local: AdminNotification = {
    id: 'ln_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    message: n.message, target: n.target, target_student_ids: n.targetStudentIds,
    duration_seconds: n.durationSeconds, expires_at: expires,
    created_at: new Date().toISOString(),
  };
  writeLocalNotifs([local, ...readLocalNotifs()]);
  try {
    await supabase.from('admin_notifications' as any).insert({
      message: n.message, target: n.target, target_student_ids: n.targetStudentIds,
      duration_seconds: n.durationSeconds, expires_at: expires,
    });
  } catch { /* offline ok — local copy already saved */ }
}
export async function fetchNotifications(): Promise<AdminNotification[]> {
  const local = readLocalNotifs();
  try {
    const { data, error } = await supabase.from('admin_notifications' as any).select('*').order('created_at', { ascending: false });
    if (error) { console.warn("[supabase-helpers]", error.message); return local; }
    const remote = ((data as any) || []).map((n: any) => ({
      ...n,
      target_student_ids: Array.isArray(n.target_student_ids) ? n.target_student_ids : [],
    }));
    const seen = new Set<string>();
    const merged = [...remote, ...local].filter(n => {
      if (seen.has(n.id)) return false; seen.add(n.id); return true;
    });
    return merged.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  } catch {
    return local;
  }
}
export async function deleteNotification(id: string) {
  writeLocalNotifs(readLocalNotifs().filter(n => n.id !== id));
  try { await supabase.from('admin_notifications' as any).delete().eq('id', id); } catch {}
}
export async function fetchNotificationsForStudent(studentId: string): Promise<AdminNotification[]> {
  const all = await fetchNotifications();
  const now = Date.now();
  return all.filter((n: AdminNotification) => {
    if (n.expires_at && new Date(n.expires_at).getTime() < now) return false;
    if (n.target === 'all') return true;
    return (n.target_student_ids || []).includes(studentId);
  });
}

// ─── Writing helpers ───
import { WritingQuestion, WritingSubmission, FIBQuestion, FIBSubmission } from '@/exam/types';

export async function fetchWritingQuestions(): Promise<WritingQuestion[]> {
  const { data, error } = await supabase.from('writing_questions' as any).select('*').order('created_at');
  if (error) { console.warn("[supabase-helpers]", error.message); return []; }
  return (data || []).map((r: any) => ({
    id: r.id, title: r.title, prompt: r.prompt,
    minWords: r.min_words, maxWords: r.max_words, marks: r.marks, createdAt: r.created_at,
  }));
}
export async function upsertWritingQuestion(w: WritingQuestion) {
  const { error } = await supabase.from('writing_questions' as any).upsert({
    id: w.id, title: w.title, prompt: w.prompt,
    min_words: w.minWords, max_words: w.maxWords, marks: w.marks,
  });
  if (error) { console.warn("[supabase-helpers]", error.message); return; }
}
export async function deleteWritingQuestion(id: string) {
  const { error } = await supabase.from('writing_questions' as any).delete().eq('id', id);
  if (error) { console.warn("[supabase-helpers]", error.message); return; }
}
export async function upsertWritingSubmission(s: WritingSubmission) {
  await supabase.from('writing_submissions' as any).delete()
    .eq('student_id', s.studentId).eq('exam_id', s.examId).eq('writing_id', s.writingId);
  const { error } = await supabase.from('writing_submissions' as any).insert({
    student_id: s.studentId, exam_id: s.examId, writing_id: s.writingId,
    answer_text: s.answerText, word_count: s.wordCount,
    marks_awarded: s.marksAwarded, max_marks: s.maxMarks, submitted_at: s.submittedAt,
  });
  if (error) throw error;
}
export async function fetchWritingSubmissions(): Promise<WritingSubmission[]> {
  const { data, error } = await supabase.from('writing_submissions' as any).select('*');
  if (error) { console.warn("[supabase-helpers]", error.message); return []; }
  return (data || []).map((r: any) => ({
    id: r.id, studentId: r.student_id, examId: r.exam_id, writingId: r.writing_id,
    answerText: r.answer_text, wordCount: r.word_count,
    marksAwarded: r.marks_awarded, maxMarks: r.max_marks, submittedAt: r.submitted_at,
  }));
}

// ─── FIB helpers ───
export async function fetchFIBQuestions(): Promise<FIBQuestion[]> {
  const { data, error } = await supabase.from('fib_questions' as any).select('*').order('created_at');
  if (error) { console.warn("[supabase-helpers]", error.message); return []; }
  return (data || []).map((r: any) => ({
    id: r.id, sentence: r.sentence, answers: r.answers || [],
    caseSensitive: r.case_sensitive, marks: r.marks,
    difficulty: r.difficulty, explanation: r.explanation || '', createdAt: r.created_at,
  }));
}
export async function upsertFIBQuestion(f: FIBQuestion) {
  const { error } = await supabase.from('fib_questions' as any).upsert({
    id: f.id, sentence: f.sentence, answers: f.answers as any,
    case_sensitive: f.caseSensitive, marks: f.marks,
    difficulty: f.difficulty, explanation: f.explanation,
  });
  if (error) { console.warn("[supabase-helpers]", error.message); return; }
}
export async function deleteFIBQuestion(id: string) {
  const { error } = await supabase.from('fib_questions' as any).delete().eq('id', id);
  if (error) { console.warn("[supabase-helpers]", error.message); return; }
}
export async function upsertFIBSubmission(s: FIBSubmission) {
  await supabase.from('fib_submissions' as any).delete()
    .eq('student_id', s.studentId).eq('exam_id', s.examId).eq('fib_id', s.fibId);
  const { error } = await supabase.from('fib_submissions' as any).insert({
    student_id: s.studentId, exam_id: s.examId, fib_id: s.fibId,
    answers: s.answers as any, is_correct: s.isCorrect,
    marks_awarded: s.marksAwarded, max_marks: s.maxMarks, submitted_at: s.submittedAt,
  });
  if (error) throw error;
}
export async function fetchFIBSubmissions(): Promise<FIBSubmission[]> {
  const { data, error } = await supabase.from('fib_submissions' as any).select('*');
  if (error) { console.warn("[supabase-helpers]", error.message); return []; }
  return (data || []).map((r: any) => ({
    id: r.id, studentId: r.student_id, examId: r.exam_id, fibId: r.fib_id,
    answers: r.answers || [], isCorrect: r.is_correct,
    marksAwarded: r.marks_awarded, maxMarks: r.max_marks, submittedAt: r.submitted_at,
  }));
}


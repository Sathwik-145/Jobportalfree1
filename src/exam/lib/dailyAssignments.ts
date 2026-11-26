export type DailyExam = { id: string; status: string; questionIds?: string[]; createdAt?: string };

/** Keep exact day plans, replacing submitted tests without repeating a test within the day. */
export function unsubmittedDailyExamIds(planned: string[], exams: DailyExam[], completed: Iterable<string>) {
  const done = new Set(completed);
  const available = exams.filter(e => e.status !== 'draft');
  const selected: string[] = [];
  const reserved = new Set(planned.filter(id => !done.has(id)));
  for (const id of [...new Set(planned)]) {
    const original = available.find(e => e.id === id);
    if (!original) continue;
    const replacement = done.has(id)
      ? available.find(e => !done.has(e.id) && !selected.includes(e.id) && !reserved.has(e.id))?.id
      : id;
    if (replacement && !selected.includes(replacement)) selected.push(replacement);
  }
  return selected;
}

/** Saved exam completions plus historical submissions; no browser-only completion cache. */
export async function readCompletedExams(db: any, exams: DailyExam[], studentIds: string[]) {
  const completed: Record<string, Set<string>> = Object.fromEntries(studentIds.map(id => [id, new Set<string>()]));
  if (!studentIds.length) return completed;
  const responses = await Promise.all([
    ...['mcq_submissions', 'writing_submissions', 'fib_submissions'].map(table =>
      db.from(table).select('student_id,exam_id').in('student_id', studentIds)),
    db.from('submissions').select('student_id,question_id,submitted_at').in('student_id', studentIds),
    db.from('codexam_settings').select('key,value').like('key', 'exam_completed:%'),
  ]);
  for (const response of responses) if (response.error) throw new Error(`Could not check submitted tests: ${response.error.message}`);
  for (const response of responses.slice(0, 3)) {
    for (const row of response.data || []) if (row.exam_id) completed[row.student_id]?.add(row.exam_id);
  }
  for (const row of responses[4].data || []) {
    const value = row.value;
    if (value?.studentId && value?.examId) completed[value.studentId]?.add(value.examId);
  }
  // Legacy coding-only submissions have no exam ID. Require every coding question and
  // a timestamp after the exam was created, rather than matching any reused question.
  for (const sid of studentIds) {
    const rows = (responses[3].data || []).filter((r: any) => r.student_id === sid);
    for (const exam of exams) {
      if (exam.questionIds?.length && exam.questionIds.every(qid => rows.some((r: any) =>
        r.question_id === qid && (!exam.createdAt || Date.parse(r.submitted_at) >= Date.parse(exam.createdAt))))) {
        completed[sid].add(exam.id);
      }
    }
  }
  return completed;
}
/**
 * Works out which student|exam pairs already have any submission, so reminders skip them.
 * MCQ / writing / fill-in-blank rows carry exam_id; coding rows only carry question_id,
 * so a coding submission counts as done for every exam that includes that question.
 */
export function computeDoneSet(input: {
  examRows: { student_id: string; exam_id: string | null }[];
  codingRows: { student_id: string; question_id: string }[];
  exams: { id: string; question_ids?: unknown }[];
}): Set<string> {
  const done = new Set<string>();
  for (const r of input.examRows) if (r?.student_id && r?.exam_id) done.add(`${r.student_id}|${r.exam_id}`);
  const examsByQuestion = new Map<string, string[]>();
  for (const e of input.exams) {
    const qs = Array.isArray(e.question_ids) ? (e.question_ids as string[]) : [];
    for (const q of qs) examsByQuestion.set(q, [...(examsByQuestion.get(q) || []), e.id]);
  }
  for (const r of input.codingRows) {
    for (const exId of examsByQuestion.get(r.question_id) || []) done.add(`${r.student_id}|${exId}`);
  }
  return done;
}

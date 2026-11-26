export type Correction = { marks: number; isCorrect: boolean };
export type Corrections = Record<string, Correction>;
export const correctionKey = (studentId: string, examId: string, kind: string, questionId: string) => `${studentId}|${examId}|${kind}|${questionId}`;
export function validateCorrection(marks: number, max: number) {
  if (!Number.isFinite(marks) || marks < 0 || marks > max) throw new Error(`Marks must be between 0 and ${max}`);
  return marks;
}
export function correctedReport<T extends { student: { id: string }; exam?: { id?: string } | null; codingSubs?: any[]; mcqSubs?: any[]; writingSubs?: any[]; fibSubs?: any[] }>(report: T, corrections: Corrections): T {
  const apply = (items: any[] | undefined, kind: string, id: string, marks: string) => (items || []).map(item => {
    const c = corrections[correctionKey(report.student.id, report.exam?.id || '', kind, item[id])];
    return c ? { ...item, [marks]: c.marks, isCorrect: c.isCorrect } : item;
  });
  return { ...report, codingSubs: apply(report.codingSubs, 'coding', 'questionId', 'marks'), mcqSubs: apply(report.mcqSubs, 'mcq', 'mcqId', 'marksAwarded'), writingSubs: apply(report.writingSubs, 'writing', 'writingId', 'marksAwarded'), fibSubs: apply(report.fibSubs, 'fib', 'fibId', 'marksAwarded') };
}
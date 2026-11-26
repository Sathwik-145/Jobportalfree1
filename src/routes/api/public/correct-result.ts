import { createFileRoute } from '@tanstack/react-router';
import { mailAdminDb } from '@/lib/mail-auth.server';
import { getSetting, putSetting } from '@/lib/credential-mailer.server';
import { correctionKey, validateCorrection, type Corrections } from '@/exam/lib/reportCorrections';
import { z } from 'zod';

const schema = z.object({ studentId: z.string().min(1).max(80), examId: z.string().min(1).max(80), kind: z.enum(['coding', 'mcq', 'writing', 'fib']), questionId: z.string().min(1).max(80), marks: z.number().nonnegative(), isCorrect: z.boolean() });
export const Route = createFileRoute('/api/public/correct-result')({ server: { handlers: { POST: async ({ request }) => {
  const db = await mailAdminDb(request);
  if (!db) return Response.json({ error: 'Admin sign-in required' }, { status: 403 });
  try {
    const data = schema.parse(await request.json());
    const tables = { coding: ['submissions', 'question_id', 'max_marks'], mcq: ['mcq_submissions', 'mcq_id', ''], writing: ['writing_submissions', 'writing_id', 'max_marks'], fib: ['fib_submissions', 'fib_id', 'max_marks'] };
    const [table, idColumn, maxColumn] = tables[data.kind];
    let query = db.from(table as any).select('*').eq('student_id', data.studentId).eq(idColumn, data.questionId);
    if (data.kind !== 'coding') query = query.eq('exam_id', data.examId);
    const { data: row, error } = await query.limit(1).maybeSingle();
    if (error || !row) throw new Error('Submission not found');
    let max = Number((row as any)[maxColumn] ?? 10);
    if (data.kind === 'mcq') { const { data: question } = await db.from('mcq_questions' as any).select('marks').eq('id', data.questionId).maybeSingle(); max = Number((question as any)?.marks ?? 1); }
    validateCorrection(data.marks, max);
    const corrections = await getSetting<Corrections>(db, 'report_corrections', {});
    corrections[correctionKey(data.studentId, data.examId, data.kind, data.questionId)] = { marks: data.marks, isCorrect: data.isCorrect };
    await putSetting(db, 'report_corrections', corrections);
    return Response.json({ corrections });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Could not save correction' }, { status: 400 }); }
} } } });
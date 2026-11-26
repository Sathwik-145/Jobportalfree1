import { createFileRoute } from '@tanstack/react-router';
import { generateText } from 'ai';
import { z } from 'zod';
import { mailAdminDb } from '@/lib/mail-auth.server';
import { getSetting, putSetting } from '@/lib/credential-mailer.server';
import { correctionKey, type Corrections } from '@/exam/lib/reportCorrections';
import { pickModels } from '@/lib/admin-assistant.server';
import { fastAiOptions } from '@/lib/ai-speed';

const schema = z.object({ studentId: z.string().min(1).max(80), examId: z.string().min(1).max(80) });

/** Admin-triggered AI double-check of fill-in-the-blank answers marked wrong.
 *  Accepts clear equivalents (synonyms, minor spelling) and records them as
 *  report corrections, preserving the original submissions. */
export const Route = createFileRoute('/api/public/recheck-fib')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const db = await mailAdminDb(request);
        if (!db) return Response.json({ error: 'Admin sign-in required' }, { status: 403 });
        try {
          const { studentId, examId } = schema.parse(await request.json());
          const models = pickModels();
          if (!models.length) return Response.json({ error: 'AI is not configured yet. Add GEMINI_API_KEY to the server settings.' }, { status: 503 });
          const { data: subs } = await db.from('fib_submissions' as any).select('*').eq('student_id', studentId).eq('exam_id', examId).limit(50);
          const wrong = (subs || []).filter((s: any) => s.is_correct !== true).slice(0, 20);
          const corrections = await getSetting<Corrections>(db, 'report_corrections', {});
          if (!wrong.length) return Response.json({ rechecked: 0, flipped: 0, corrections });
          let flipped = 0;
          const ids = [...new Set(wrong.map((s: any) => s.fib_id))];
          const { data: qs } = await db.from('fib_questions' as any).select('id,sentence,answers,marks').in('id', ids);
          const qById = new Map((qs || []).map((q: any) => [q.id, q]));
          // Check every answer at the same time so the recheck finishes in a couple of seconds.
          await Promise.all(wrong.map(async (sub: any) => {
            const q: any = qById.get(sub.fib_id);
            if (!q) return;
            const studentAnswers = (Array.isArray(sub.answers) ? sub.answers : []).map((a: any) => String(a).trim()).filter(Boolean);
            if (!studentAnswers.length) return;
            const max = Number(sub.max_marks ?? q.marks ?? 1);
            let accepted = false;
            for (const model of models) {
              try {
                const { text } = await generateText({
                  model, maxOutputTokens: 8, providerOptions: fastAiOptions('minimal'),
                  system: 'You check fill-in-the-blank exam answers. Reply with exactly YES or NO.',
                  prompt: `Sentence with a blank: ${q.sentence}\nAccepted answers: ${(q.answers || []).join(', ')}\nStudent answer: ${studentAnswers.join(', ')}\nIs the student answer an acceptable equivalent (same meaning, a synonym, or a minor spelling variation)? Answer YES or NO.`,
                });
                accepted = /^\s*yes\b/i.test(text);
                break;
              } catch { /* try the next model */ }
            }
            if (!accepted) return;
            corrections[correctionKey(studentId, examId, 'fib', sub.fib_id)] = { marks: max, isCorrect: true };
            flipped++;
          }));
          if (flipped) await putSetting(db, 'report_corrections', corrections);
          return Response.json({ rechecked: wrong.length, flipped, corrections });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : 'Recheck failed' }, { status: 400 });
        }
      },
    },
  },
});

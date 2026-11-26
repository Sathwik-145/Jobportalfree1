import { supabase } from '@/lib/db-client';
import type { DraftQuestion } from '@/lib/admin-assistant-schema';

export async function saveDraft(question: DraftQuestion, testId?: string, id = crypto.randomUUID()) {
  const { type, ...fields } = question;
  const table = { mcq: 'mcq_questions', coding: 'questions', writing: 'writing_questions', fib: 'fib_questions' }[type];
  const row = { ...fields, id, ...(question.type === 'coding' ? { default_public_count: question.public_test_cases.length, default_private_count: question.private_test_cases.length, sample_count: question.public_test_cases.length, sort_order: 0 } : {}) };
  const { error } = await (supabase.from(table as any) as any).upsert(row);
  if (error) throw error;
  if (testId) {
    const column = { mcq: 'mcq_ids', coding: 'question_ids', writing: 'writing_ids', fib: 'fib_ids' }[type];
    const { data, error: readError } = await supabase.from('exams').select('*').eq('id', testId).single();
    if (readError) throw readError;
    const ids = (data as any)[column] || [];
    const { error: updateError } = await supabase.from('exams').update({ [column]: [...new Set([...ids, id])] } as any).eq('id', testId);
    if (updateError) throw updateError;
  }
  window.dispatchEvent(new Event('assistant-bank-updated'));
  return id;
}
export async function generateQuestions(input: unknown) {
  const { data } = await supabase.auth.getSession();
  const response = await fetch('/api/admin-assistant', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error(await response.text());
  return (await response.json()).questions as DraftQuestion[];
}

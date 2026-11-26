// @ts-nocheck
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/lib/db-client';
import { generateQuestions, saveDraft } from './assistant-storage';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { toast } from 'sonner';

type Kind = 'mcq' | 'coding' | 'fib' | 'writing';
const LABEL: Record<Kind, string> = { mcq: 'MCQs', coding: 'Coding', fib: 'Fill in blanks', writing: 'Writing' };
const PRESETS: { label: string; counts: Record<Kind, number> }[] = [
  { label: 'MCQ only', counts: { mcq: 10, coding: 0, fib: 0, writing: 0 } },
  { label: 'Fill blanks only', counts: { mcq: 0, coding: 0, fib: 10, writing: 0 } },
  { label: 'Writing only', counts: { mcq: 0, coding: 0, fib: 0, writing: 2 } },
  { label: 'Coding only', counts: { mcq: 0, coding: 2, fib: 0, writing: 0 } },
  { label: 'Mixed', counts: { mcq: 5, coding: 1, fib: 3, writing: 1 } },
];
const norm = (t: string) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export default function GenerateQuestions({ type }: { type: Kind | 'test' }) {
  const { questions = [], mcqs = [], fibs = [], writings = [], exams = [] } = useAuth() as any;
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const [topic, setTopic] = useState(''), [difficulty, setDifficulty] = useState('easy'), [count, setCount] = useState(3), [testName, setTestName] = useState('');
  const [counts, setCounts] = useState<Record<Kind, number>>({ mcq: 5, coding: 0, fib: 0, writing: 0 });
  const field = 'w-full rounded-md border bg-background p-2 text-foreground';

  const bank: Record<Kind, { id: string; title: string }[]> = {
    mcq: mcqs.map(m => ({ id: m.id, title: m.question })),
    coding: questions.map(q => ({ id: q.id, title: q.title })),
    fib: fibs.map(f => ({ id: f.id, title: f.sentence })),
    writing: writings.map(w => ({ id: w.id, title: w.title })),
  };
  const kinds: Kind[] = type === 'test' ? (Object.keys(counts) as Kind[]).filter(k => counts[k] > 0) : [type];

  async function generate(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; setBusy(true);
    const want: Record<Kind, number> = type === 'test' ? counts : { mcq: 0, coding: 0, fib: 0, writing: 0, [type]: count };
    const ids: Record<Kind, string[]> = { mcq: [], coding: [], fib: [], writing: [] };
    let aiCount = 0, reused = 0, aiError = '';
    try {
      const avoid = kinds.flatMap(k => bank[k].map(b => b.title)).filter(Boolean).slice(0, 300);
      try {
        const res = await generateQuestions({ action: 'generate', type, topic, difficulty, avoid, ...(type === 'test' ? { testName, counts } : { count }) });
        for (const q of res) { if (ids[q.type].length < want[q.type]) { ids[q.type].push(await saveDraft(q)); aiCount++; } }
      } catch (err) { aiError = err instanceof Error ? err.message : 'AI unavailable'; }

      // Top up from the existing bank when AI returned fewer than asked (only for whole tests — never duplicate in the bank itself).
      if (type === 'test') {
        const used = new Set(exams.flatMap(x => [...(x.questionIds || []), ...(x.mcqIds || []), ...(x.fibIds || []), ...(x.writingIds || [])]));
        const t = norm(topic);
        for (const k of kinds) {
          const missing = want[k] - ids[k].length;
          if (missing <= 0) continue;
          const pool = [...bank[k]].sort((a, b) => Number(norm(b.title).includes(t)) - Number(norm(a.title).includes(t)) || Number(used.has(a.id)) - Number(used.has(b.id)));
          const extra = pool.filter(p => !ids[k].includes(p.id)).slice(0, missing).map(p => p.id);
          ids[k].push(...extra); reused += extra.length;
        }
      }
      const total = Object.values(ids).flat().length;
      if (!total) throw new Error(aiError || 'No questions could be generated. Please try again.');

      if (type === 'test') {
        const { error } = await supabase.from('exams').insert({ id: crypto.randomUUID(), title: testName, description: topic, question_ids: ids.coding, mcq_ids: ids.mcq, fib_ids: ids.fib, writing_ids: ids.writing, assigned_student_ids: [], status: 'draft', is_timed: true, start_buffer_minutes: 10, exam_duration_minutes: 60, allow_copy_paste: true } as any);
        if (error) throw error;
      }
      window.dispatchEvent(new Event('assistant-bank-updated'));
      const wanted = Object.values(want).reduce((a, b) => a + b, 0);
      toast.success(`${type === 'test' ? `Draft test "${testName}" created with ${total} questions` : `Saved ${aiCount} new question(s)`}${reused ? ` (${reused} reused from your bank)` : ''}`);
      if (total < wanted) toast.warning(`Only ${total} of ${wanted} could be prepared${aiError ? ` — ${aiError}` : ''}.`);
      setOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Generation failed. Some saved questions may already be in the bank.'); }
    finally { setBusy(false); }
  }

  return <><Button variant="outline" onClick={() => setOpen(true)}><Sparkles className="mr-2 h-4 w-4" />{type === 'test' ? 'Generate test with AI' : 'Generate questions'}</Button>
    <Dialog open={open} onOpenChange={v => { if (!busy) setOpen(v); }}><DialogContent className="max-w-md max-h-[90vh] overflow-y-auto"><DialogTitle>{type === 'test' ? 'Generate a test' : 'Generate questions'}</DialogTitle><DialogDescription>AI writes new questions (never repeats ones already in your bank){type === 'test' ? '. If AI returns too few, matching questions from your bank fill the gap' : ''}.</DialogDescription>
      <form onSubmit={generate} className="space-y-4">
        {type === 'test' && <label className="block text-sm">Test name<input required maxLength={200} className={field} value={testName} onChange={e => setTestName(e.target.value)} /></label>}
        <label className="block text-sm">Topic<input required maxLength={500} className={field} value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Python loops, Java OOP, Aptitude" /></label>
        <label className="block text-sm">Difficulty<select className={field} value={difficulty} onChange={e => setDifficulty(e.target.value)}>{['easy', 'medium', 'hard'].map(d => <option key={d}>{d}</option>)}</select></label>
        {type === 'test' ? <>
          <div><p className="text-sm mb-2">Question types</p><div className="flex flex-wrap gap-2">{PRESETS.map(p => { const on = JSON.stringify(p.counts) === JSON.stringify(counts); return <button type="button" key={p.label} onClick={() => setCounts(p.counts)} className={`h-8 rounded-lg border px-3 text-xs font-medium ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground hover:bg-muted'}`}>{p.label}</button>; })}</div></div>
          <div className="grid grid-cols-2 gap-3">{(Object.keys(counts) as Kind[]).map(k => <label key={k} className="block text-sm">{LABEL[k]}<input required type="number" min={0} max={20} className={field} value={counts[k]} onChange={e => setCounts({ ...counts, [k]: Math.max(0, Math.min(20, Number(e.target.value))) })} /></label>)}</div>
        </> : <label className="block text-sm">Number of questions (1–20)<input required type="number" min={1} max={20} className={field} value={count} onChange={e => setCount(Number(e.target.value))} /></label>}
        <Button disabled={busy || !topic.trim() || (type === 'test' && (!testName.trim() || !Object.values(counts).some(Boolean)))} type="submit">{busy ? 'Generating and saving…' : 'Generate and save'}</Button>
      </form></DialogContent></Dialog></>;
}

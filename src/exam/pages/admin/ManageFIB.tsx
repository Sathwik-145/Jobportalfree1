// @ts-nocheck
import GenerateQuestions from '@/exam/components/GenerateQuestions';
import { BookOpen } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { FIBQuestion } from '@/exam/types';
import { upsertFIBQuestion, deleteFIBQuestion } from '@/exam/lib/supabase-helpers';
import { generateId } from '@/exam/data/sampleData';
import { Plus, Pencil, Trash2, X, ListChecks } from 'lucide-react';
import { toast } from 'sonner';

export default function ManageFIB() {
  const { fibs, setFibs } = useAuth();
  const [editing, setEditing] = useState<FIBQuestion | null>(null);
  const [answersStr, setAnswersStr] = useState('');

  const blank = (): FIBQuestion => ({
    id: generateId(), sentence: '', answers: [], caseSensitive: false,
    marks: 1, difficulty: 'easy', explanation: '',
    createdAt: new Date().toISOString(),
  });

  const openEdit = (f: FIBQuestion | null) => {
    setEditing(f);
    setAnswersStr((f?.answers || []).join(', '));
  };

  const save = async () => {
    if (!editing || !editing.sentence.trim()) {
      toast.error('Sentence is required (use ___ for the blank)');
      return;
    }
    const answers = answersStr.split(',').map(a => a.trim()).filter(Boolean);
    if (answers.length === 0) { toast.error('At least one accepted answer'); return; }
    const final = { ...editing, answers };
    await upsertFIBQuestion(final);
    setFibs(prev => {
      const idx = prev.findIndex(f => f.id === final.id);
      if (idx >= 0) { const c = [...prev]; c[idx] = final; return c; }
      return [...prev, final];
    });
    toast.success('Saved'); setEditing(null);
  };

  const del = async (id: string) => {
    await deleteFIBQuestion(id);
    setFibs(prev => prev.filter(f => f.id !== id));
    toast.success('Deleted');
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto min-w-0">
        <div className="portal-banner flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6 rounded-2xl bg-primary text-primary-foreground p-5 sm:p-7 shadow-sm">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground/80"><span className="inline-flex size-8 items-center justify-center rounded-2xl bg-primary-foreground/15"><BookOpen className="size-4" /></span> Question bank</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Fill in the Blanks</h1>
            <GenerateQuestions type="fib" />
            <p className="text-muted-foreground text-sm">Use <code>___</code> in the sentence to mark the blank</p>
          </div>
          <button onClick={() => openEdit(blank())} className="flex items-center gap-2 px-4 h-10 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90">
            <Plus className="w-4 h-4" /> New FIB
          </button>
        </div>

        <div className="space-y-3">
          {fibs.map(f => (
            <div key={f.id} className="bg-card border rounded-2xl p-4 sm:p-5 shadow-sm flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 break-words">
                <p className="text-sm">{f.sentence}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Answers: <span className="font-mono">{f.answers.join(' | ')}</span> · {f.marks}m · {f.difficulty}
                  {f.caseSensitive && ' · case-sensitive'}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(f)} className="p-2 hover:bg-muted rounded-xl"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => del(f.id)} className="p-2 hover:bg-destructive/10 rounded-xl"><Trash2 className="w-4 h-4 text-destructive" /></button>
              </div>
            </div>
          ))}
          {fibs.length === 0 && (
            <div className="rounded-2xl border border-dashed bg-card p-6 text-center py-16 text-muted-foreground">
              <ListChecks className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No fill-in-blank questions yet.</p>
            </div>
          )}
        </div>

        {editing && (
          <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border rounded-2xl shadow-lg p-5 sm:p-6 w-full max-w-lg max-h-[90dvh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">FIB Question</h2>
                <button onClick={() => setEditing(null)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Sentence (use ___ for blank)</label>
                  <textarea value={editing.sentence} onChange={e => setEditing({ ...editing, sentence: e.target.value })}
                    rows={3} className="w-full px-3 py-2 rounded-xl border bg-background text-sm" placeholder="The capital of France is ___." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Accepted Answers (comma-separated)</label>
                  <input value={answersStr} onChange={e => setAnswersStr(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border bg-background text-sm" placeholder="Paris, paris" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Marks</label>
                    <input type="number" value={editing.marks} onChange={e => setEditing({ ...editing, marks: Number(e.target.value) || 1 })}
                      className="w-full h-10 px-3 rounded-xl border bg-background text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Difficulty</label>
                    <select value={editing.difficulty} onChange={e => setEditing({ ...editing, difficulty: e.target.value as any })}
                      className="w-full h-10 px-3 rounded-xl border bg-background text-sm">
                      <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                    </select>
                  </div>
                  <label className="flex items-end gap-2 pb-2">
                    <input type="checkbox" checked={editing.caseSensitive} onChange={e => setEditing({ ...editing, caseSensitive: e.target.checked })} />
                    <span className="text-xs">Case-sensitive</span>
                  </label>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Explanation (optional)</label>
                  <textarea value={editing.explanation} onChange={e => setEditing({ ...editing, explanation: e.target.value })}
                    rows={2} className="w-full px-3 py-2 rounded-xl border bg-background text-sm" />
                </div>
              </div>
              <div className="flex gap-2 mt-5 justify-end">
                <button onClick={() => setEditing(null)} className="px-4 h-10 bg-muted rounded-xl text-sm">Cancel</button>
                <button onClick={save} className="px-5 h-10 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

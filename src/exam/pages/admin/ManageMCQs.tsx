// @ts-nocheck
import GenerateQuestions from '@/exam/components/GenerateQuestions';
import { useState, useMemo } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { MCQQuestion } from '@/exam/types';
import { generateId } from '@/exam/data/sampleData';
import { BookOpen, Plus, Pencil, Trash2, X, Check, Search, ListChecks } from 'lucide-react';
import { toast } from 'sonner';

function emptyMCQ(): MCQQuestion {
  return {
    id: generateId(),
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    category: 'General',
    difficulty: 'easy',
    marks: 1,
    explanation: '',
    createdAt: new Date().toISOString(),
  };
}

export default function ManageMCQs() {
  const { mcqs, setMcqs } = useAuth();
  const [editing, setEditing] = useState<MCQQuestion | null>(null);
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set(mcqs.map(m => m.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [mcqs]);

  const filtered = useMemo(() => {
    return mcqs.filter(m => {
      if (filterDifficulty !== 'all' && m.difficulty !== filterDifficulty) return false;
      if (filterCategory !== 'all' && m.category !== filterCategory) return false;
      if (search && !m.question.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [mcqs, filterDifficulty, filterCategory, search]);

  const handleSave = () => {
    if (!editing) return;
    if (!editing.question.trim()) { toast.error('Question cannot be empty'); return; }
    if (editing.options.some(o => !o.trim())) { toast.error('All options must be filled'); return; }
    if (editing.correctIndex < 0 || editing.correctIndex >= editing.options.length) {
      toast.error('Select a correct answer'); return;
    }
    setMcqs(prev => {
      const idx = prev.findIndex(m => m.id === editing.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = editing;
        return copy;
      }
      return [...prev, editing];
    });
    setEditing(null);
    toast.success('MCQ saved');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this MCQ?')) return;
    setMcqs(prev => prev.filter(m => m.id !== id));
    toast.success('MCQ deleted');
  };

  const updateOption = (idx: number, value: string) => {
    if (!editing) return;
    const opts = [...editing.options];
    opts[idx] = value;
    setEditing({ ...editing, options: opts });
  };

  const addOption = () => {
    if (!editing) return;
    if (editing.options.length >= 6) return;
    setEditing({ ...editing, options: [...editing.options, ''] });
  };

  const removeOption = (idx: number) => {
    if (!editing) return;
    if (editing.options.length <= 2) return;
    const opts = editing.options.filter((_, i) => i !== idx);
    const correct = editing.correctIndex === idx ? 0 : editing.correctIndex > idx ? editing.correctIndex - 1 : editing.correctIndex;
    setEditing({ ...editing, options: opts, correctIndex: correct });
  };

  if (editing) {
    return (
      <AdminLayout>
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
          <div className="portal-banner flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6 rounded-2xl bg-primary text-primary-foreground p-5 sm:p-7 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground/80"><span className="inline-flex size-8 items-center justify-center rounded-2xl bg-primary-foreground/15"><BookOpen className="size-4" /></span> Question bank</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{mcqs.find(m => m.id === editing.id) ? 'Edit MCQ' : 'New MCQ'}</h1>
            <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Question</label>
              <textarea
                value={editing.question}
                onChange={e => setEditing({ ...editing, question: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                placeholder="Enter your question here..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">Options (click radio to mark correct)</label>
                {editing.options.length < 6 && (
                  <button onClick={addOption} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Option
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {editing.options.map((opt, idx) => (
                  <div key={idx} className={`flex items-center gap-2 p-2 rounded-xl border ${editing.correctIndex === idx ? 'border-success bg-success/5' : 'border-border'}`}>
                    <button
                      onClick={() => setEditing({ ...editing, correctIndex: idx })}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        editing.correctIndex === idx ? 'border-success bg-success text-success-foreground' : 'border-muted-foreground'
                      }`}
                    >
                      {editing.correctIndex === idx && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <input
                      value={opt}
                      onChange={e => updateOption(idx, e.target.value)}
                      className="flex-1 h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    />
                    {editing.options.length > 2 && (
                      <button onClick={() => removeOption(idx)} className="p-1.5 hover:bg-destructive/10 rounded">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Category</label>
                <input
                  value={editing.category}
                  onChange={e => setEditing({ ...editing, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border bg-background text-sm"
                  placeholder="e.g. Algorithms"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Difficulty</label>
                <select
                  value={editing.difficulty}
                  onChange={e => setEditing({ ...editing, difficulty: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-xl border bg-background text-sm"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Marks</label>
                <input
                  type="number"
                  min={1}
                  value={editing.marks}
                  onChange={e => setEditing({ ...editing, marks: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-full h-10 px-3 rounded-xl border bg-background text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Explanation (optional)</label>
              <textarea
                value={editing.explanation}
                onChange={e => setEditing({ ...editing, explanation: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border bg-background text-sm resize-y"
                placeholder="Explain why the correct answer is correct..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={handleSave}
                className="px-6 h-10 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all">
                Save MCQ
              </button>
              <button onClick={() => setEditing(null)}
                className="px-6 h-10 bg-muted text-foreground rounded-xl font-medium text-sm hover:bg-muted/80 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-w-0">
        <div className="portal-banner flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6 rounded-2xl bg-primary text-primary-foreground p-5 sm:p-7 shadow-sm">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground/80"><span className="inline-flex size-8 items-center justify-center rounded-2xl bg-primary-foreground/15"><BookOpen className="size-4" /></span> Question bank</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <ListChecks className="w-6 h-6" /> MCQs
            </h1>
            <GenerateQuestions type="mcq" />
            <p className="text-muted-foreground text-sm">Create and manage multiple-choice questions</p>
          </div>
          <button onClick={() => setEditing(emptyMCQ())}
            className="flex items-center gap-2 px-4 h-10 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all">
            <Plus className="w-4 h-4" /> Create MCQ
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border bg-background text-sm"
            />
          </div>
          <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value as any)}
            className="h-10 px-3 rounded-xl border bg-background text-sm">
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="h-10 px-3 rounded-xl border bg-background text-sm">
            {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
          </select>
          <span className="text-sm text-muted-foreground ml-auto">{filtered.length} of {mcqs.length}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card border rounded-2xl p-10 text-center">
            <ListChecks className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No MCQs yet</p>
            <p className="text-sm text-muted-foreground">Click "Create MCQ" to add your first question.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(m => (
              <div key={m.id} className="bg-card border rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.difficulty === 'easy' ? 'bg-primary/10 text-primary' :
                        m.difficulty === 'medium' ? 'bg-warning/10 text-warning' :
                        'bg-destructive/10 text-destructive'
                      }`}>{m.difficulty}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">{m.category}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">{m.marks} mark{m.marks !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="font-medium mb-3">{m.question}</p>
                    <div className="space-y-1">
                      {m.options.map((opt, idx) => (
                        <div key={idx} className={`text-sm flex items-center gap-2 ${m.correctIndex === idx ? 'text-success font-medium' : 'text-muted-foreground'}`}>
                          <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          {opt}
                          {m.correctIndex === idx && <Check className="w-3.5 h-3.5" />}
                        </div>
                      ))}
                    </div>
                    {m.explanation && (
                      <p className="text-xs text-muted-foreground mt-3 italic">💡 {m.explanation}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditing({ ...m })} className="p-2 hover:bg-muted rounded-xl">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="p-2 hover:bg-destructive/10 rounded-xl">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

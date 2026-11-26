// @ts-nocheck
import GenerateQuestions from '@/exam/components/GenerateQuestions';
import { BookOpen } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { Question, TestCase } from '@/exam/types';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, generateId } from '@/exam/data/sampleData';
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';

function emptyTestCase(): TestCase {
  return { id: generateId(), input: '', expectedOutput: '' };
}

function emptyQuestion(): Question {
  return {
    id: generateId(),
    title: '',
    description: '',
    difficulty: 'easy',
    defaultPublicCount: 10,
    defaultPrivateCount: 10,
    languages: ['python'],
    timeLimit: 30,
    sampleCount: 3,
    createdAt: new Date().toISOString(),
    order: 0,
    publicTestCases: Array.from({ length: 10 }, emptyTestCase),
    privateTestCases: Array.from({ length: 10 }, emptyTestCase),
  };
}

export default function ManageQuestions() {
  const { questions, setQuestions } = useAuth();
  const [editing, setEditing] = useState<Question | null>(null);
  const [showPublic, setShowPublic] = useState(true);
  const [showPrivate, setShowPrivate] = useState(false);

  const sortedQuestions = [...questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleSave = () => {
    if (!editing || !editing.title.trim()) return;
    setQuestions(prev => {
      const idx = prev.findIndex(q => q.id === editing.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = editing;
        return copy;
      }
      return [...prev, { ...editing, order: prev.length }];
    });
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    setQuestions(prev => {
      const sorted = [...prev].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const idx = sorted.findIndex(q => q.id === id);
      if (direction === 'up' && idx > 0) {
        const temp = sorted[idx].order;
        sorted[idx] = { ...sorted[idx], order: sorted[idx - 1].order };
        sorted[idx - 1] = { ...sorted[idx - 1], order: temp };
      } else if (direction === 'down' && idx < sorted.length - 1) {
        const temp = sorted[idx].order;
        sorted[idx] = { ...sorted[idx], order: sorted[idx + 1].order };
        sorted[idx + 1] = { ...sorted[idx + 1], order: temp };
      }
      return sorted;
    });
  };

  const updateTestCase = (type: 'publicTestCases' | 'privateTestCases', idx: number, field: 'input' | 'expectedOutput', value: string) => {
    if (!editing) return;
    const cases = [...editing[type]];
    cases[idx] = { ...cases[idx], [field]: value };
    setEditing({ ...editing, [type]: cases });
  };

  const addTestCase = (type: 'publicTestCases' | 'privateTestCases') => {
    if (!editing) return;
    setEditing({ ...editing, [type]: [...editing[type], emptyTestCase()] });
  };

  const removeTestCase = (type: 'publicTestCases' | 'privateTestCases', idx: number) => {
    if (!editing) return;
    setEditing({ ...editing, [type]: editing[type].filter((_, i) => i !== idx) });
  };

  if (editing) {
    return (
      <AdminLayout>
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto min-w-0">
          <div className="portal-banner flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6 rounded-2xl bg-primary text-primary-foreground p-5 sm:p-7 shadow-sm">
            <div className="min-w-0 flex-1"><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground/80"><span className="inline-flex size-8 items-center justify-center rounded-2xl bg-primary-foreground/15"><BookOpen className="size-4" /></span> Question bank</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{editing.title ? 'Edit Question' : 'New Question'}</h1></div>
            <button aria-label="Close question editor" onClick={() => setEditing(null)} className="inline-flex size-10 shrink-0 items-center justify-center self-end sm:self-center rounded-lg bg-card text-primary hover:bg-card/90">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title</label>
              <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description (Markdown supported)</label>
              <textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}
                rows={6} className="w-full px-3 py-2 rounded-xl border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Difficulty</label>
                <select value={editing.difficulty} onChange={e => setEditing({ ...editing, difficulty: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-xl border bg-background text-sm">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Time Limit (min)</label>
                <input type="number" value={editing.timeLimit} onChange={e => setEditing({ ...editing, timeLimit: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Sample Cases Count</label>
                <input type="number" min={0} max={editing.publicTestCases.length} value={editing.sampleCount ?? 3}
                  onChange={e => setEditing({ ...editing, sampleCount: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <p className="text-xs text-muted-foreground mt-1">Public cases shown as samples to students</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Languages</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <button key={lang} onClick={() => {
                      const langs = editing.languages.includes(lang)
                        ? editing.languages.filter(l => l !== lang)
                        : [...editing.languages, lang];
                      setEditing({ ...editing, languages: langs });
                    }}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        editing.languages.includes(lang) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                      {LANGUAGE_LABELS[lang]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Public Test Cases */}
            <div className="border rounded-2xl overflow-hidden">
              <button onClick={() => setShowPublic(!showPublic)}
                className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors">
                <span className="font-medium text-sm">Public Test Cases ({editing.publicTestCases.length})</span>
                {showPublic ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showPublic && (
                <div className="p-4 space-y-3">
                  {editing.publicTestCases.map((tc, i) => (
                    <div key={tc.id} className="flex gap-3 items-start">
                      <span className="text-xs text-muted-foreground mt-2 w-6">{i + 1}.</span>
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <textarea value={tc.input} onChange={e => updateTestCase('publicTestCases', i, 'input', e.target.value)}
                          placeholder="Input" rows={2} className="px-3 py-2 rounded-xl border bg-background text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring" />
                        <textarea value={tc.expectedOutput} onChange={e => updateTestCase('publicTestCases', i, 'expectedOutput', e.target.value)}
                          placeholder="Expected Output" rows={2} className="px-3 py-2 rounded-xl border bg-background text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <button onClick={() => removeTestCase('publicTestCases', i)} className="text-muted-foreground hover:text-destructive mt-2">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addTestCase('publicTestCases')}
                    className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add test case
                  </button>
                </div>
              )}
            </div>

            {/* Private Test Cases */}
            <div className="border rounded-2xl overflow-hidden">
              <button onClick={() => setShowPrivate(!showPrivate)}
                className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors">
                <span className="font-medium text-sm">Private Test Cases ({editing.privateTestCases.length})</span>
                {showPrivate ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showPrivate && (
                <div className="p-4 space-y-3">
                  {editing.privateTestCases.map((tc, i) => (
                    <div key={tc.id} className="flex gap-3 items-start">
                      <span className="text-xs text-muted-foreground mt-2 w-6">{i + 1}.</span>
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <textarea value={tc.input} onChange={e => updateTestCase('privateTestCases', i, 'input', e.target.value)}
                          placeholder="Input" rows={2} className="px-3 py-2 rounded-xl border bg-background text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring" />
                        <textarea value={tc.expectedOutput} onChange={e => updateTestCase('privateTestCases', i, 'expectedOutput', e.target.value)}
                          placeholder="Expected Output" rows={2} className="px-3 py-2 rounded-xl border bg-background text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <button onClick={() => removeTestCase('privateTestCases', i)} className="text-muted-foreground hover:text-destructive mt-2">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addTestCase('privateTestCases')}
                    className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add test case
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={handleSave}
                className="px-6 h-10 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all">
                Save Question
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Questions</h1>
            <GenerateQuestions type="coding" />
            <p className="text-muted-foreground text-sm">Manage coding questions and test cases</p>
          </div>
          <button onClick={() => setEditing(emptyQuestion())}
            className="flex items-center gap-2 px-4 h-10 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all">
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>

        <div className="space-y-3">
          {sortedQuestions.map((q, idx) => (
            <div key={q.id} className="bg-card border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveQuestion(q.id, 'up')} disabled={idx === 0}
                    className="p-1 hover:bg-muted rounded disabled:opacity-20 transition-colors">
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => moveQuestion(q.id, 'down')} disabled={idx === sortedQuestions.length - 1}
                    className="p-1 hover:bg-muted rounded disabled:opacity-20 transition-colors">
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-lg font-bold text-muted-foreground w-8">{idx + 1}</span>
                <div className="flex-1 min-w-0 break-words">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{q.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      q.difficulty === 'easy' ? 'bg-primary/10 text-primary' :
                      q.difficulty === 'medium' ? 'bg-warning/10 text-warning' :
                      'bg-destructive/10 text-destructive'
                    }`}>{q.difficulty}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {q.publicTestCases.length} public · {q.privateTestCases.length} private · {q.timeLimit} min · {q.languages.map(l => LANGUAGE_LABELS[l]).join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing({ ...q })} className="p-2 hover:bg-muted rounded-xl transition-colors">
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={() => handleDelete(q.id)} className="p-2 hover:bg-destructive/10 rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

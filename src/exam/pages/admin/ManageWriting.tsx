// @ts-nocheck
import GenerateQuestions from '@/exam/components/GenerateQuestions';
import { BookOpen } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { WritingQuestion } from '@/exam/types';
import { upsertWritingQuestion, deleteWritingQuestion } from '@/exam/lib/supabase-helpers';
import { generateId } from '@/exam/data/sampleData';
import { Plus, Pencil, Trash2, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ManageWriting() {
  const { writings, setWritings } = useAuth();
  const [editing, setEditing] = useState<WritingQuestion | null>(null);

  const blank = (): WritingQuestion => ({
    id: generateId(), title: 'Introduce Yourself',
    prompt: '', minWords: 50, maxWords: 500, marks: 10,
    createdAt: new Date().toISOString(),
  });

  const save = async () => {
    if (!editing || !editing.title.trim() || !editing.prompt.trim()) {
      toast.error('Title and prompt are required');
      return;
    }
    await upsertWritingQuestion(editing);
    setWritings(prev => {
      const idx = prev.findIndex(w => w.id === editing.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = editing; return copy; }
      return [...prev, editing];
    });
    toast.success('Saved'); setEditing(null);
  };

  const del = async (id: string) => {
    await deleteWritingQuestion(id);
    setWritings(prev => prev.filter(w => w.id !== id));
    toast.success('Deleted');
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto min-w-0">
        <div className="portal-banner flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6 rounded-2xl bg-primary text-primary-foreground p-5 sm:p-7 shadow-sm">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground/80"><span className="inline-flex size-8 items-center justify-center rounded-2xl bg-primary-foreground/15"><BookOpen className="size-4" /></span> Question bank</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Writing Questions</h1>
            <GenerateQuestions type="writing" />
            <p className="text-muted-foreground text-sm">Introduce Yourself / essay-style questions</p>
          </div>
          <button onClick={() => setEditing(blank())} className="flex items-center gap-2 px-4 h-10 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90">
            <Plus className="w-4 h-4" /> New Writing
          </button>
        </div>

        <div className="space-y-3">
          {writings.map(w => (
            <div key={w.id} className="bg-card border rounded-2xl p-4 sm:p-5 shadow-sm flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 break-words">
                <h3 className="font-semibold">{w.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{w.prompt}</p>
                <p className="text-xs text-muted-foreground mt-2">Words: {w.minWords}-{w.maxWords} · {w.marks} marks</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(w)} className="p-2 hover:bg-muted rounded-xl"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => del(w.id)} className="p-2 hover:bg-destructive/10 rounded-xl"><Trash2 className="w-4 h-4 text-destructive" /></button>
              </div>
            </div>
          ))}
          {writings.length === 0 && (
            <div className="rounded-2xl border border-dashed bg-card p-6 text-center py-16 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No writing questions yet.</p>
            </div>
          )}
        </div>

        {editing && (
          <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border rounded-2xl shadow-lg p-5 sm:p-6 w-full max-w-lg max-h-[90dvh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Writing Question</h2>
                <button onClick={() => setEditing(null)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Title</label>
                  <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border bg-background text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Prompt</label>
                  <textarea value={editing.prompt} onChange={e => setEditing({ ...editing, prompt: e.target.value })}
                    rows={5} className="w-full px-3 py-2 rounded-xl border bg-background text-sm" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Min Words</label>
                    <input type="number" value={editing.minWords} onChange={e => setEditing({ ...editing, minWords: Number(e.target.value) || 0 })}
                      className="w-full h-10 px-3 rounded-xl border bg-background text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Max Words</label>
                    <input type="number" value={editing.maxWords} onChange={e => setEditing({ ...editing, maxWords: Number(e.target.value) || 0 })}
                      className="w-full h-10 px-3 rounded-xl border bg-background text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Marks</label>
                    <input type="number" value={editing.marks} onChange={e => setEditing({ ...editing, marks: Number(e.target.value) || 0 })}
                      className="w-full h-10 px-3 rounded-xl border bg-background text-sm" />
                  </div>
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

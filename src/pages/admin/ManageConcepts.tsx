// @ts-nocheck
import { useEffect, useState } from 'react';
import { Link } from '@/lib/router-compat';
import { loadConcepts, saveConcepts, resetConcepts, type Concept, CONCEPT_CATEGORIES } from '@/lib/concepts';
import { Brain, Plus, Trash2, Edit, Save, X, ArrowLeft, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const blank = (): Concept => ({
  id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  category: 'DSA',
  title: '',
  summary: '',
  bullets: [],
  importance: 'important',
  forInterview: true,
  forCoding: false,
});

export default function ManageConcepts() {
  const [items, setItems] = useState<Concept[]>([]);
  const [editing, setEditing] = useState<Concept | null>(null);
  const [bulletText, setBulletText] = useState('');

  useEffect(() => { setItems(loadConcepts()); }, []);

  const persist = (next: Concept[]) => { setItems(next); saveConcepts(next); };

  const startEdit = (c: Concept) => { setEditing({ ...c }); setBulletText(c.bullets.join('\n')); };
  const startNew = () => { const n = blank(); setEditing(n); setBulletText(''); };

  const save = () => {
    if (!editing) return;
    if (!editing.title.trim()) { toast.error('Title required'); return; }
    const next = { ...editing, bullets: bulletText.split('\n').map(b => b.trim()).filter(Boolean) };
    const idx = items.findIndex(i => i.id === next.id);
    const list = idx >= 0 ? items.map(i => i.id === next.id ? next : i) : [next, ...items];
    persist(list); setEditing(null); toast.success('Saved');
  };

  const remove = (id: string) => {
    if (!confirm('Delete this concept?')) return;
    persist(items.filter(i => i.id !== id)); toast.success('Deleted');
  };

  const reset = () => {
    if (!confirm('Reset all concepts to defaults? Custom edits will be lost.')) return;
    resetConcepts(); setItems(loadConcepts()); toast.success('Reset to defaults');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="p-2 hover:bg-muted rounded-lg"><ArrowLeft className="w-4 h-4" /></Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2"><Brain className="w-5 h-5 text-primary" /> Manage Important Concepts</h1>
              <p className="text-xs text-muted-foreground">Editable concepts shown on landing page &amp; interview prep</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={reset} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-sm hover:bg-muted"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            <button onClick={startNew} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"><Plus className="w-4 h-4" /> New concept</button>
          </div>
        </div>
      </div>

      <div className="container py-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground">{items.length} concepts</h2>
          {items.map(c => (
            <div key={c.id} className="bg-card border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{c.category}</p>
                  <h3 className="font-semibold">{c.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.importance === 'must-know' ? 'bg-primary text-primary-foreground' : c.importance === 'important' ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground'}`}>{c.importance}</span>
                  <button onClick={() => startEdit(c)} className="p-1.5 hover:bg-muted rounded"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(c.id)} className="p-1.5 hover:bg-destructive/10 rounded text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{c.summary}</p>
              <div className="flex gap-1 flex-wrap">
                {c.forInterview && <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">Interview</span>}
                {c.forCoding && <span className="text-[10px] px-2 py-0.5 rounded bg-secondary/10 text-secondary">Coding</span>}
                <span className="text-[10px] text-muted-foreground">{c.bullets.length} bullet points</span>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-6 self-start">
          {!editing ? (
            <div className="bg-muted/30 border-2 border-dashed rounded-xl p-10 text-center text-muted-foreground text-sm">
              Select a concept to edit, or click "New concept".
            </div>
          ) : (
            <div className="bg-card border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{items.find(i => i.id === editing.id) ? 'Edit concept' : 'New concept'}</h3>
                <button onClick={() => setEditing(null)} className="p-1.5 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs">Category
                  <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} className="w-full mt-1 px-2 py-1.5 border rounded text-sm bg-background">
                    {CONCEPT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="text-xs">Importance
                  <select value={editing.importance} onChange={e => setEditing({ ...editing, importance: e.target.value as any })} className="w-full mt-1 px-2 py-1.5 border rounded text-sm bg-background">
                    <option value="must-know">Must know</option>
                    <option value="important">Important</option>
                    <option value="good-to-know">Good to know</option>
                  </select>
                </label>
              </div>
              <label className="text-xs block">Title
                <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} className="w-full mt-1 px-2 py-1.5 border rounded text-sm bg-background" />
              </label>
              <label className="text-xs block">Summary
                <textarea value={editing.summary} onChange={e => setEditing({ ...editing, summary: e.target.value })} rows={2} className="w-full mt-1 px-2 py-1.5 border rounded text-sm bg-background" />
              </label>
              <label className="text-xs block">Bullet points (one per line)
                <textarea value={bulletText} onChange={e => setBulletText(e.target.value)} rows={5} className="w-full mt-1 px-2 py-1.5 border rounded text-sm bg-background font-mono" />
              </label>
              <div className="flex gap-3">
                <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={editing.forInterview} onChange={e => setEditing({ ...editing, forInterview: e.target.checked })} /> For interviews</label>
                <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={editing.forCoding} onChange={e => setEditing({ ...editing, forCoding: e.target.checked })} /> For coding</label>
              </div>
              <button onClick={save} className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"><Save className="w-4 h-4" /> Save</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

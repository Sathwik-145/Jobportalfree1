// @ts-nocheck
import { PanelsTopLeft } from 'lucide-react';
// @ts-nocheck
import { useEffect, useState } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { Link2, Copy, Plus, Trash2, Power, X, ExternalLink, Pencil, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { listLinks, saveLinks, linkUrl, PRESET_FIELDS, listLinkRegs, syncLinks, syncLinkRegs } from '@/exam/lib/regLinks';

const inp = 'w-full h-10 px-3 rounded-2xl border border-border/60 bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60';

export default function RegistrationLinks() {
  const [links, setLinks] = useState(listLinks());
  const [regs, setRegs] = useState(listLinkRegs());
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    try { const [l, r] = await Promise.all([syncLinks(), syncLinkRegs()]); setLinks(l); setRegs(r); toast.success('Links refreshed'); }
    catch { toast.error('Could not refresh'); }
    setRefreshing(false);
  };
  useEffect(() => { syncLinks().then(setLinks); syncLinkRegs().then(setRegs).catch(() => {}); }, []);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [fields, setFields] = useState(PRESET_FIELDS.filter(f => ['college', 'cgpa', 'leetcode'].includes(f.key)));
  const [custom, setCustom] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const persist = (l) => { setLinks(l); saveLinks(l); };
  const toggleField = (f) => setFields(fs => fs.some(x => x.key === f.key) ? fs.filter(x => x.key !== f.key) : [...fs, { ...f }]);
  const addCustom = () => {
    const label = custom.trim(); if (!label) return;
    setFields(fs => [...fs, { key: `c_${Date.now()}`, label, type: 'text', required: false }]); setCustom('');
  };
  const startEdit = (l) => { setEditing(l.id); setTitle(l.title); setDesc(l.description || ''); setFields(l.fields || []); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const cancelEdit = () => { setEditing(null); setTitle(''); setDesc(''); };
  const create = () => {
    if (!title.trim()) { toast.error('Enter a title'); return; }
    if (editing) {
      persist(links.map(x => x.id === editing ? { ...x, title: title.trim(), description: desc.trim(), fields } : x));
      toast.success('Link updated — same address, new form'); cancelEdit(); return;
    }
    const l = { id: Math.random().toString(36).slice(2, 10), title: title.trim(), description: desc.trim(), fields, active: true, createdAt: new Date().toISOString() };
    persist([l, ...links]); setTitle(''); setDesc('');
    navigator.clipboard.writeText(linkUrl(l)); toast.success('Link created & copied');
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-w-0 space-y-6">
        <div className="portal-banner flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6 rounded-2xl bg-primary text-primary-foreground p-5 sm:p-7 shadow-sm">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground/80"><span className="inline-flex size-8 items-center justify-center rounded-2xl bg-primary-foreground/15"><PanelsTopLeft className="size-4" /></span> Administration</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2"><Link2 className="w-6 h-6 text-primary" /> Registration Link Generator</h1>
            <p className="text-sm text-muted-foreground mt-1">Create custom registration forms for specific groups. Registrants appear in “Link Registrants”.</p>
          </div>
          <button onClick={refresh} disabled={refreshing} aria-label="Refresh links" className="h-9 px-3 inline-flex items-center gap-2 rounded-xl border text-sm hover:bg-accent disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-lg">
          <h2 className="font-semibold">{editing ? 'Edit link' : 'New link'}</h2>
          <input className={inp} placeholder="Title, e.g. SDE Hiring — IIT Batch 2026" value={title} onChange={e => setTitle(e.target.value)} />
          <textarea className={`${inp} h-auto py-2`} rows={2} placeholder="Description / instructions (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
          <div>
            <p className="text-sm font-medium mb-2">Fields to collect (name & email are always included)</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_FIELDS.map(f => {
                const on = fields.some(x => x.key === f.key);
                return <button key={f.key} onClick={() => toggleField(f)} className={`h-8 px-3 rounded-full text-xs font-medium border transition ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/50 hover:bg-accent'}`}>{f.label}</button>;
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <input className={inp} placeholder="Add custom field label, e.g. HackerRank stars" value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustom()} />
            <button onClick={addCustom} className="h-10 px-4 rounded-2xl border text-sm hover:bg-accent shrink-0">Add</button>
          </div>
          {fields.length > 0 && (
            <div className="space-y-2">
              {fields.map((f, i) => (
                <div key={f.key} className="flex flex-wrap items-center gap-3 text-sm bg-muted/40 border border-border/40 rounded-2xl px-3 py-2">
                  <span className="flex-1">{f.label}</span>
                  <select value={f.type} onChange={e => setFields(fs => fs.map((x, j) => j === i ? { ...x, type: e.target.value } : x))} className="h-8 rounded-xl border bg-background px-2 text-xs">
                    {['text', 'number', 'email', 'url', 'textarea'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={f.required} onChange={e => setFields(fs => fs.map((x, j) => j === i ? { ...x, required: e.target.checked } : x))} /> Required</label>
                  <button onClick={() => setFields(fs => fs.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
          <button onClick={create} className="h-10 px-5 inline-flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow"><Plus className="w-4 h-4" /> {editing ? 'Save changes' : 'Generate link'}</button>
          {editing && <button onClick={cancelEdit} className="h-10 px-4 ml-2 rounded-2xl border text-sm hover:bg-accent">Cancel</button>}
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold">Your links ({links.length})</h2>
          {links.length === 0 && <p className="text-sm text-muted-foreground">No links yet.</p>}
          {links.map(l => (
            <div key={l.id} className="bg-card border rounded-2xl p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold truncate">{l.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${l.active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>{l.active ? 'Open' : 'Closed'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/40">{regs.filter(r => r.linkId === l.id).length} registered</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{l.fields.map(f => f.label).join(' · ') || 'Name & email only'}</p>
              </div>
              <button onClick={() => startEdit(l)} className="h-8 px-3 inline-flex items-center gap-1 rounded-xl border text-xs hover:bg-accent"><Pencil className="w-3 h-3" /> Edit</button>
              <button onClick={() => { navigator.clipboard.writeText(linkUrl(l)); toast.success('Copied'); }} className="h-8 px-3 inline-flex items-center gap-1 rounded-xl border text-xs hover:bg-accent"><Copy className="w-3 h-3" /> Copy</button>
              <a href={linkUrl(l)} target="_blank" rel="noreferrer" className="h-8 px-3 inline-flex items-center gap-1 rounded-xl border text-xs hover:bg-accent"><ExternalLink className="w-3 h-3" /> Open</a>
              <button onClick={() => persist(links.map(x => x.id === l.id ? { ...x, active: !x.active } : x))} className="h-8 px-3 inline-flex items-center gap-1 rounded-xl border text-xs hover:bg-accent"><Power className="w-3 h-3" /> {l.active ? 'Close' : 'Reopen'}</button>
              <button onClick={() => confirm('Delete link?') && persist(links.filter(x => x.id !== l.id))} className="h-8 w-8 inline-flex items-center justify-center rounded-xl border hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

// @ts-nocheck
import { PanelsTopLeft } from 'lucide-react';
// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { fetchStudents } from '@/exam/lib/supabase-helpers';
import ApproveRegistrationsDialog from '@/exam/components/ApproveRegistrationsDialog';
import { listLinks, listLinkRegs, saveLinkRegs, syncLinkRegs, syncLinks } from '@/exam/lib/regLinks';
import { Users2, Check, X, Mail, Copy, Download, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function LinkRegistrants() {
  const { setStudents } = useAuth();
  const [links, setLinks] = useState(listLinks());
  const [regs, setRegs] = useState(listLinkRegs());
  useEffect(() => {
    syncLinks().then(setLinks); syncLinkRegs().then(setRegs);
    const i = setInterval(() => syncLinkRegs().then(setRegs), 10000);
    return () => clearInterval(i);
  }, []);
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    try { const [l, r] = await Promise.all([syncLinks(), syncLinkRegs()]); setLinks(l); setRegs(r); toast.success('Registrants refreshed'); }
    catch { toast.error('Could not refresh'); }
    setRefreshing(false);
  };
  const [linkFilter, setLinkFilter] = useState('all');
  const [status, setStatus] = useState('all');
  const persist = (r) => { setRegs(r); saveLinkRegs(r); };

  const rows = useMemo(() => regs.filter(r => (linkFilter === 'all' || r.linkId === linkFilter) && (status === 'all' || r.status === status)), [regs, linkFilter, status]);
  const keys = useMemo(() => Array.from(new Set(rows.flatMap(r => Object.keys(r.answers || {})))), [rows]);
  const labelOf = (k) => { for (const l of links) { const f = l.fields.find(x => x.key === k); if (f) return f.label; } return k; };
  const loginUrl = `${window.location.origin}/exam-login`;

  const [target, setTarget] = useState(null);
  const approve = (r) => setTarget({ clientIds: [r.id], label: r.name || r.email });
  const afterApprove = async (results) => {
    const byClient = Object.fromEntries(results.filter(x => x.ok).map(x => [x.clientId, x]));
    const fresh = await syncLinkRegs();
    setRegs(fresh.map(x => byClient[x.id] ? { ...x, password: byClient[x.id].password } : x));
    try { setStudents(await fetchStudents()); } catch {}
  };
  const mailto = (r) => `mailto:${r.email}?subject=${encodeURIComponent('Your CodeXam exam credentials')}&body=${encodeURIComponent(`Hi ${r.name},\n\nYou are approved for "${r.linkTitle}".\n\nLogin: ${loginUrl}\nEmail: ${r.email}\nPassword: ${r.password}\n\nAll the best!`)}`;

  const exportCsv = () => {
    const head = ['Name', 'Email', 'Link', 'Status', ...keys.map(labelOf), 'Registered'];
    const lines = rows.map(r => [r.name, r.email, r.linkTitle, r.status, ...keys.map(k => r.answers?.[k] || ''), r.createdAt].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'link-registrants.csv'; a.click();
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"><span className="inline-flex size-8 items-center justify-center rounded-2xl bg-primary/10 text-primary"><PanelsTopLeft className="size-4" /></span> Administration</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2"><Users2 className="w-6 h-6 text-primary" /> Link Registrants</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={refresh} disabled={refreshing} aria-label="Refresh registrants" className="h-9 px-3 inline-flex items-center gap-1 rounded-2xl border text-sm hover:bg-accent disabled:opacity-60"><RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh</button>
            <select value={linkFilter} onChange={e => setLinkFilter(e.target.value)} className="h-9 rounded-2xl border bg-background/60 px-3 text-sm">
              <option value="all">All links</option>
              {links.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
            <select value={status} onChange={e => setStatus(e.target.value)} className="h-9 rounded-2xl border bg-background/60 px-3 text-sm">
              {['all', 'pending', 'approved', 'rejected'].map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={exportCsv} disabled={!rows.length} className="h-9 px-3 inline-flex items-center gap-1 rounded-2xl border text-sm hover:bg-accent disabled:opacity-40"><Download className="w-4 h-4" /> CSV</button>
          </div>
        </div>
        <div className="bg-card border rounded-2xl overflow-auto shadow-lg">
          {rows.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">No registrants yet. Share a link from “Registration Links”.</div> : (
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/40 text-xs"><tr className="text-left">
                <th className="px-4 py-3">Student</th><th className="px-4 py-3">Link</th>
                {keys.map(k => <th key={k} className="px-4 py-3 whitespace-nowrap">{labelOf(k)}</th>)}
                <th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
              </tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-t border-border/40 align-top">
                    <td className="px-4 py-3"><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.email}</div></td>
                    <td className="px-4 py-3 text-xs">{r.linkTitle}</td>
                    {keys.map(k => <td key={k} className="px-4 py-3 text-xs max-w-[200px] break-words">{r.answers?.[k] || '—'}</td>)}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${r.status === 'approved' ? 'bg-primary/15 text-primary' : r.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>{r.status}</span>
                      {r.password && <div className="mt-1 text-[11px] font-mono">pwd: {r.password}</div>}
                    </td>
                    <td className="px-4 py-3"><div className="flex gap-1 justify-end">
                      {r.status === 'pending' && <>
                        <button onClick={() => approve(r)} className="h-8 px-2 inline-flex items-center gap-1 rounded-xl bg-primary text-primary-foreground text-xs"><Check className="w-3 h-3" /> Approve</button>
                        <button onClick={() => persist(regs.map(x => x.id === r.id ? { ...x, status: 'rejected' } : x))} className="h-8 px-2 inline-flex items-center gap-1 rounded-xl border text-xs"><X className="w-3 h-3" /></button>
                      </>}
                      {r.status === 'approved' && <>
                        <a href={mailto(r)} className="h-8 px-2 inline-flex items-center gap-1 rounded-xl bg-primary text-primary-foreground text-xs"><Mail className="w-3 h-3" /> Mail</a>
                        <button onClick={() => { navigator.clipboard.writeText(`Login: ${loginUrl}\nEmail: ${r.email}\nPassword: ${r.password}`); toast.success('Copied'); }} className="h-8 px-2 rounded-xl border text-xs"><Copy className="w-3 h-3" /></button>
                      </>}
                      <button onClick={() => confirm('Delete?') && persist(regs.filter(x => x.id !== r.id))} className="h-8 px-2 rounded-xl border text-xs hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <ApproveRegistrationsDialog target={target} onClose={() => setTarget(null)} onDone={afterApprove} />
      </div>
    </AdminLayout>
  );
}

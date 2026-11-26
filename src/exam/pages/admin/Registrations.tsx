import DateRangeFilter, { inRange } from '@/components/DateRangeFilter';
import { PanelsTopLeft, CalendarClock } from 'lucide-react';
// @ts-nocheck
import LogoSpinner from '@/components/LogoSpinner';
import { useEffect, useState } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { supabase } from '@/lib/db-client';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { fetchStudents } from '@/exam/lib/supabase-helpers';
import { toast } from 'sonner';
import { Check, X, Copy, RefreshCw, Shuffle } from 'lucide-react';
import ApproveRegistrationsDialog, { type ApproveTarget } from '@/exam/components/ApproveRegistrationsDialog';
import AllocationSettingsCard from '@/exam/components/AllocationSettingsCard';

interface Registration {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at: string | null;
  approved_student_id: string | null;
  answers?: Record<string, any> | null;
}

const isBooking = (r: Registration) => !!r.answers?.slot_start || /^Booked for later/i.test(r.notes || '');
const fmt = (iso?: string | null) => iso ? new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';

export default function Registrations() {
  const { setStudents } = useAuth();
  const [rows, setRows] = useState<Registration[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [kind, setKind] = useState<'all' | 'register' | 'booking'>('all');
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ from: '', to: '' });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState<ApproveTarget | null>(null);
  const [issued, setIssued] = useState<Record<string, any>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('registrations').select('*').is('link_id', null).not('notes', 'ilike', 'Quick-start%').order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    // Run any automatic booking approvals that are due, then show the fresh list.
    fetch('/api/public/auto-approve-bookings', { method: 'POST' }).catch(() => {}).finally(load);
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, []);

  const afterApprove = async (results: any[]) => {
    setIssued(prev => ({ ...prev, ...Object.fromEntries(results.filter(r => r.ok).map(r => [r.id, r])) }));
    setSelected(new Set());
    try { setStudents(await fetchStudents()); } catch {}
    load();
  };

  const reject = async (r: Registration) => {
    if (!confirm(`Reject registration for ${r.email}?`)) return;
    const { error } = await supabase.from('registrations').update({ status: 'rejected' }).eq('id', r.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Rejected');
    load();
  };

  const remove = async (r: Registration) => {
    if (!confirm('Delete this registration record?')) return;
    await supabase.from('registrations').delete().eq('id', r.id);
    load();
  };

  const filtered = (filter === 'all' ? rows : rows.filter(r => r.status === filter))
    .filter(r => kind === 'all' || (kind === 'booking') === isBooking(r))
    .filter(r => inRange(r.created_at, range));
  const counts = {
    pending: rows.filter(r => r.status === 'pending').length,
    approved: rows.filter(r => r.status === 'approved').length,
    rejected: rows.filter(r => r.status === 'rejected').length,
  };
  const pendingVisible = filtered.filter(r => r.status === 'pending');
  const toggle = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const openFor = (list: Registration[]) => {
    if (!list.length) return;
    // Each booking keeps its own slot on the server; the first one is shown as the example.
    const booked = list.find(r => r.answers?.slot_start)?.answers?.slot_start || null;
    setTarget({ ids: list.map(r => r.id), label: list.length === 1 ? list[0].name || list[0].email : `${list.length} students`, bookedStart: booked });
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-w-0">
        <div className="portal-banner flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6 rounded-2xl bg-primary text-primary-foreground p-5 sm:p-7 shadow-sm">
          <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground/80"><span className="inline-flex size-8 items-center justify-center rounded-2xl bg-primary-foreground/15"><PanelsTopLeft className="size-4" /></span> Administration</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Registrations & bookings</h1>
            <p className="text-sm text-primary-foreground/85 mt-1">
              Slot booking link: <code className="rounded bg-primary-foreground/15 px-2 py-0.5 text-primary-foreground break-all">{window.location.origin}/assessments</code>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/assessments`); toast.success('Slot booking link copied'); }}
                className="copy-chip ml-2 inline-flex items-center gap-1 rounded-lg bg-primary-foreground px-2 py-0.5 text-xs font-semibold text-primary hover:opacity-90">
                <Copy className="w-3 h-3" /> Copy
              </button>
            </p>
            <p className="text-sm text-primary-foreground/85 mt-1">Approve to create the login, allocate a chosen or random test and email the details in one click.</p>
          </div>
          <button onClick={load} className="h-9 px-3 inline-flex items-center gap-2 rounded-xl border text-sm hover:bg-accent">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="mb-6"><AllocationSettingsCard sections={['approval', 'pool', 'booking']} /></div>

        <div className="flex flex-wrap items-center gap-2 mb-4 rounded-2xl border bg-card p-3 shadow-sm">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`h-9 px-3 rounded-xl text-sm font-medium capitalize ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
              {f} {f !== 'all' && <span className="ml-1 opacity-70">({counts[f as keyof typeof counts]})</span>}
            </button>
          ))}
          <select aria-label="Registration type" value={kind} onChange={e => setKind(e.target.value as any)} className="h-9 rounded-xl border bg-background px-2 text-sm">
            <option value="all">All types</option><option value="register">Registrations</option><option value="booking">Slot bookings</option>
          </select>
          <div className="ml-auto flex flex-wrap gap-2">
            <button disabled={!selected.size} onClick={() => openFor(rows.filter(r => selected.has(r.id)))} className="h-9 px-3 inline-flex items-center gap-1 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40">
              <Shuffle className="w-4 h-4" /> Approve selected ({selected.size})
            </button>
          </div>
        </div>

        <div className="mb-3"><DateRangeFilter value={range} onChange={setRange} /></div>
        <div className="bg-card border rounded-2xl overflow-x-auto shadow-sm">
          {loading ? (
            <div className="p-8 flex items-center justify-center"><LogoSpinner size="md" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No registrations.</div>
          ) : (
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-3 py-3 w-8">
                    <input type="checkbox" aria-label="Select all pending" checked={pendingVisible.length > 0 && pendingVisible.every(r => selected.has(r.id))}
                      onChange={e => setSelected(e.target.checked ? new Set(pendingVisible.map(r => r.id)) : new Set())} />
                  </th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Slot / test</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const given = issued[r.id];
                  return (
                  <tr key={r.id} className="border-t hover:bg-muted/40 transition-colors align-top">
                    <td className="px-3 py-3">{r.status === 'pending' && <input type="checkbox" aria-label={`Select ${r.name}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} />}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.name}</div>
                      {r.notes && <div className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{r.notes}</div>}
                      {r.phone && <div className="text-xs text-muted-foreground">{r.phone}</div>}
                    </td>
                    <td className="px-4 py-3">{r.email}</td>
                    <td className="px-4 py-3 text-xs">
                      {isBooking(r) && <div className="flex items-center gap-1 font-medium"><CalendarClock className="w-3 h-3" /> {r.answers?.slot_start ? fmt(r.answers.slot_start) : (r.notes || '').replace(/^Booked for later:\s*/i, '')}</div>}
                      {r.answers?.assigned_exam_title && <div className="text-muted-foreground mt-0.5">Test: {r.answers.assigned_exam_title}{r.answers.assigned_start ? ` · ${fmt(r.answers.assigned_start)}` : ''}</div>}
                      {!isBooking(r) && !r.answers?.assigned_exam_title && <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        r.status === 'approved' ? 'bg-primary/10 text-primary' :
                        r.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                        'bg-warning/10 text-warning'
                      }`}>{r.status}</span>
                      {r.answers?.approved_by === 'auto-approval' && <div className="mt-1 text-[11px] text-muted-foreground">Auto-approved</div>}
                      {r.status === 'pending' && r.answers?.auto_error && <div className="mt-1 max-w-[14rem] text-[11px] text-destructive">Auto-approve failed: {r.answers.auto_error}</div>}
                      {given && (
                        <div className="mt-2 text-xs bg-muted rounded p-2 font-mono">
                          <div>pwd: <strong>{given.password}</strong></div>
                          <div className="font-sans">{given.mailed ? 'Emailed' : 'Not emailed'}</div>
                          <button onClick={() => { navigator.clipboard.writeText(`Login: ${window.location.origin}/exam-login\nEmail: ${r.email}\nPassword: ${given.password}\nTest: ${given.examTitle}`); toast.success('Copied'); }}
                            className="text-primary hover:underline mt-1">Copy credentials</button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'pending' ? (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openFor([r])} className="h-8 px-3 inline-flex items-center gap-1 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90">
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button onClick={() => reject(r)} className="h-8 px-3 inline-flex items-center gap-1 rounded-xl border text-xs font-medium hover:bg-accent">
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          {r.status === 'approved' && <button onClick={() => openFor([r])} className="h-8 px-3 rounded-xl border text-xs hover:bg-accent">Re-send / new test</button>}
                          <button onClick={() => remove(r)} className="h-8 px-3 rounded-xl border text-xs hover:bg-destructive/10 hover:text-destructive">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <ApproveRegistrationsDialog target={target} onClose={() => setTarget(null)} onDone={afterApprove} />
      </div>
    </AdminLayout>
  );
}

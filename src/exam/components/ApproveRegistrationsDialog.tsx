// @ts-nocheck
import { useEffect, useState } from 'react';
import { Check, Copy, Mail, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { fetchKey, fetchSettings, cachedSettings } from '@/exam/lib/codexamSettings';
import { mailRequestHeaders } from '@/exam/lib/mailRequest';
import { ALLOCATION_KEY, normalizeAllocation, DEFAULT_ALLOCATION } from '@/exam/lib/testAllocation';

export type ApproveTarget = { ids?: string[]; clientIds?: string[]; label: string; bookedStart?: string | null };

const toLocalInput = (iso?: string | null) => {
  const d = iso ? new Date(iso) : new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** One-click approval: pick a test (or random), start time and email; the server does the rest. */
export default function ApproveRegistrationsDialog({ target, onClose, onDone }: { target: ApproveTarget | null; onClose: () => void; onDone: (results: any[]) => void }) {
  const { exams } = useAuth();
  const [alloc, setAlloc] = useState(DEFAULT_ALLOCATION);
  const [templates, setTemplates] = useState(cachedSettings().templates || []);
  const [examId, setExamId] = useState('');
  const [startMode, setStartMode] = useState<'booked' | 'now' | 'custom'>('booked');
  const [startAt, setStartAt] = useState(toLocalInput());
  const [windowMinutes, setWindowMinutes] = useState(60);
  const [templateId, setTemplateId] = useState('credentials');
  const [sendEmail, setSendEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  useEffect(() => {
    if (!target) return;
    setResults(null); setExamId('');
    setStartMode(target.bookedStart ? 'booked' : 'now');
    setStartAt(toLocalInput(target.bookedStart));
    fetchKey(ALLOCATION_KEY, null).then(v => { const a = normalizeAllocation(v); setAlloc(a); setWindowMinutes(a.approvalWindowMinutes); setTemplateId(a.approvalTemplateId); });
    fetchSettings().then(g => setTemplates(g.templates || []));
  }, [target]);

  const published = (exams || []).filter(e => e.status !== 'draft');
  const loginUrl = `${window.location.origin}/exam-login`;

  const submit = async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/public/approve-registrations', {
        method: 'POST', headers: await mailRequestHeaders(),
        body: JSON.stringify({
          registrationIds: target.ids || [], clientIds: target.clientIds || [], examId,
          startAt: startMode === 'custom' ? startAt : '', useBookedSlot: startMode === 'booked',
          windowMinutes, sendEmail, templateId, loginUrl, tzOffsetMinutes: -new Date().getTimezoneOffset(),
        }),
      });
      const j = await r.json().catch(() => ({ error: `The server did not answer (status ${r.status}).` }));
      if (!r.ok || j.error) throw new Error(j.error || 'Approval failed');
      setResults(j.results || []);
      const mailed = (j.results || []).filter(x => x.mailed).length;
      if (j.approved) toast.success(`Approved ${j.approved}${sendEmail ? ` · ${mailed} email${mailed === 1 ? '' : 's'} sent` : ''}`);
      const bad = (j.results || []).filter(x => !x.ok);
      if (bad.length) toast.error(bad.map(x => `${x.email}: ${x.error}`).join('\n'));
      if (sendEmail && j.approved && mailed < j.approved) {
        const err = j.mailError || (j.results || []).find(x => x.mailError)?.mailError || '';
        toast.error(/brevo/i.test(err) ? 'Approved, but emails could not be sent: the email service key is missing. Copy the details below and share them.' : `Some emails were not sent. ${err}`);
      }
      onDone(j.results || []);
    } catch (e) { toast.error(e?.message || 'Approval failed'); }
    setBusy(false);
  };

  const fmt = iso => iso ? new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—';
  const copy = x => { navigator.clipboard.writeText(`Login: ${loginUrl}\nEmail: ${x.email}\nPassword: ${x.password}\nTest: ${x.examTitle}\nStart: ${fmt(x.start)} (open for ${x.windowMinutes} min)`); toast.success('Copied'); };

  return (
    <Dialog open={!!target} onOpenChange={o => { if (!o && !busy) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Approve {target?.label}</DialogTitle>
          <DialogDescription>Creates their login, allocates a test and emails the details.</DialogDescription>
        </DialogHeader>
        {results ? (
          <div className="space-y-2">
            {results.map(x => (
              <div key={x.id} className="rounded-xl border p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><p className="font-medium truncate">{x.name || x.email}</p><p className="text-xs text-muted-foreground truncate">{x.email}</p></div>
                  {x.ok ? <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${x.mailed ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{x.mailed ? 'Emailed' : 'Not emailed'}</span>
                    : <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">Failed</span>}
                </div>
                {x.ok ? <>
                  <p className="mt-2 text-xs">Test: <strong>{x.examTitle}</strong> · starts {fmt(x.start)} · open {x.windowMinutes} min</p>
                  <p className="mt-1 font-mono text-xs">Password: <strong>{x.password}</strong></p>
                  {x.mailError && <p className="mt-1 text-xs text-destructive">{x.mailError}</p>}
                  <button type="button" onClick={() => copy(x)} className="mt-2 inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-xs hover:bg-accent"><Copy className="h-3 w-3" /> Copy details</button>
                </> : <p className="mt-1 text-xs text-destructive">{x.error}</p>}
              </div>
            ))}
            <button type="button" onClick={onClose} className="mt-2 h-10 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground">Done</button>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block text-sm font-medium">Test
              <select aria-label="Test to allocate" value={examId} onChange={e => setExamId(e.target.value)} className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm">
                <option value="">Random test{alloc.poolMode === 'selected' ? ' (from your pool)' : ''}</option>
                {published.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </label>
            <div className="text-sm font-medium">Start time
              <div className="mt-1 flex flex-wrap gap-2">
                {target?.bookedStart && <button type="button" onClick={() => setStartMode('booked')} className={`h-8 rounded-xl border px-3 text-xs ${startMode === 'booked' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>Booked slot ({fmt(target.bookedStart)})</button>}
                <button type="button" onClick={() => setStartMode('now')} className={`h-8 rounded-xl border px-3 text-xs ${startMode === 'now' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>Right now</button>
                <button type="button" onClick={() => setStartMode('custom')} className={`h-8 rounded-xl border px-3 text-xs ${startMode === 'custom' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>Pick a time</button>
              </div>
              {startMode === 'custom' && <input aria-label="Custom start time" type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} className="mt-2 h-10 w-full rounded-xl border bg-background px-3 text-sm" />}
              {startMode === 'booked' && !target?.bookedStart && <p className="mt-1 text-xs text-muted-foreground">Booked slots that already passed start right away.</p>}
            </div>
            <label className="flex items-center justify-between gap-3 text-sm font-medium">Start window (minutes)
              <input aria-label="Start window minutes" type="number" min={5} max={10080} value={windowMinutes} onChange={e => setWindowMinutes(Number(e.target.value))} className="h-10 w-28 rounded-xl border bg-background px-3 text-sm" />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm font-medium"><span className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email login details</span><Switch aria-label="Email login details" checked={sendEmail} onCheckedChange={setSendEmail} /></label>
            {sendEmail && <label className="block text-sm font-medium">Email template
              <select aria-label="Email template" value={templateId} onChange={e => setTemplateId(e.target.value)} className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm">
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>}
            <button type="button" onClick={submit} disabled={busy} className="h-11 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {examId ? <Check className="h-4 w-4" /> : <Shuffle className="h-4 w-4" />}{busy ? 'Approving…' : examId ? 'Approve & allocate this test' : 'Approve & allocate a random test'}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

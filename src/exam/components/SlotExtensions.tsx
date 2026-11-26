// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { Clock, RotateCcw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchSlots, saveKey } from '@/exam/lib/codexamSettings';
import { toast } from 'sonner';
import { fetchKey } from '@/exam/lib/codexamSettings';
import { REQ_KEY } from '@/exam/components/RequestExtension';
import { grantInstantAccess } from '@/exam/lib/instantAccess';
import { examAvailability } from '@/exam/lib/examAvailability';

/** Lets the admin give more time to students whose personal start window has passed. */
export default function SlotExtensions({ students, exams }) {
  const [slots, setSlots] = useState({});
  const [q, setQ] = useState('');
  const [show, setShow] = useState<'missed' | 'all'>('missed');
  const [reopenMin, setReopenMin] = useState(30);
  const [now, setNow] = useState(Date.now());
  const [reqs, setReqs] = useState([]);
  const [examId, setExamId] = useState('');
  const [studentId, setStudentId] = useState('all');
  const [granting, setGranting] = useState(false);
  const grant = async () => {
    setGranting(true);
    try {
      if (!exams.some(e => e.id === examId && e.status !== 'draft')) throw new Error('Select a published test');
      const ids = studentId === 'all' ? students.map(s => s.id) : [studentId];
      const latest = await fetchSlots();
      const next = grantInstantAccess(latest, ids, examId, Number(reopenMin), new Date().toISOString());
      await saveKey('student_exam_slots', next); setSlots(next);
      toast.success(`Instant access granted to ${ids.length} student(s)`);
    } catch (e) { toast.error(e?.message || 'Could not grant access'); }
    finally { setGranting(false); }
  };
  useEffect(() => { fetchKey(REQ_KEY, []).then(r => setReqs(Array.isArray(r) ? r : [])); }, []);
  const resolve = async (sid, eid) => { const latest = await fetchKey(REQ_KEY, []); const next = latest.map(r => r.sid === sid && r.eid === eid ? { ...r, status: 'done' } : r); try { await saveKey(REQ_KEY, next); setReqs(next); window.dispatchEvent(new Event('extension-requests-changed')); } catch { toast.error('Could not resolve request'); } };
  useEffect(() => { fetchSlots().then(setSlots); const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

  const rows = useMemo(() => {
    const out = [];
    for (const [sid, m] of Object.entries(slots || {})) {
      const st = students.find(x => x.id === sid);
      for (const [eid, sl] of Object.entries(m || {})) {
        const ex = exams.find(x => x.id === eid);
        const startIso = sl?.start || ex?.scheduledAt;
        const start = startIso ? new Date(startIso).getTime() : null;
        const end = start && sl?.buffer > 0 ? start + sl.buffer * 60000 : null;
        const availability = ex ? examAvailability(ex, now, sl) : { state: 'unavailable' };
        const state = availability.state === 'closed' ? 'missed' : availability.state === 'before' ? 'upcoming' : availability.state === 'open' ? 'open' : 'unavailable';
        out.push({ sid, eid, name: st?.name || sid, email: st?.email || '', exam: ex?.title || eid, start, end, state, slot: sl });
      }
    }
    return out
      .filter(r => (show === 'all' || r.state === 'missed') && `${r.name} ${r.email} ${r.exam}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (b.end || 0) - (a.end || 0));
  }, [slots, students, exams, q, show, now]);

  const write = async (sid, eid, patch, msg) => {
    const next = { ...slots, [sid]: { ...(slots[sid] || {}), [eid]: { ...(slots[sid]?.[eid] || {}), ...patch } } };
    try { await saveKey('student_exam_slots', next); setSlots(next); toast.success(msg); if (reqs.some(r => r.sid === sid && r.eid === eid && r.status === 'pending')) resolve(sid, eid); } catch (e) { toast.error(e?.message || 'Could not save'); }
  };
  const extend = (r, mins) => write(r.sid, r.eid, { buffer: Number(r.slot?.buffer || 0) + mins }, `${r.name}: window extended by ${mins} min`);
  const reopen = r => {
    const m = Math.max(5, Number(reopenMin) || 30);
    write(r.sid, r.eid, { start: new Date().toISOString(), buffer: m }, `${r.name} can start “${r.exam}” in the next ${m} min`);
  };
  const fmt = t => t ? new Date(t).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—';
  const badge = { missed: 'bg-destructive/10 text-destructive', open: 'bg-primary/10 text-primary', upcoming: 'bg-muted text-muted-foreground' };

  const pending = reqs.filter(r => r.status === 'pending');
  return (
    <div>
      <section className="mb-6 border-b pb-5 space-y-3">
        <h3 className="text-lg font-semibold">Instant access</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <select aria-label="Instant access test" value={examId} onChange={e => setExamId(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">Select test</option>{exams.filter(e => e.status !== 'draft').map(e => <option key={e.id} value={e.id}>{e.title}</option>)}</select>
          <select aria-label="Instant access student" value={studentId} onChange={e => setStudentId(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="all">All students</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        </div>
        <label className="flex items-center gap-3 text-sm">Start buffer (minutes)<input aria-label="Instant access buffer" type="number" min={5} max={1440} value={reopenMin} onChange={e => setReopenMin(Number(e.target.value))} className="h-10 w-24 rounded-md border bg-background px-3" /></label>
        <Button onClick={grant} disabled={granting || !examId || !students.length}><RotateCcw className="mr-2 h-4 w-4" />{granting ? 'Granting…' : 'Grant instant access'}</Button>
      </section>
      {pending.length > 0 && <div className="mb-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm"><p className="font-semibold text-primary">{pending.length} extension request{pending.length > 1 ? 's' : ''}</p>
        <ul className="mt-1 space-y-1">{pending.map(r => <li key={r.sid + r.eid} className="flex flex-wrap items-center gap-2"><span className="font-medium">{r.name || r.sid}</span><span className="text-muted-foreground">· {r.exam}{r.reason ? ` — “${r.reason}”` : ''}</span><button className="ml-auto text-xs text-muted-foreground underline" onClick={() => resolve(r.sid, r.eid)}>Dismiss</button></li>)}</ul></div>}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <select value={show} onChange={e => setShow(e.target.value)} className="h-9 rounded-lg border bg-background px-2 text-sm">
          <option value="missed">Missed their window</option><option value="all">All personal start times</option>
        </select>
        <input placeholder="Search student or test…" value={q} onChange={e => setQ(e.target.value)} className="h-9 flex-1 min-w-[160px] px-3 rounded-lg border bg-background text-sm" />
        <span className="text-xs text-muted-foreground">Reopen for</span>
        <input type="number" min={5} value={reopenMin} onChange={e => setReopenMin(Number(e.target.value))} className="w-20 h-9 px-2 rounded-lg border bg-background text-sm" aria-label="Reopen minutes" />
        <span className="text-xs text-muted-foreground">min</span>
      </div>
      <div className="max-h-80 overflow-auto rounded-xl border divide-y">
        {rows.map(r => (
          <div key={r.sid + r.eid} className="flex flex-wrap items-center gap-2 p-3 text-sm">
            <div className="flex-1 min-w-[180px]">
              <p className="font-medium">{r.name} <span className="text-xs text-muted-foreground">· {r.exam}</span></p>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {fmt(r.start)} → {r.end ? fmt(r.end) : 'no end'}</p>
            </div>
            {reqs.some(x => x.sid === r.sid && x.eid === r.eid && x.status === 'pending') && <span title={reqs.find(x => x.sid === r.sid && x.eid === r.eid)?.reason || ''} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">Requested more time</span>}
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge[r.state] || 'bg-muted text-muted-foreground'}`}>{r.state === 'missed' ? 'Expired' : r.state === 'open' ? 'Open now' : r.state === 'upcoming' ? 'Upcoming' : 'Unavailable'}</span>
            {[15, 30, 60].map(m => <Button key={m} size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => extend(r, m)}><Plus className="w-3 h-3" />{m} min</Button>)}
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => reopen(r)}><RotateCcw className="w-3 h-3" /> Reopen now</Button>
          </div>
        ))}
        {!rows.length && <p className="p-6 text-center text-sm text-muted-foreground">{show === 'missed' ? 'No one has missed their start window.' : 'No personal start times yet.'}</p>}
      </div>
    </div>
  );
}

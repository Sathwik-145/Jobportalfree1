// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { addDays, format, parseISO, eachDayOfInterval } from 'date-fns';
import { CalendarDays, Wand2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/db-client';
import { readCompletedExams } from '@/exam/lib/dailyAssignments';

/** Plans a different test per day for each student (sch.dailyPlan[studentId][yyyy-MM-dd] = examId). */
export default function DailyPlanner({ sch, setSch, students, exams, contacts }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const pool = sch.recipients === 'selected' ? students.filter(s => sch.studentIds.includes(s.id)) : students;
  const [sid, setSid] = useState(pool[0]?.id || '');
  const [rotation, setRotation] = useState<string[]>([]);
  const plan = sch.dailyPlan || {};
  const [completed, setCompleted] = useState<Record<string, Set<string>>>({});
  useEffect(() => {
    readCompletedExams(supabase, exams, pool.map(s => s.id)).then(setCompleted).catch(console.error);
  }, [exams, students, sch.recipients, sch.studentIds]);
  const eligible = studentId => exams.filter(ex => ex.status !== 'draft' && !completed[studentId]?.has(ex.id));

  const days = useMemo(() => {
    if (sch.frequency === 'range' && sch.rangeFrom) {
      const to = sch.rangeTo || sch.rangeFrom;
      try { return eachDayOfInterval({ start: parseISO(sch.rangeFrom), end: parseISO(to) }).map(d => format(d, 'yyyy-MM-dd')).slice(0, 60); } catch { return []; }
    }
    if (sch.frequency === 'dates') return [...(sch.dates || [])].sort();
    return Array.from({ length: 14 }, (_, i) => format(addDays(new Date(), i), 'yyyy-MM-dd'));
  }, [sch.frequency, sch.rangeFrom, sch.rangeTo, sch.dates]);
  const upcoming = days.filter(d => d >= today).slice(0, 5);

  const listFor = (studentId, day) => { const v = plan[studentId]?.[day]; return Array.isArray(v) ? v : v ? [v] : []; };
  const toggleDay = (studentId, day, examId) => {
    const p = { ...(plan[studentId] || {}) };
    const cur = listFor(studentId, day);
    const next = cur.includes(examId) ? cur.filter(x => x !== examId) : [...cur, examId];
    if (next.length) p[day] = next; else delete p[day];
    setSch({ ...sch, dailyPlan: { ...plan, [studentId]: p } });
  };
  const fillRotation = () => {
    if (!sid || !rotation.length) return;
    const p = {};
    const available = rotation.filter(id => eligible(sid).some(ex => ex.id === id));
    days.filter(d => d >= today).forEach((d, i) => { if (available[i]) p[d] = available[i]; });
    setSch({ ...sch, dailyPlan: { ...plan, [sid]: p } });
  };
  const copyToAll = () => {
    if (!sid) return;
    const next = { ...plan };
    pool.forEach(s => { next[s.id] = { ...(plan[sid] || {}) }; });
    setSch({ ...sch, dailyPlan: next });
  };
  const fillUnsubmitted = () => {
    const next = { ...plan };
    pool.forEach(s => {
      const available = eligible(s.id);
      const p = { ...(plan[s.id] || {}) };
      days.filter(d => d >= today).forEach((d, i) => { if (available[i]) p[d] = [available[i].id]; else delete p[d]; });
      next[s.id] = p;
    });
    setSch({ ...sch, dailyPlan: next });
  };
  const title = id => exams.find(e => e.id === id)?.title || '—';
  const planned = pool.filter(s => Object.keys(plan[s.id] || {}).some(d => upcoming.includes(d)));
  const titles = (studentId, d) => listFor(studentId, d).map(title).join(', ');

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-3 min-w-0">
      <p className="text-xs font-semibold flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-primary" /> Different test every day</p>
      <Button type="button" size="sm" variant="outline" onClick={fillUnsubmitted} disabled={!pool.length || !Object.keys(completed).length}><Wand2 className="w-4 h-4" />Assign unsubmitted tests to all {sch.recipients === 'selected' ? 'selected ' : ''}students</Button>
      <p className="text-[11px] text-muted-foreground">Tap one or more tests per day. Each scheduled day, the student gets that day's tests by email (with the date & start time) and it is assigned automatically.</p>
      <select value={sid} onChange={e => setSid(e.target.value)} className="w-full h-9 rounded-lg border bg-background px-2 text-sm">
        <option value="">— Choose student —</option>
        {pool.map(s => <option key={s.id} value={s.id}>{s.name} · {contacts[s.id] || s.email}</option>)}
      </select>
      {sid && (
        <>
          <div>
            <p className="text-[11px] font-medium mb-1">Quick fill: pick tests in order, they rotate day by day</p>
            <div className="flex flex-wrap gap-1">
              {eligible(sid).map(ex => {
                const i = rotation.indexOf(ex.id);
                return (
                  <button key={ex.id} type="button" onClick={() => setRotation(r => i >= 0 ? r.filter(x => x !== ex.id) : [...r, ex.id])}
                    className={`min-h-7 h-auto max-w-full whitespace-normal text-left py-1 px-2 rounded-full border text-[11px] ${i >= 0 ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}>
                    {i >= 0 ? `${i + 1}. ` : ''}{ex.title}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <button type="button" onClick={fillRotation} disabled={!rotation.length} className="h-8 px-2 rounded-lg bg-primary text-primary-foreground text-xs inline-flex items-center gap-1 disabled:opacity-40"><Wand2 className="w-3.5 h-3.5" /> Fill all days</button>
              <button type="button" onClick={copyToAll} className="h-8 px-2 rounded-lg border text-xs inline-flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copy plan to all {sch.recipients === 'selected' ? 'selected' : ''} students</button>
            </div>
          </div>
          <div className="max-h-56 overflow-auto rounded-lg border bg-background divide-y">
            {days.length === 0 && <p className="p-2 text-xs text-muted-foreground">Pick dates or a date range first.</p>}
            {days.map(d => (
              <div key={d} className={`flex flex-col items-start sm:flex-row sm:items-center gap-2 px-2 py-1.5 text-xs ${d < today ? 'opacity-50' : ''}`}>
                <span className="w-28 font-medium">{format(parseISO(d), 'EEE, d MMM')}</span>
                <div className="min-w-0 flex-1 flex flex-wrap gap-1">
                  {eligible(sid).map(ex => { const on = listFor(sid, d).includes(ex.id); return (
                    <button key={ex.id} type="button" onClick={() => toggleDay(sid, d, ex.id)}
                      className={`min-h-6 h-auto max-w-full whitespace-normal text-left py-1 px-2 rounded-full border text-[10px] ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground'}`}>{ex.title}</button>
                  ); })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Upcoming 5 days</p>
        {planned.length === 0 ? <p className="text-xs text-muted-foreground">Nothing planned yet.</p> : (
          <div className="overflow-auto rounded-lg border bg-background">
            <table className="w-full text-[11px]">
              <thead className="bg-muted/60"><tr><th className="p-1.5 text-left">Student</th>{upcoming.map(d => <th key={d} className="p-1.5 text-left whitespace-nowrap">{format(parseISO(d), 'EEE d')}</th>)}</tr></thead>
              <tbody>
                {planned.map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="p-1.5 font-medium whitespace-nowrap">{s.name}</td>
                    {upcoming.map(d => <td key={d} className="p-1.5 whitespace-nowrap">{listFor(s.id, d).length ? titles(s.id, d) : <span className="text-muted-foreground">—</span>}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

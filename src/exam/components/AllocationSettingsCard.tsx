// @ts-nocheck
import { useEffect, useState } from 'react';
import { Save, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { fetchKey, saveKey, cachedSettings, fetchSettings } from '@/exam/lib/codexamSettings';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { ALLOCATION_KEY, normalizeAllocation, DEFAULT_ALLOCATION, type AllocationSettings } from '@/exam/lib/testAllocation';

/** Admin-editable rules for quick start, approvals and slot bookings. */
export default function AllocationSettingsCard({ sections = ['quick', 'approval', 'pool', 'booking'] }: { sections?: Array<'quick' | 'approval' | 'pool' | 'booking'> }) {
  const { exams } = useAuth();
  const [s, setS] = useState<AllocationSettings>(DEFAULT_ALLOCATION);
  const [templates, setTemplates] = useState(cachedSettings().templates || []);
  const [saving, setSaving] = useState(false);
  const [slotsText, setSlotsText] = useState(DEFAULT_ALLOCATION.bookingSlots.join(', '));

  useEffect(() => {
    fetchKey(ALLOCATION_KEY, null).then(v => { const n = normalizeAllocation(v); setS(n); setSlotsText(n.bookingSlots.join(', ')); });
    fetchSettings().then(g => setTemplates(g.templates || []));
  }, []);

  const set = (patch: Partial<AllocationSettings>) => setS(p => ({ ...p, ...patch }));
  const published = (exams || []).filter(e => e.status === 'active' || e.status === 'scheduled');
  const save = async () => {
    setSaving(true);
    try {
      const next = normalizeAllocation({ ...s, bookingSlots: slotsText.split(',').map(x => x.trim()).filter(Boolean) });
      if (next.poolMode === 'selected' && !next.poolExamIds.length) throw new Error('Pick at least one test for the random pool');
      await saveKey(ALLOCATION_KEY, next);
      setS(next); setSlotsText(next.bookingSlots.join(', '));
      toast.success('Test allocation settings saved');
    } catch (e) { toast.error(e?.message || 'Could not save'); }
    setSaving(false);
  };
  const num = (k: keyof AllocationSettings, label: string, min: number, max: number) => (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <input aria-label={label} type="number" min={min} max={max} value={s[k] as number} onChange={e => set({ [k]: Number(e.target.value) } as any)} className="h-9 w-24 rounded-lg border bg-background px-2 text-sm" />
    </label>
  );
  const toggle = (k: keyof AllocationSettings, label: string) => (
    <label className="flex items-center justify-between gap-3 text-sm"><span>{label}</span><Switch aria-label={label} checked={!!s[k]} onCheckedChange={v => set({ [k]: v } as any)} /></label>
  );

  return (
    <div className="rounded-3xl border bg-card p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2"><Shuffle className="h-4 w-4 text-primary" /> Test allocation settings</h2>
          <p className="text-xs text-muted-foreground">Controls quick start, one-click approvals and slot bookings.</p>
        </div>
        <button type="button" onClick={save} disabled={saving} className="h-9 px-3 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save'}</button>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {sections.includes('quick') && <section className="space-y-3 rounded-2xl border p-4">
          <h3 className="text-sm font-semibold">Quick start</h3>
          {toggle('quickStartEnabled', 'Quick start page is open')}
          {num('quickStartWindowMinutes', 'Minutes to begin after signing up', 5, 1440)}
          {toggle('quickStartShowResults', 'Show their score on screen after submitting')}
          {num('maxTabSwitches', 'Tab switches allowed for new students', 1, 50)}
        </section>}
        {sections.includes('approval') && <section className="space-y-3 rounded-2xl border p-4">
          <h3 className="text-sm font-semibold">Approvals</h3>
          {num('approvalWindowMinutes', 'Default start window (minutes)', 5, 10080)}
          <label className="flex items-center justify-between gap-3 text-sm"><span>Default email</span>
            <select aria-label="Default approval email" value={s.approvalTemplateId} onChange={e => set({ approvalTemplateId: e.target.value })} className="h-9 max-w-[60%] rounded-lg border bg-background px-2 text-sm">
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
        </section>}
        {sections.includes('pool') && <section className="space-y-3 rounded-2xl border p-4 md:col-span-2">
          <h3 className="text-sm font-semibold">Random test pool</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            {(['all', 'selected'] as const).map(m => (
              <button key={m} type="button" onClick={() => set({ poolMode: m })} className={`h-8 px-3 rounded-xl border text-xs font-medium ${s.poolMode === m ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>{m === 'all' ? 'Any published test' : 'Only the tests I pick'}</button>
            ))}
          </div>
          {s.poolMode === 'selected' && (
            <div className="grid gap-2 sm:grid-cols-2 max-h-56 overflow-auto rounded-xl border p-3">
              {published.length === 0 && <p className="text-xs text-muted-foreground">No published tests yet.</p>}
              {published.map(e => (
                <label key={e.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={s.poolExamIds.includes(e.id)} onChange={ev => set({ poolExamIds: ev.target.checked ? [...s.poolExamIds, e.id] : s.poolExamIds.filter(x => x !== e.id) })} />
                  <span className="truncate">{e.title}</span>
                </label>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Only active or scheduled tests with at least one question are picked.</p>
        </section>}
        {sections.includes('booking') && <section className="space-y-3 rounded-2xl border p-4 md:col-span-2">
          <h3 className="text-sm font-semibold">Slot booking (assessments page)</h3>
          {toggle('bookingEnabled', 'Students can book a slot')}
          {num('bookingDays', 'Days shown ahead', 1, 60)}
          {toggle('bookingSkipSundays', 'Skip Sundays')}
          <label className="block text-sm">Time slots (comma separated)
            <input aria-label="Booking time slots" value={slotsText} onChange={e => setSlotsText(e.target.value)} className="mt-1 h-9 w-full rounded-lg border bg-background px-2 text-sm" placeholder="09:00 AM, 02:00 PM" />
          </label>
          <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
            <label className="flex items-center justify-between gap-3 text-sm font-medium"><span>Approve bookings automatically</span>
              <Switch aria-label="Approve bookings automatically" checked={s.bookingAutoApprove} onCheckedChange={v => set({ bookingAutoApprove: v, bookingAutoSince: v ? (s.bookingAutoSince || Date.now()) : null })} />
            </label>
            {s.bookingAutoApprove && <>
              <div className="text-sm">Send login details
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {[[0, 'Immediately'], [5, 'After 5 min']].map(([m, l]) => (
                    <button key={m} type="button" onClick={() => set({ bookingAutoDelayMinutes: m as number })} className={`h-8 px-3 rounded-xl border text-xs font-medium ${s.bookingAutoDelayMinutes === m ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>{l}</button>
                  ))}
                  <label className="flex items-center gap-2 text-xs">or after
                    <input aria-label="Minutes before automatic approval" type="number" min={0} max={10080} value={s.bookingAutoDelayMinutes} onChange={e => set({ bookingAutoDelayMinutes: Math.max(0, Number(e.target.value) || 0) })} className="h-8 w-20 rounded-lg border bg-background px-2 text-sm" /> minutes
                  </label>
                </div>
              </div>
              <label className="flex items-center justify-between gap-3 text-sm"><span>Test to allocate</span>
                <select aria-label="Test for automatic approval" value={s.bookingAutoExamId} onChange={e => set({ bookingAutoExamId: e.target.value })} className="h-9 max-w-[60%] rounded-lg border bg-background px-2 text-sm">
                  <option value="">Random test from the pool</option>
                  {published.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </label>
              {toggle('bookingAutoSendEmail', 'Email login, password and timing')}
              <p className="text-xs text-muted-foreground">Uses the default start window and email above. The test opens at the booked slot. Bookings made before you switched this on still need a manual approve. Delays are checked every few minutes by the scheduled email check.</p>
            </>}
          </div>
        </section>}
      </div>
    </div>
  );
}

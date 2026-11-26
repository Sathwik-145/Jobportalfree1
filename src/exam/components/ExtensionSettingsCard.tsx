import { useEffect, useState } from 'react';
import { fetchKey, saveKey, fetchSlots } from '@/exam/lib/codexamSettings';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

type Request = { sid: string; eid: string; name: string; exam: string; reason: string; at: string; status: string };
export default function ExtensionSettingsCard() {
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const load = async () => {
    const [settings, list] = await Promise.all([fetchKey('extension_requests', { enabled: true }), fetchKey<Request[]>('slot_extension_requests', [])]);
    setEnabled(settings.enabled !== false); setRequests(Array.isArray(list) ? list : []); setLoaded(true);
  };
  useEffect(() => { void load(); const timer = setInterval(load, 15000); return () => clearInterval(timer); }, []);
  const toggle = async (value: boolean) => {
    setBusy(true);
    try { await saveKey('extension_requests', { enabled: value }); setEnabled(value); toast.success('Extension settings saved'); }
    catch { toast.error('Could not save settings'); } finally { setBusy(false); }
  };
  const resolve = async (request: Request, approve: boolean) => {
    setBusy(true);
    try {
      if (approve) {
        const slots = await fetchSlots();
        await saveKey('student_exam_slots', { ...slots, [request.sid]: { ...slots[request.sid], [request.eid]: { start: new Date().toISOString(), buffer: 30 } } });
      }
      const latest = await fetchKey<Request[]>('slot_extension_requests', []);
      await saveKey('slot_extension_requests', latest.map(r => r.sid === request.sid && r.eid === request.eid && r.at === request.at ? { ...r, status: approve ? 'approved' : 'done' } : r));
      window.dispatchEvent(new Event('extension-requests-changed'));
      await load(); toast.success(approve ? 'Approved: student can start within 30 minutes' : 'Request resolved');
    } catch { toast.error('Could not update request'); } finally { setBusy(false); }
  };
  const pending = requests.filter(r => r.status === 'pending');
  return <section className="mb-6 rounded-2xl border bg-card p-5 space-y-4">
    <div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">Extension requests</h2><label htmlFor="extension-requests-toggle" className="text-sm text-muted-foreground">Allow students to request extensions</label></div><Switch id="extension-requests-toggle" checked={enabled} disabled={!loaded || busy} onCheckedChange={toggle} /></div>
    <p className="text-sm text-muted-foreground">{pending.length} pending · Approval reopens the start window for 30 minutes.</p>
    {pending.map(r => <div key={`${r.sid}:${r.eid}:${r.at}`} className="rounded-xl border p-3 space-y-2"><p className="text-sm font-medium">{r.name} · {r.exam}</p><p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.reason || 'No reason provided'}</p><p className="text-xs text-muted-foreground">{new Date(r.at).toLocaleString()}</p><div className="flex gap-2"><Button size="sm" disabled={busy} onClick={() => resolve(r, true)}>Approve · 30 min</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => resolve(r, false)}>Resolve</Button></div></div>)}
  </section>;
}

// @ts-nocheck
import "@/exam/exam-student.css";
import { useEffect, useState } from 'react';
import { Hourglass, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchKey, saveKey } from '@/exam/lib/codexamSettings';
import { toast } from 'sonner';

export const REQ_KEY = 'slot_extension_requests';

/** Student-side button: asks the admin for more time after the personal start window closes. */
export default function RequestExtension({ studentId, studentName, examId, examTitle }) {
  const [state, setState] = useState<'idle' | 'sent' | 'busy'>('idle');
  const [enabled, setEnabled] = useState(false);
  useEffect(() => { const load = () => fetchKey('extension_requests', { enabled: true }).then(s => setEnabled(s.enabled !== false)); load(); const timer = setInterval(load, 15000); return () => clearInterval(timer); }, []);
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState(false);
  useEffect(() => {
    fetchKey(REQ_KEY, []).then(list => { if ((list || []).some(r => r.sid === studentId && r.eid === examId && r.status === 'pending')) setState('sent'); });
  }, [studentId, examId]);
  const send = async () => {
    setState('busy');
    try {
      const settings = await fetchKey('extension_requests', { enabled: true });
      if (settings.enabled === false) { setEnabled(false); setState('idle'); return; }
      const list = await fetchKey(REQ_KEY, []);
      const at = new Date().toISOString();
      const next = [...(list || []).filter(r => !(r.sid === studentId && r.eid === examId)), { sid: studentId, name: studentName, eid: examId, exam: examTitle, reason: reason.trim().slice(0, 300), at, status: 'pending' }];
      await saveKey(REQ_KEY, next);
      setState('sent'); setOpen(false); toast.success('Request sent to the admin');
      try {
        const response = await fetch('/api/public/extension-request-mail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, examId, at }) });
        if (!response.ok) throw new Error();
      } catch { toast.warning('Request saved; email notification could not be delivered.'); }
    } catch (e) { setState('idle'); toast.error('Could not send the request'); }
  };
  if (!enabled) return null;
  if (state === 'sent') return <p className="exam-student mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary"><CheckCircle2 className="w-4 h-4" /> Extension requested — the admin will review it.</p>;
  return open ? (
    <div className="mt-3 space-y-2">
      <textarea maxLength={300} value={reason} onChange={e => setReason(e.target.value)} placeholder="Why did you miss the window? (optional)" rows={2} className="w-full rounded-lg border bg-background p-2 text-sm" />
      <div className="flex gap-2"><Button size="sm" onClick={send} disabled={state === 'busy'}>Send request</Button><Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
    </div>
  ) : (
    <Button size="sm" variant="outline" className="mt-3" onClick={() => setOpen(true)}><Hourglass className="w-4 h-4" /> Request extension</Button>
  );
}

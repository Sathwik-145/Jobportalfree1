import ExtensionSettingsCard from '@/exam/components/ExtensionSettingsCard';
import { PanelsTopLeft } from 'lucide-react';
// @ts-nocheck
import { useEffect, useState } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { Bell, Send, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminNotification, createNotification, fetchNotifications, deleteNotification,
} from '@/exam/lib/supabase-helpers';

const DURATIONS = [
  { label: '5 seconds', value: 5 },
  { label: '10 seconds', value: 10 },
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '5 minutes', value: 300 },
  { label: 'Permanent', value: 0 },
];

export default function Notifications() {
  const { students = [] } = useAuth();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'specific'>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [duration, setDuration] = useState(10);
  const [busy, setBusy] = useState(false);

  const load = () => fetchNotifications().then(d => setItems(Array.isArray(d) ? d : [])).catch(console.error);
  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, []);

  const send = async () => {
    if (!message.trim()) { toast.error('Enter a message'); return; }
    if (target === 'specific' && selected.length === 0) { toast.error('Select at least one student'); return; }
    setBusy(true);
    try {
      await createNotification({
        message: message.trim(), target, targetStudentIds: target === 'specific' ? selected : [],
        durationSeconds: duration === 0 ? null : duration,
      });
      toast.success('Notification sent live to students');
      setMessage(''); setSelected([]); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    try { await deleteNotification(id); toast.success('Deleted'); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const toggle = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto min-w-0">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground/80"><span className="inline-flex size-8 items-center justify-center rounded-2xl bg-primary-foreground/15"><PanelsTopLeft className="size-4" /></span> Administration</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2"><Bell className="w-6 h-6 text-primary" /> Live Notifications</h1>
        <p className="text-muted-foreground text-sm mb-6">Broadcast live messages to students during exams</p>

        <ExtensionSettingsCard />

        <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-sm mb-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
              placeholder="e.g. 10 minutes remaining, please review your answers."
              className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Target</label>
              <select value={target} onChange={e => setTarget(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border bg-background text-sm">
                <option value="all">All students</option>
                <option value="specific">Specific students</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Visible for</label>
              <select value={duration} onChange={e => setDuration(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border bg-background text-sm">
                {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          {target === 'specific' && (
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Select students ({selected.length})
              </label>
              <div className="border rounded-xl max-h-48 overflow-y-auto p-2 space-y-1">
                {students.map(s => (
                  <label key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm">
                    <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
                    <span className="flex-1">{s.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{s.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button onClick={send} disabled={busy}
            className="w-full h-10 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> {busy ? 'Sending...' : 'Send Notification'}
          </button>
        </div>

        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Recent</h2>
        <div className="space-y-2">
          {(items || []).length === 0 ? (
            <p className="text-center p-8 bg-card border rounded-2xl text-muted-foreground text-sm">No notifications yet.</p>
          ) : (items || []).map(n => {
            const expired = n.expires_at && new Date(n.expires_at).getTime() < Date.now();
            const targetIds = Array.isArray(n.target_student_ids) ? n.target_student_ids : [];
            return (
              <div key={n.id} className={`bg-card border rounded-2xl p-4 flex items-start justify-between gap-3 ${expired ? 'opacity-60' : ''}`}>
                <div className="flex-1">
                  <p className="text-sm">{n.message}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 bg-muted rounded-full">{n.target === 'all' ? 'All students' : `${targetIds.length} student(s)`}</span>
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                    {expired && <span className="text-destructive">Expired</span>}
                  </div>
                </div>
                <button onClick={() => remove(n.id)} className="p-1.5 hover:bg-destructive/10 rounded-xl">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

// @ts-nocheck
import "@/exam/exam-student.css";
import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { AdminNotification, fetchNotificationsForStudent } from '@/exam/lib/supabase-helpers';

interface Props { studentId: string }

export default function NotificationBanner({ studentId }: Props) {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    const load = () => fetchNotificationsForStudent(studentId)
      .then(d => { if (mounted) setItems(d); })
      .catch(console.error);
    load();
    const i = setInterval(load, 2000);
    return () => { mounted = false; clearInterval(i); };
  }, [studentId]);

  const visible = items.filter(n => !dismissed.has(n.id));
  if (visible.length === 0) return null;

  return (
    <div className="exam-student fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {visible.slice(0, 3).map(n => (
        <div key={n.id} className="pointer-events-auto bg-primary text-primary-foreground rounded-xl shadow-2xl p-4 flex items-start gap-3 animate-in slide-in-from-right">
          <Bell className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Admin Notice</p>
            <p className="text-sm whitespace-pre-wrap">{n.message}</p>
          </div>
          <button onClick={() => setDismissed(p => new Set(p).add(n.id))}
            className="opacity-70 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

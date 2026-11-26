import { PanelsTopLeft } from 'lucide-react';
// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { fetchFeedback, deleteFeedback } from '@/exam/lib/supabase-helpers';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { Star, MessageSquare, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import DateRangeFilter, { inRange, type DateRange } from "@/components/DateRangeFilter";


export default function Feedback() {
  const { students, exams } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });

  const load = async () => {
    let remote: any[] = [];
    try { remote = await fetchFeedback(); } catch {}
    let local: any[] = [];
    try { local = JSON.parse(localStorage.getItem('codexam_feedback_local') || '[]'); } catch {}
    const seen = new Set(remote.map((r: any) => r.id));
    const merged = [...remote, ...local.filter((l: any) => !seen.has(l.id))]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setItems(merged);
  };
  useEffect(() => {
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, []);

  const avgRating = useMemo(() => items.length ? (items.reduce((a, x) => a + x.rating, 0) / items.length).toFixed(1) : '0', [items]);

  const studentName = (id: string) => students.find(s => s.id === id)?.name || id;
  const examTitle = (id: string) => exams.find(e => e.id === id)?.title || id;

  const remove = async (id: string) => {
    if (!confirm('Delete this feedback?')) return;
    try {
      if (id.startsWith('fb_')) {
        const local = JSON.parse(localStorage.getItem('codexam_feedback_local') || '[]');
        localStorage.setItem('codexam_feedback_local', JSON.stringify(local.filter((l: any) => l.id !== id)));
      } else {
        await deleteFeedback(id);
      }
      toast.success('Feedback deleted'); load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-w-0">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground/80"><span className="inline-flex size-8 items-center justify-center rounded-2xl bg-primary-foreground/15"><PanelsTopLeft className="size-4" /></span> Administration</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2"><MessageSquare className="w-6 h-6 text-primary" /> Student Feedback</h1>
        <p className="text-muted-foreground text-sm mb-6">Post-exam feedback collected from students</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Total Responses</p>
            <p className="text-3xl font-bold">{items.length}</p>
          </div>
          <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Average Rating</p>
            <p className="text-3xl font-bold text-primary flex items-center gap-1">{avgRating} <Star className="w-5 h-5 fill-warning text-warning" /></p>
          </div>
        </div>

        <div className="mb-4"><DateRangeFilter value={range} onChange={setRange} /></div>
        <div className="space-y-3">
          {items.length === 0 ? <p className="text-center p-12 bg-card border rounded-2xl text-muted-foreground">No feedback yet.</p>
            : items.filter(it => inRange(it.created_at, range)).map(it => (
              <div key={it.id} className="bg-card border rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2 gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{studentName(it.student_id)}</p>
                    <p className="text-xs text-muted-foreground">{examTitle(it.exam_id)} · {new Date(it.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(n => <Star key={n} className={`w-4 h-4 ${n <= it.rating ? 'fill-warning text-warning' : 'text-muted'}`} />)}
                    </div>
                    <button onClick={() => remove(it.id)} title="Delete"
                      className="p-1.5 hover:bg-destructive/10 rounded-xl transition-colors">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
                {it.comments && <p className="text-sm bg-muted/40 p-3 rounded-xl">{it.comments}</p>}
              </div>
            ))}
        </div>
      </div>
    </AdminLayout>
  );
}


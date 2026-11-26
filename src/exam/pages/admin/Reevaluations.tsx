import { PanelsTopLeft } from 'lucide-react';
// @ts-nocheck
import { useEffect, useState } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { fetchReevaluations, updateReevaluation } from '@/exam/lib/supabase-helpers';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { MessageSquareWarning, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Reevaluations() {
  const { questions, mcqs, exams } = useAuth();
  const [reqs, setReqs] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});

  const load = () => fetchReevaluations().then(setReqs).catch(console.error);
  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, []);

  const handle = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateReevaluation(id, status, responses[id] || '');
      toast.success(`Marked as ${status}`);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const getQuestionTitle = (id: string, type: string) => {
    if (type === 'mcq') return mcqs.find(m => m.id === id)?.question?.slice(0, 60) || id;
    return questions.find(q => q.id === id)?.title || id;
  };
  const getExamTitle = (id: string) => exams.find(e => e.id === id)?.title || id;

  const pending = reqs.filter(r => r.status === 'pending');
  const resolved = reqs.filter(r => r.status !== 'pending');

  const Card = ({ r, isPending }: { r: any; isPending: boolean }) => (
    <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-sm">{r.student_name}</p>
          <p className="text-xs text-muted-foreground">{getExamTitle(r.exam_id)} · {r.question_type.toUpperCase()}: {getQuestionTitle(r.question_id, r.question_type)}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          r.status === 'pending' ? 'bg-warning/10 text-warning' :
          r.status === 'approved' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
        }`}>{r.status}</span>
      </div>
      <p className="text-sm bg-muted/40 p-3 rounded-xl mb-3">{r.reason || <em className="text-muted-foreground">No reason provided</em>}</p>
      {r.admin_response && <p className="text-xs text-muted-foreground mb-3"><strong>Response:</strong> {r.admin_response}</p>}
      {isPending && (
        <div className="space-y-2">
          <textarea value={responses[r.id] || ''} onChange={e => setResponses(p => ({ ...p, [r.id]: e.target.value }))}
            placeholder="Optional response to student..."
            className="w-full h-16 px-3 py-2 border rounded-xl bg-background text-sm" />
          <div className="flex gap-2">
            <button onClick={() => handle(r.id, 'approved')}
              className="flex items-center gap-1 px-3 h-9 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
              <CheckCircle2 className="w-4 h-4" /> Approve & Re-check
            </button>
            <button onClick={() => handle(r.id, 'rejected')}
              className="flex items-center gap-1 px-3 h-9 bg-destructive text-destructive-foreground rounded-xl text-sm font-medium hover:opacity-90">
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-w-0">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground/80"><span className="inline-flex size-8 items-center justify-center rounded-2xl bg-primary-foreground/15"><PanelsTopLeft className="size-4" /></span> Administration</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2"><MessageSquareWarning className="w-6 h-6 text-warning" /> Re-evaluation Requests</h1>
        <p className="text-muted-foreground text-sm mb-6">Student-flagged questions awaiting your review</p>

        <h2 className="font-semibold text-sm mb-3">Pending ({pending.length})</h2>
        <div className="space-y-3 mb-8">
          {pending.length === 0 ? <p className="text-sm text-muted-foreground p-6 bg-card border rounded-2xl text-center">No pending requests.</p>
            : pending.map(r => <Card key={r.id} r={r} isPending />)}
        </div>

        <h2 className="font-semibold text-sm mb-3">Resolved ({resolved.length})</h2>
        <div className="space-y-3">
          {resolved.length === 0 ? <p className="text-sm text-muted-foreground p-6 bg-card border rounded-2xl text-center">None yet.</p>
            : resolved.map(r => <Card key={r.id} r={r} isPending={false} />)}
        </div>
      </div>
    </AdminLayout>
  );
}

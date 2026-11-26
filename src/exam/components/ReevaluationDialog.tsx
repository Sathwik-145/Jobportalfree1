// @ts-nocheck
import "@/exam/exam-student.css";
import { useState } from 'react';
import { submitReevaluation } from '@/exam/lib/supabase-helpers';
import { toast } from 'sonner';
import { MessageSquareWarning, X } from 'lucide-react';

interface Props {
  studentId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  questions: { id: string; title: string; type: 'coding' | 'mcq' }[];
  onClose: () => void;
}

export default function ReevaluationDialog({ studentId, studentName, examId, examTitle, questions, onClose }: Props) {
  const [qId, setQId] = useState(questions[0]?.id || '');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!qId) return toast.error('Pick a question');
    if (reason.trim().length < 10) return toast.error('Please add a brief reason (10+ chars)');
    setBusy(true);
    try {
      const q = questions.find(x => x.id === qId)!;
      await submitReevaluation({
        studentId, studentName, examId, questionId: qId, questionType: q.type, reason: reason.trim(),
      });
      toast.success('Re-evaluation request sent to admin.');
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="exam-student fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border rounded-xl shadow-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-accent" />
            <h2 className="font-display font-semibold">Request Re-evaluation</h2>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Test: <strong>{examTitle}</strong></p>
        <label className="text-xs font-medium block mb-1">Question</label>
        <select value={qId} onChange={e => setQId(e.target.value)}
          className="w-full h-10 px-3 border rounded-lg bg-background text-sm mb-3">
          {questions.map(q => <option key={q.id} value={q.id}>[{q.type.toUpperCase()}] {q.title.slice(0, 60)}</option>)}
        </select>
        <label className="text-xs font-medium block mb-1">Reason</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Explain why you'd like this question re-checked..."
          className="w-full h-24 px-3 py-2 border rounded-lg bg-background text-sm mb-4" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-10 bg-muted rounded-lg font-medium text-sm hover:bg-muted/80">Cancel</button>
          <button onClick={submit} disabled={busy}
            className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50">
            {busy ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

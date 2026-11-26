// @ts-nocheck
import { useState, useEffect } from 'react';
import { X, Ban, RotateCcw, Clock } from 'lucide-react';
import { fetchSlots, saveKey } from '@/exam/lib/codexamSettings';
import { Student, Exam } from '@/exam/types';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { toast } from 'sonner';

interface Props {
  student: Student;
  onClose: () => void;
}

export default function StudentTestsDialog({ student, onClose }: Props) {
  const { exams, setExams } = useAuth();
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const safeExams = Array.isArray(exams) ? exams : [];

  // exams the student is currently assigned to OR was previously assigned (we track removals locally in this dialog)
  const assigned = safeExams.filter(e => (e.assignedStudentIds || []).includes(student.id));
  const wasRemoved = safeExams.filter(e => removedIds.has(e.id) && !(e.assignedStudentIds || []).includes(student.id));

  const [slots, setSlots] = useState<Record<string, any>>({});
  useEffect(() => { fetchSlots().then(all => setSlots(all[student.id] || {})); }, [student.id]);
  // Give a student who missed their start window more time. Only this student's slot changes.
  const extend = async (examId: string, minutes: number, fromNow = false) => {
    const all = await fetchSlots();
    const mine = { ...(all[student.id] || {}) };
    const cur = mine[examId] || { start: null, buffer: 0 };
    const next = fromNow || !cur.start ? { start: new Date().toISOString(), buffer: minutes } : { ...cur, buffer: (Number(cur.buffer) || 0) + minutes };
    mine[examId] = next;
    await saveKey('student_exam_slots', { ...all, [student.id]: mine });
    setSlots(mine);
    toast.success(fromNow ? `Reopened for ${minutes} minutes from now` : `Start window extended by ${minutes} minutes`);
  };
  const windowText = (sl: any) => {
    if (!sl?.start) return 'No start time';
    const start = new Date(sl.start).getTime();
    const end = sl.buffer > 0 ? start + sl.buffer * 60000 : null;
    const f = (t: number) => new Date(t).toLocaleString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    if (end && Date.now() > end) return `Missed — window closed ${f(end)}`;
    return end ? `Can start ${f(start)} – ${f(end)}` : `Starts ${f(start)}`;
  };

  const toggleAssign = (exam: Exam, assign: boolean) => {
    setExams(prev => prev.map(e => {
      if (e.id !== exam.id) return e;
      const assignedIds = Array.isArray(e.assignedStudentIds) ? e.assignedStudentIds : [];
      if (assign) {
        if (assignedIds.includes(student.id)) return e;
        return { ...e, assignedStudentIds: [...assignedIds, student.id] };
      } else {
        return { ...e, assignedStudentIds: assignedIds.filter(id => id !== student.id) };
      }
    }));
    if (!assign) setRemovedIds(prev => new Set(prev).add(exam.id));
    else { setRemovedIds(prev => { const n = new Set(prev); n.delete(exam.id); return n; }); }
    toast.success(assign ? 'Test restored for student' : 'Test removed for student');
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border rounded-xl shadow-lg w-full max-w-2xl p-4 sm:p-6 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-lg">{student.name}'s Tests</h2>
            <p className="text-xs text-muted-foreground">{student.email}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {assigned.length === 0 && wasRemoved.length === 0 && (
            <p className="text-sm text-muted-foreground p-8 text-center">No tests assigned to this student.</p>
          )}
          {assigned.map(e => (
            <div key={e.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{e.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    e.status === 'active' ? 'bg-primary/10 text-primary' :
                    e.status === 'scheduled' ? 'bg-warning/10 text-warning' :
                    e.status === 'ended' ? 'bg-muted text-muted-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>{e.status}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{e.description}</p>
              </div>
              <button onClick={() => toggleAssign(e, false)}
                className="ml-3 flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                <Ban className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          ))}
          {Object.keys(slots).length > 0 && (
            <div className="mt-4 rounded-xl border bg-primary/5 p-3 space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Start windows — give more time</p>
              {Object.entries(slots).map(([examId, sl]: any) => {
                const ex = safeExams.find(x => x.id === examId);
                const missed = windowText(sl).startsWith('Missed');
                return (
                  <div key={examId} className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{ex?.title || 'Test'}</p>
                      <span className={`text-xs ${missed ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>{windowText(sl)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[15, 30, 60].map(m => <button key={m} onClick={() => extend(examId, m)} className="h-8 px-3 rounded-lg border text-xs font-medium hover:bg-accent">+{m} min</button>)}
                      <button onClick={() => extend(examId, 60, true)} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Reopen now for 1 hour</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {wasRemoved.map(e => (
            <div key={e.id} className="flex items-center justify-between p-3 border rounded-lg bg-destructive/5 border-destructive/20">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate text-muted-foreground line-through">{e.title}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-destructive/10 text-destructive">removed</span>
                </div>
              </div>
              <button onClick={() => toggleAssign(e, true)}
                className="ml-3 flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Restore
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

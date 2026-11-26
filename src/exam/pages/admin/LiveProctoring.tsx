// @ts-nocheck
import { useEffect, useState } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { fetchStudents, fetchExams } from '@/exam/lib/supabase-helpers';
import { Activity, AlertTriangle, CheckCircle2, Eye } from 'lucide-react';
import { Student, Exam } from '@/exam/types';

export default function LiveProctoring() {
  const { exams: ctxExams = [], students: ctxStudents = [] } = useAuth();
  const [students, setStudents] = useState<Student[]>(ctxStudents || []);
  const [exams, setExams] = useState<Exam[]>(ctxExams || []);
  const [tick, setTick] = useState(0);

  // Always keep context as the source of truth (localStorage-backed); try Supabase as a bonus.
  useEffect(() => { setStudents(ctxStudents || []); setExams(ctxExams || []); }, [ctxStudents, ctxExams]);

  useEffect(() => {
    const refresh = async () => {
      try {
        const [s, e] = await Promise.all([fetchStudents(), fetchExams()]);
        if (s && s.length) setStudents(s);
        if (e && e.length) setExams(e);
      } catch { /* offline / no tables — fall back to context state */ }
      setTick(t => t + 1);
    };
    refresh();
    const i = setInterval(refresh, 4000);
    return () => clearInterval(i);
  }, []);

  const inProgress = (students || []).filter(s => s.examStatus === 'in_progress');
  const terminated = (students || []).filter(s => s.examStatus === 'terminated');
  const completed = (students || []).filter(s => s.examStatus === 'completed');

  const findExam = (s: Student) => (exams || []).find(e => (e.assignedStudentIds || []).includes(s.id) && (e.status === 'active' || e.status === 'ended'));

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="portal-banner flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 rounded-2xl bg-primary bg-gradient-to-br from-primary to-primary/75 text-primary-foreground p-6 sm:p-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary-foreground animate-pulse" /> Live Proctoring
            </h1>
            <p className="text-primary-foreground/80 text-sm mt-2">Real-time view of students currently taking exams (refresh #{tick})</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border rounded-2xl p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">In Progress</p><span className="rounded-xl bg-accent p-2.5 text-accent-foreground"><Activity className="h-5 w-5" /></span></div>
            <p className="text-3xl font-bold text-warning">{inProgress.length}</p>
          </div>
          <div className="bg-card border rounded-2xl p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Submitted</p><span className="rounded-xl bg-accent p-2.5 text-accent-foreground"><CheckCircle2 className="h-5 w-5" /></span></div>
            <p className="text-3xl font-bold text-primary">{completed.length}</p>
          </div>
          <div className="bg-card border rounded-2xl p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Terminated</p><span className="rounded-xl bg-accent p-2.5 text-accent-foreground"><AlertTriangle className="h-5 w-5" /></span></div>
            <p className="text-3xl font-bold text-destructive">{terminated.length}</p>
          </div>
        </div>

        <div className="bg-card border rounded-2xl overflow-hidden">
          <div className="p-4 border-b font-semibold text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" /> Currently Active &amp; Recent Sessions
          </div>
          {(inProgress.length + completed.length + terminated.length) === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No active or recent exam sessions.</p>
          ) : (
            <table className="block w-full text-sm sm:table">
              <thead className="hidden sm:table-header-group bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Student</th>
                  <th className="text-left p-3">Exam</th>
                  <th className="text-left p-3">Tab Switches</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody className="block space-y-3 bg-muted/30 p-3 sm:table-row-group sm:space-y-0 sm:bg-transparent sm:p-0">
                {[...inProgress, ...completed, ...terminated].map(s => {
                  const ex = findExam(s);
                  const danger = s.tabSwitchCount >= s.maxTabSwitches - 1;
                  const isLive = s.examStatus === 'in_progress';
                  const isDone = s.examStatus === 'completed';
                  return (
                    <tr key={s.id} className="block rounded-2xl border bg-card p-3 shadow-sm sm:table-row sm:rounded-none sm:border-0 sm:border-t sm:p-0 sm:shadow-none">
                      <td className="block min-w-0 break-words py-2 sm:table-cell sm:p-4"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">Student</span>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.email}</div>
                      </td>
                      <td className="block min-w-0 break-words py-2 sm:table-cell sm:p-4"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">Exam</span>{ex?.title || '—'}</td>
                      <td className="block min-w-0 break-words py-2 sm:table-cell sm:p-4"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">Tab switches</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${danger ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                          {s.tabSwitchCount}/{s.maxTabSwitches}
                          {danger && <AlertTriangle className="inline w-3 h-3 ml-1" />}
                        </span>
                      </td>
                      <td className="block min-w-0 break-words py-2 sm:table-cell sm:p-4"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">Status</span>
                        {isLive && <span className="text-warning text-xs font-medium flex items-center gap-1"><span className="w-2 h-2 bg-warning rounded-full animate-pulse" /> Live</span>}
                        {isDone && <span className="text-primary text-xs font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Submitted</span>}
                        {!isLive && !isDone && <span className="text-destructive text-xs font-medium">Terminated</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

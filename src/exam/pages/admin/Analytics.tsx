// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { fetchMCQSubmissions } from '@/exam/lib/supabase-helpers';
import { MCQSubmission } from '@/exam/types';
import { Activity, CheckCircle2, AlertTriangle, BarChart3, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

export default function Analytics() {
  const auth = useAuth();
  const students = auth?.students ?? [];
  const questions = auth?.questions ?? [];
  const exams = auth?.exams ?? [];
  const mcqs = auth?.mcqs ?? [];
  const [mcqSubs, setMcqSubs] = useState<MCQSubmission[]>([]);

  useEffect(() => { fetchMCQSubmissions().then((d) => setMcqSubs(d ?? [])).catch(console.error); }, []);

  const stats = useMemo(() => {
    const totalAttempts = students.filter(s => s.examStatus !== 'not_started').length;
    const submitted = students.filter(s => s.examStatus === 'completed').length;
    const terminated = students.filter(s => s.examStatus === 'terminated').length;
    let totalMarks = 0, totalMax = 0, scorers = 0, passed = 0;

    students.forEach(s => {
      const subs = s.submissions ?? [];
      const codingMarks = subs.reduce((a, x) => a + (x.marks ?? 0), 0);
      const codingMax = subs.reduce((a, x) => a + (x.maxMarks ?? 10), 0);
      const my = mcqSubs.filter(m => m.studentId === s.id);
      const mcqMarks = my.reduce((a, x) => a + (x.marksAwarded || 0), 0);
      const mcqMax = my.reduce((a, x) => a + (mcqs.find(mq => mq.id === x.mcqId)?.marks ?? 1), 0);
      const max = codingMax + mcqMax;
      const got = codingMarks + mcqMarks;
      if (max > 0) {
        totalMarks += got; totalMax += max; scorers++;
        if ((got / max) >= 0.5) passed++;
      }
    });

    const avgPct = totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(1) : '0';
    const passRate = scorers > 0 ? ((passed / scorers) * 100).toFixed(1) : '0';
    return { totalAttempts, submitted, terminated, avgPct, passRate };
  }, [students, mcqSubs, mcqs]);

  const statusChart = [
    { name: 'Submitted', value: students.filter(s => s.examStatus === 'completed').length },
    { name: 'In Progress', value: students.filter(s => s.examStatus === 'in_progress').length },
    { name: 'Terminated', value: students.filter(s => s.examStatus === 'terminated').length },
    { name: 'Not Started', value: students.filter(s => s.examStatus === 'not_started').length },
  ].filter(x => x.value > 0);

  const questionDifficulty = useMemo(() => {
    return questions.map(q => {
      const subs = students.flatMap(s => s.submissions ?? []).filter(x => x.questionId === q.id);
      if (!subs.length) return null;
      const avg = subs.reduce((a, s) => a + (s.maxMarks ? (s.marks ?? 0) / s.maxMarks : 0), 0) / subs.length;
      return { name: q.title.slice(0, 20), avgPct: Math.round(avg * 100), attempts: subs.length };
    }).filter(Boolean) as any[];
  }, [questions, students]);

  const examPerf = useMemo(() => exams.map(e => {
    const assigned = students.filter(s => (e.assignedStudentIds ?? []).includes(s.id));
    const completed = assigned.filter(s => s.examStatus === 'completed').length;
    return { name: e.title.slice(0, 15), completed, assigned: assigned.length };
  }).filter(x => x.assigned > 0), [exams, students]);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <header className="portal-banner mb-6 rounded-2xl bg-primary bg-gradient-to-br from-primary to-primary/75 p-6 sm:p-8 text-primary-foreground"><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground/75">Performance overview</p><h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Exam Analytics</h1><p className="mt-2 text-primary-foreground/80 text-sm">Performance insights across all tests</p></header>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
          {[
            { icon: Activity, label: 'Attempts', value: stats.totalAttempts },
            { icon: CheckCircle2, label: 'Submitted', value: stats.submitted },
            { icon: AlertTriangle, label: 'Terminated', value: stats.terminated, color: 'text-destructive' },
            { icon: BarChart3, label: 'Avg Score', value: `${stats.avgPct}%`, color: 'text-primary' },
            { icon: Trophy, label: 'Pass Rate (≥50%)', value: `${stats.passRate}%`, color: 'text-primary' },
          ].map(s => (
            <div key={s.label} className="min-w-0 bg-card border rounded-2xl p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{s.label}</p><span className="rounded-xl bg-accent p-2.5 text-accent-foreground"><s.icon className="h-4 w-4" /></span></div>
              <p className={`text-2xl font-bold ${s.color || ''}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="min-w-0 bg-card border rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-sm mb-4">Student Status Distribution</h3>
            {statusChart.length === 0 ? <p className="text-sm text-muted-foreground">No data</p> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {statusChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="min-w-0 bg-card border rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-sm mb-4">Average Score by Question (%)</h3>
            {questionDifficulty.length === 0 ? <p className="text-sm text-muted-foreground">No submissions</p> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={questionDifficulty}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avgPct" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="min-w-0 bg-card border rounded-2xl p-5 shadow-sm lg:col-span-2">
            <h3 className="font-semibold text-sm mb-4">Exam Completion</h3>
            {examPerf.length === 0 ? <p className="text-sm text-muted-foreground">No exams yet</p> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={examPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="assigned" fill="hsl(var(--muted-foreground))" name="Assigned" />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" name="Submitted" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

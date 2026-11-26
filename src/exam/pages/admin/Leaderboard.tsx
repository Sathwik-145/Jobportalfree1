// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { fetchMCQSubmissions } from '@/exam/lib/supabase-helpers';
import { MCQSubmission } from '@/exam/types';
import { Trophy, Medal, Award } from 'lucide-react';

export default function Leaderboard() {
  const { students = [], exams = [], mcqs = [] } = useAuth();
  const [mcqSubs, setMcqSubs] = useState<MCQSubmission[]>([]);
  const [examId, setExamId] = useState<string>('all');

  useEffect(() => { fetchMCQSubmissions().then(d => setMcqSubs(d ?? [])).catch(console.error); }, []);

  const ranking = useMemo(() => {
    const list = students.map(s => {
      const examFilter = examId === 'all' ? null : examId;
      const exam = examFilter ? exams.find(e => e.id === examFilter) : null;
      let codingSubs = Array.isArray(s.submissions) ? s.submissions : [];
      let myMcqs = mcqSubs.filter(m => m.studentId === s.id);
      if (exam) {
        codingSubs = codingSubs.filter(x => (exam.questionIds || []).includes(x.questionId));
        myMcqs = myMcqs.filter(m => m.examId === exam.id);
      }
      const codingMarks = codingSubs.reduce((a, x) => a + (x.marks ?? 0), 0);
      const codingMax = codingSubs.reduce((a, x) => a + (x.maxMarks ?? 10), 0);
      const mcqMarks = myMcqs.reduce((a, x) => a + (x.marksAwarded || 0), 0);
      const mcqMax = myMcqs.reduce((a, x) => a + (mcqs.find(mq => mq.id === x.mcqId)?.marks ?? 1), 0);
      const total = codingMarks + mcqMarks;
      const max = codingMax + mcqMax;
      const pct = max > 0 ? (total / max) * 100 : 0;
      return { id: s.id, name: s.name, email: s.email, total, max, pct };
    }).filter(r => r.max > 0).sort((a, b) => b.pct - a.pct || b.total - a.total);
    return list;
  }, [students, mcqSubs, exams, mcqs, examId]);

  const medal = (i: number) => {
    if (i === 0) return <Trophy className="w-5 h-5 text-primary" />;
    if (i === 1) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (i === 2) return <Award className="w-5 h-5 text-accent-foreground" />;
    return <span className="text-xs text-muted-foreground font-medium">#{i + 1}</span>;
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="portal-banner flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 rounded-2xl bg-primary bg-gradient-to-br from-primary to-primary/75 text-primary-foreground p-6 sm:p-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2"><Trophy className="w-6 h-6 text-primary-foreground" /> Leaderboard</h1>
            <p className="text-primary-foreground/80 text-sm mt-2">Top performers ranked by score</p>
          </div>
          <select value={examId} onChange={e => setExamId(e.target.value)}
            className="h-10 min-w-0 max-w-full px-3 border rounded-xl bg-card text-foreground text-sm">
            <option value="all">All Exams (Combined)</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>

        {ranking.length === 0 ? (
          <p className="text-center text-muted-foreground p-12 border rounded-2xl bg-card">No submissions yet.</p>
        ) : (
          <div className="bg-card border rounded-2xl overflow-hidden">
            <table className="block w-full text-sm sm:table">
              <thead className="hidden sm:table-header-group bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-3 w-16">Rank</th>
                  <th className="text-left p-3">Student</th>
                  <th className="text-right p-3">Score</th>
                  <th className="text-right p-3">Percentage</th>
                </tr>
              </thead>
              <tbody className="block space-y-3 bg-muted/30 p-3 sm:table-row-group sm:space-y-0 sm:bg-transparent sm:p-0">
                {ranking.map((r, i) => (
                  <tr key={r.id} className={`block rounded-2xl border bg-card p-3 shadow-sm sm:table-row sm:rounded-none sm:border-0 sm:border-t sm:p-0 sm:shadow-none ${i < 3 ? 'sm:bg-primary/5' : ''}`}>
                    <td className="block min-w-0 break-words py-2 sm:table-cell sm:p-4"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">Rank</span><div className="flex items-center justify-center">{medal(i)}</div></td>
                    <td className="block min-w-0 break-words py-2 sm:table-cell sm:p-4"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">Student</span>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </td>
                    <td className="block min-w-0 break-words py-2 sm:table-cell sm:p-4 sm:text-right tabular-nums font-medium"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">Score</span>{r.total}/{r.max}</td>
                    <td className="block min-w-0 break-words py-2 sm:table-cell sm:p-4 sm:text-right tabular-nums font-bold text-primary"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">Percentage</span>{r.pct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

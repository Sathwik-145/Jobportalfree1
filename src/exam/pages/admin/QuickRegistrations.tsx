import DateRangeFilter, { inRange } from '@/components/DateRangeFilter';
import { PanelsTopLeft } from 'lucide-react';
// @ts-nocheck
import SourceResultTiming from '@/exam/components/SourceResultTiming';
import AllocationSettingsCard from '@/exam/components/AllocationSettingsCard';
import LogoSpinner from '@/components/LogoSpinner';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { supabase } from '@/lib/db-client';
import {
  fetchStudents, fetchExams, fetchQuestions, fetchMCQs, fetchMCQSubmissions,
} from '@/exam/lib/supabase-helpers';
import { generatePdfReport } from '@/exam/lib/generatePdfReport';
import { Student, Exam, Question, MCQQuestion, MCQSubmission } from '@/exam/types';
import { Zap, RefreshCw, Activity, CheckCircle2, AlertTriangle, Download, Eye, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Registration {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  approved_student_id: string | null;
}

export default function QuickRegistrations() {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [mcqs, setMcqs] = useState<MCQQuestion[]>([]);
  const [mcqSubs, setMcqSubs] = useState<MCQSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ from: '', to: '' });
  const [tick, setTick] = useState(0);
  const [details, setDetails] = useState<{ student: Student; exam?: Exam } | null>(null);

  const load = async () => {
    try {
      let rRows: any[] = [];
      try {
        const { data, error } = await supabase.from('registrations').select('*').ilike('notes', 'Quick-start%').order('created_at', { ascending: false });
        if (!error && data) rRows = data;
      } catch {}
      try {
        const local = JSON.parse(localStorage.getItem('codexam_quick_registrations') || '[]');
        const seen = new Set(rRows.map(r => `${r.email}_${r.created_at}`));
        for (const l of local) {
          const k = `${l.email}_${l.created_at}`;
          if (!seen.has(k)) { rRows.push(l); seen.add(k); }
        }
      } catch {}
      rRows.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const safe = async <T,>(p: () => Promise<T>, fallback: T): Promise<T> => { try { return await p(); } catch { return fallback; } };
      const [s, e, q, m, ms] = await Promise.all([
        safe(fetchStudents, []), safe(fetchExams, []), safe(fetchQuestions, []),
        safe(fetchMCQs, []), safe(fetchMCQSubmissions, []),
      ]);
      setRegs(rRows as any);
      setStudents(s); setExams(e); setQuestions(q); setMcqs(m); setMcqSubs(ms);
      setTick(t => t + 1);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, []);

  const rows = useMemo(() => regs.filter(r => inRange(r.created_at, range)).map(r => {
    const student = students.find(s => s.id === r.approved_student_id);
    const exam = exams.find(ex => student && (ex.assignedStudentIds || []).includes(student.id));
    const myMcqs = student ? mcqSubs.filter(x => x.studentId === student.id) : [];
    const codingSubs = Array.isArray(student?.submissions) ? student.submissions : [];
    const codingMarks = codingSubs.reduce((a, x) => a + (x.marks ?? 0), 0);
    const codingMax = codingSubs.reduce((a, x) => a + (x.maxMarks ?? 10), 0);
    const mcqMarks = myMcqs.reduce((a, x) => a + (x.marksAwarded || 0), 0);
    const mcqMax = myMcqs.reduce((a, x) => a + (mcqs.find(m => m.id === x.mcqId)?.marks ?? 1), 0);
    const total = codingMarks + mcqMarks;
    const max = codingMax + mcqMax;
    const pct = max > 0 ? Math.round((total / max) * 100) : 0;
    return { r, student, exam, total, max, pct };
  }), [regs, students, exams, mcqs, mcqSubs, range]);

  const liveCount = rows.filter(x => x.student?.examStatus === 'in_progress').length;
  const submittedCount = rows.filter(x => x.student?.examStatus === 'completed').length;
  const terminatedCount = rows.filter(x => x.student?.examStatus === 'terminated').length;

  const downloadPdf = async (st: Student, exam?: Exam) => {
    try {
      await generatePdfReport(st, questions, mcqs, mcqSubs, { includeQuestionsAndAnswers: true, examTitle: exam?.title });
      toast.success('PDF generated');
    } catch (e: any) { toast.error(e.message || 'Failed to generate PDF'); }
  };

  const removeReg = async (id: string) => {
    if (!confirm('Delete this quick registration record?')) return;
    await supabase.from('registrations').delete().eq('id', id);
    load();
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-w-0">
        <div className="portal-banner flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6 rounded-2xl bg-primary text-primary-foreground p-5 sm:p-7 shadow-sm">
          <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground/80"><span className="inline-flex size-8 items-center justify-center rounded-2xl bg-primary-foreground/15"><PanelsTopLeft className="size-4" /></span> Administration</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" /> Quick Registrations
            </h1>
            <p className="text-sm text-primary-foreground/85 mt-1">
              Instant sign-ups via <code className="rounded bg-primary-foreground/15 px-2 py-0.5 text-primary-foreground break-all">{window.location.origin}/quick-start</code>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/quick-start`); toast.success('Link copied'); }}
                className="copy-chip ml-2 inline-flex items-center gap-1 rounded-lg bg-primary-foreground px-2 py-0.5 text-xs font-semibold text-primary hover:opacity-90">
                <Copy className="w-3 h-3" /> Copy
              </button>
              <span className="ml-3 text-xs">(auto-refresh #{tick})</span>
            </p>
            <p className="text-sm text-primary-foreground/85 mt-2">
              Student login: <code className="rounded bg-primary-foreground/15 px-2 py-0.5 text-primary-foreground break-all">{window.location.origin}/exam-login</code>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/exam-login`); toast.success('Exam login link copied'); }}
                className="copy-chip ml-2 inline-flex items-center gap-1 rounded-lg bg-primary-foreground px-2 py-0.5 text-xs font-semibold text-primary hover:opacity-90">
                <Copy className="w-3 h-3" /> Copy
              </button>
            </p>
          </div>
          <button onClick={load} className="h-9 px-3 inline-flex items-center gap-2 rounded-xl border text-sm hover:bg-accent">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="mb-6"><AllocationSettingsCard sections={['quick', 'pool']} /></div>
        <div className="mb-6 rounded-3xl border bg-card p-5"><h2 className="font-semibold mb-1">When should these students get their results?</h2><p className="text-xs text-muted-foreground mb-4">Manual sends are always available in Reports.</p><SourceResultTiming /></div>

        <div className="mb-4"><DateRangeFilter value={range} onChange={setRange} /></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Total Quick Sign-ups</p>
            <p className="text-3xl font-bold">{rows.length}</p>
          </div>
          <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Live Now</p>
            <p className="text-3xl font-bold text-warning flex items-center gap-2">
              {liveCount}{liveCount > 0 && <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />}
            </p>
          </div>
          <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Submitted</p>
            <p className="text-3xl font-bold text-primary">{submittedCount}</p>
          </div>
          <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Terminated</p>
            <p className="text-3xl font-bold text-destructive">{terminatedCount}</p>
          </div>
        </div>

        <div className="bg-card border rounded-2xl overflow-x-auto shadow-sm">
          {loading ? (
            <div className="p-8 flex items-center justify-center"><LogoSpinner size="md" /></div>

          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No quick registrations yet.</div>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50 text-xs">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Assigned Test</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Tab Switches</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Registered</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ r, student, exam, total, max, pct }) => {
                  const status = student?.examStatus || 'not_started';
                  const danger = student && student.tabSwitchCount >= student.maxTabSwitches - 1;
                  return (
                    <tr key={r.id} className="border-t hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </td>
                      <td className="px-4 py-3">{exam?.title || <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3">
                        {status === 'in_progress' && <span className="text-warning text-xs font-medium flex items-center gap-1"><Activity className="w-3 h-3 animate-pulse" /> Live</span>}
                        {status === 'completed' && <span className="text-primary text-xs font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Submitted</span>}
                        {status === 'terminated' && <span className="text-destructive text-xs font-medium">Terminated</span>}
                        {status === 'not_started' && <span className="text-muted-foreground text-xs">Not started</span>}
                      </td>
                      <td className="px-4 py-3">
                        {student ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${danger ? 'bg-destructive/10 text-destructive' : 'bg-muted'}`}>
                            {student.tabSwitchCount}/{student.maxTabSwitches}
                            {danger && <AlertTriangle className="inline w-3 h-3 ml-1" />}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {max > 0 ? (
                          <span className="text-xs font-medium">{total}/{max} <span className="text-muted-foreground">({pct}%)</span></span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          {student && (
                            <>
                              <button onClick={() => setDetails({ student, exam })}
                                className="h-8 px-2 inline-flex items-center gap-1 rounded-xl border text-xs hover:bg-accent">
                                <Eye className="w-3 h-3" /> Details
                              </button>
                              <button onClick={() => downloadPdf(student, exam)}
                                disabled={status !== 'completed'}
                                className="h-8 px-2 inline-flex items-center gap-1 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-40">
                                <Download className="w-3 h-3" /> PDF
                              </button>
                            </>
                          )}
                          <button onClick={() => removeReg(r.id)} className="h-8 w-8 inline-flex items-center justify-center rounded-xl border text-xs hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {details && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4" onClick={() => setDetails(null)}>
            <div className="bg-card border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{details.student.name}</h2>
                  <p className="text-sm text-muted-foreground">{details.student.email}</p>
                </div>
                <button onClick={() => setDetails(null)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="border rounded-xl p-3"><p className="text-xs text-muted-foreground">Test</p><p className="font-medium">{details.exam?.title || '—'}</p></div>
                <div className="border rounded-xl p-3"><p className="text-xs text-muted-foreground">Status</p><p className="font-medium capitalize">{details.student.examStatus.replace('_', ' ')}</p></div>
                <div className="border rounded-xl p-3"><p className="text-xs text-muted-foreground">Tab Switches</p><p className="font-medium">{details.student.tabSwitchCount}/{details.student.maxTabSwitches}</p></div>
                <div className="border rounded-xl p-3"><p className="text-xs text-muted-foreground">Coding Submissions</p><p className="font-medium">{(details.student.submissions || []).length}</p></div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Submissions</h3>
                {(details.student.submissions || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No coding submissions yet.</p>
                ) : (details.student.submissions || []).map((sub, i) => {
                  const q = questions.find(qq => qq.id === sub.questionId);
                  return (
                    <div key={i} className="border rounded-xl p-3 text-xs">
                      <div className="flex justify-between"><span className="font-medium">{q?.title || sub.questionId}</span><span>{sub.marks}/{sub.maxMarks}</span></div>
                      <p className="text-muted-foreground mt-1">{sub.language} · {(sub.passedPublic + sub.passedPrivate)}/{(sub.totalPublic + sub.totalPrivate)} tests passed</p>
                    </div>
                  );
                })}
                <h3 className="font-semibold text-sm pt-3">MCQ Answers</h3>
                {mcqSubs.filter(s => s.studentId === details.student.id).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No MCQ answers yet.</p>
                ) : mcqSubs.filter(s => s.studentId === details.student.id).map((s, i) => {
                  const m = mcqs.find(x => x.id === s.mcqId);
                  return (
                    <div key={i} className="border rounded-xl p-3 text-xs">
                      <div className="flex justify-between"><span className="font-medium truncate pr-2">{m?.question || s.mcqId}</span><span>{s.marksAwarded}/{m?.marks ?? 1}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

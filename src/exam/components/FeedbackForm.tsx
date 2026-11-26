// @ts-nocheck
import "@/exam/exam-student.css";
import { useEffect, useMemo, useState } from 'react';
import { Star, CheckCircle2, Mail, Lightbulb, Trophy, Download, MessageSquareHeart } from 'lucide-react';
import { improvementsFor } from '@/exam/lib/resultReport';
import { generatePdfReport } from '@/exam/lib/generatePdfReport';
import { submitFeedback, fetchMCQSubmissions, fetchWritingSubmissions, fetchFIBSubmissions } from '@/exam/lib/supabase-helpers';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { toast } from 'sonner';
import { canStudentSeeResults } from '@/exam/lib/codexamSettings';

interface Props {
  studentId: string;
  examId: string;
  onDone: () => void;
}

export default function FeedbackForm({ studentId, examId, onDone }: Props) {
  const { exams, mcqs, fibs, writings, students, questions } = useAuth();
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [tags, setTags] = useState<Record<string, string>>({});
  const [canSee, setCanSee] = useState<boolean | null>(null);
  useEffect(() => { canStudentSeeResults(studentId).then(setCanSee).catch(() => setCanSee(true)); }, [studentId]);
  const [serverSubs, setServerSubs] = useState<{ mcq: any[]; writing: any[]; fib: any[] }>({ mcq: [], writing: [], fib: [] });

  // Fetch authoritative server submissions (same source admin StudentReports uses)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [mcq, writing, fib] = await Promise.all([
          fetchMCQSubmissions().catch(() => []),
          fetchWritingSubmissions().catch(() => []),
          fetchFIBSubmissions().catch(() => []),
        ]);
        if (!cancelled) setServerSubs({ mcq, writing, fib });
      } catch {}
    };
    load();
    // Poll a few times in case rows are still being inserted right after submit
    const interval = setInterval(load, 2000);
    const stop = setTimeout(() => clearInterval(interval), 10000);
    return () => { cancelled = true; clearInterval(interval); clearTimeout(stop); };
  }, [studentId, examId]);

  // Compute result using server data (matches admin Reports panel exactly)
  const result = useMemo(() => {
    const exam = exams.find((e: any) => e.id === examId);
    const student = students.find((s: any) => s.id === studentId);
    if (!exam) return null;

    let total = 0, max = 0;
    const sections: any[] = [];

    // Coding — student.submissions already carries server marks/maxMarks
    const codingSubs = (student?.submissions || []).filter((s: any) => (exam.questionIds || []).includes(s.questionId));
    if ((exam.questionIds || []).length > 0) {
      const cMax = exam.questionIds.reduce((a: number, id: string) => a + (questions.find((q: any) => q.id === id)?.maxMarks || 10), 0);
      const cGot = codingSubs.reduce((a: number, s: any) => a + (s.marks || 0), 0);
      total += cGot; max += cMax;
      sections.push({ name: exam.sectionNames?.coding || 'Coding', got: cGot, max: cMax, count: codingSubs.length, of: exam.questionIds.length });
    }

    // MCQ — server-side marksAwarded
    const myMcq = serverSubs.mcq.filter((x: any) => x.studentId === studentId && x.examId === examId);
    if ((exam.mcqIds || []).length > 0) {
      const mGot = myMcq.reduce((a: number, s: any) => a + (s.marksAwarded || 0), 0);
      const mMax = (exam.mcqIds || []).reduce((a: number, id: string) => a + (mcqs.find((q: any) => q.id === id)?.marks || 1), 0);
      total += mGot; max += mMax;
      sections.push({ name: exam.sectionNames?.mcq || 'MCQ', got: mGot, max: mMax, count: myMcq.length, of: exam.mcqIds.length });
    }

    // FIB — server-side
    const myFib = serverSubs.fib.filter((x: any) => x.studentId === studentId && x.examId === examId);
    if ((exam.fibIds || []).length > 0) {
      const fGot = myFib.reduce((a: number, s: any) => a + (s.marksAwarded || 0), 0);
      const fMax = myFib.reduce((a: number, s: any) => a + (s.maxMarks || 0), 0) ||
        (exam.fibIds || []).reduce((a: number, id: string) => a + (fibs.find((q: any) => q.id === id)?.marks || 1), 0);
      total += fGot; max += fMax;
      sections.push({ name: exam.sectionNames?.fib || 'Fill-in-Blanks', got: fGot, max: fMax, count: myFib.length, of: exam.fibIds.length });
    }

    // Writing — server-side (marks may still be 0 until manual review)
    const myWriting = serverSubs.writing.filter((x: any) => x.studentId === studentId && x.examId === examId);
    if ((exam.writingIds || []).length > 0) {
      const wGot = myWriting.reduce((a: number, s: any) => a + (s.marksAwarded || 0), 0);
      const wMax = myWriting.reduce((a: number, s: any) => a + (s.maxMarks || 0), 0) ||
        (exam.writingIds || []).reduce((a: number, id: string) => a + (writings.find((q: any) => q.id === id)?.marks || 10), 0);
      total += wGot; max += wMax;
      const pending = myWriting.some((s: any) => !s.marksAwarded);
      sections.push({ name: exam.sectionNames?.writing || 'Writing', got: wGot, max: wMax, count: myWriting.length, of: exam.writingIds.length, note: pending ? 'Pending manual review' : undefined });
    }

    const pct = max > 0 ? Math.round((total / max) * 100) : 0;
    return { exam, total, max, pct, sections };
  }, [exams, examId, studentId, students, questions, mcqs, fibs, writings, serverSubs]);

  // Persist a "my-result" record so it shows in profile / results history
  const persistResult = () => {
    if (!result) return;
    try {
      const key = `codexam_my_results_${studentId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const entry = {
        id: `r_${Date.now()}`,
        examId,
        examTitle: result.exam.title,
        total: result.total, max: result.max, pct: result.pct,
        sections: result.sections,
        submittedAt: new Date().toISOString(),
      };
      // dedupe by examId, keep latest
      const next = [entry, ...existing.filter((e: any) => e.examId !== examId)];
      localStorage.setItem(key, JSON.stringify(next.slice(0, 100)));
    } catch {}
  };

  const send = async () => {
    if (rating === 0) { toast.error('Please give a star rating'); return; }
    setBusy(true);
    try {
      const key = 'codexam_feedback_local';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift({
        id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        student_id: studentId, exam_id: examId, rating,
        comments: comments.trim(), created_at: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 500)));
    } catch {}
    const tagText = Object.entries(tags).map(([k, v]) => `${k}: ${v}`).join(' | ');
    const fullComment = [tagText, comments.trim()].filter(Boolean).join('\n');
    try { await submitFeedback(studentId, examId, rating, fullComment); } catch {}
    persistResult();
    setDone(true);
    setBusy(false);
    toast.success('Thanks for your feedback!');
  };

  const reportInput = () => {
    const exam = exams.find((e: any) => e.id === examId);
    const student = students.find((x: any) => x.id === studentId);
    if (!exam || !student) return null;
    const codingSubs = (student.submissions || []).filter((x: any) => (exam.questionIds || []).includes(x.questionId));
    return { student: { ...student, submissions: codingSubs }, exam, questions, mcqs, writings, fibs, codingSubs,
      mcqSubs: serverSubs.mcq.filter((x: any) => x.studentId === studentId && x.examId === examId),
      writingSubs: serverSubs.writing.filter((x: any) => x.studentId === studentId && x.examId === examId),
      fibSubs: serverSubs.fib.filter((x: any) => x.studentId === studentId && x.examId === examId) };
  };
  const download = async () => {
    const r = reportInput(); if (!r) return;
    try { await generatePdfReport(r.student, questions, mcqs, r.mcqSubs, { includeQuestionsAndAnswers: true, exam: r.exam, writings, fibs, writingSubs: r.writingSubs, fibSubs: r.fibSubs }); }
    catch { toast.error('Could not create the PDF'); }
  };

  if (done) {
    const ri = reportInput();
    const tips = ri ? improvementsFor(ri) : ['Keep practising!'];
    const tone = !result ? 'text-primary' : result.pct >= 60 ? 'text-success' : result.pct >= 40 ? 'text-warning' : 'text-destructive';
    const bar = !result ? 'bg-primary' : result.pct >= 60 ? 'bg-success' : result.pct >= 40 ? 'bg-warning' : 'bg-destructive';
    return (
      <div className="exam-student mt-5 space-y-4 text-left">
        <div className="rounded-[1.5rem] border bg-card p-6 text-center shadow-sm">
          <Trophy className="w-11 h-11 text-accent mx-auto mb-2" />
          <p className="font-bold text-xl text-foreground">Test submitted</p>
          <p className="text-sm text-muted-foreground mt-1">You completed <span className="font-semibold text-foreground">{result?.exam?.title}</span>. Thanks for your feedback!</p>
          {result && canSee && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Your score</p>
              <p className="text-4xl font-bold tabular-nums text-foreground mt-1">{result.total}<span className="text-muted-foreground text-2xl">/{result.max}</span></p>
              <p className={`text-xl font-bold mt-1 ${tone}`}>{result.pct}%</p>
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden"><div className={`h-full ${bar}`} style={{ width: `${result.pct}%` }} /></div>
            </div>
          )}
          {canSee === false && (
            <div className="mt-4 rounded-xl bg-muted/50 p-4">
              <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-1" />
              <p className="text-sm font-medium text-foreground">Your results will be shared with you soon.</p>
            </div>
          )}
        </div>

        {result && canSee && result.sections.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {result.sections.map((x, i) => (
              <div key={i} className="rounded-xl border bg-card p-3">
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-foreground">{x.name}</span><span className="text-sm tabular-nums font-bold text-foreground">{x.got}/{x.max}</span></div>
                <p className="text-xs text-muted-foreground mt-0.5">{x.count}/{x.of} answered{x.note ? ` · ${x.note}` : ''}</p>
              </div>
            ))}
          </div>
        )}

        {result && canSee && (
          <div className="rounded-xl border border-accent/40 bg-accent/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><Lightbulb className="w-4 h-4 text-accent" /> What to improve</p>
            <ul className="space-y-1.5 text-sm text-foreground">{tips.map((t, i) => <li key={i} className="flex gap-2"><span className="text-accent">•</span><span>{t}</span></li>)}</ul>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><Mail className="w-3.5 h-3.5" /><span>If enabled by your admin, a detailed report will also be emailed to you.</span></div>
        <div className="flex flex-col sm:flex-row gap-2">
          {result && canSee && <button onClick={download} className="flex-1 h-11 rounded-lg border bg-background text-foreground font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-muted"><Download className="w-4 h-4" /> Download detailed report</button>}
          <button onClick={onDone} className="flex-1 h-11 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90">Back to Home</button>
        </div>
      </div>
    );
  }

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
  const QUICK: [string, string[]][] = [['Difficulty', ['Too easy', 'Just right', 'Too hard']], ['Questions were', ['Clear', 'Somewhat clear', 'Confusing']], ['Platform', ['Smooth', 'Some issues', 'Many issues']]];
  return (
    <div className="mt-5 rounded-[1.5rem] border bg-card p-5 sm:p-6 text-left shadow-sm">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><MessageSquareHeart className="w-5 h-5" /></div>
        <div><p className="font-bold text-base text-foreground">How was your test?</p><p className="text-sm text-muted-foreground">Rate the experience to see your results. It takes 10 seconds.</p></div>
      </div>
      <div className="flex flex-col items-center mb-5">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="p-1 hover:scale-110 transition-transform">
              <Star className={`w-9 h-9 ${n <= rating ? 'fill-warning text-accent' : 'text-muted-foreground/40'}`} />
            </button>
          ))}
        </div>
        <p className="text-sm font-medium h-5 mt-1 text-foreground">{LABELS[rating]}</p>
      </div>
      <div className="space-y-3 mb-4">
        {QUICK.map(([k, opts]) => (
          <div key={k}>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">{k}</p>
            <div className="flex flex-wrap gap-2">{opts.map(o => (
              <button key={o} type="button" onClick={() => setTags(t => ({ ...t, [k]: t[k] === o ? '' : o }))}
                className={`h-8 px-3 rounded-full border text-xs font-medium transition-colors ${tags[k] === o ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground hover:bg-muted'}`}>{o}</button>
            ))}</div>
          </div>
        ))}
      </div>
      <textarea value={comments} onChange={e => setComments(e.target.value)} maxLength={2000}
        placeholder="Anything else? What went well, what could be better…"
        className="w-full h-24 px-3 py-2 border rounded-lg bg-background text-foreground text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
      <button onClick={send} disabled={busy || rating === 0}
        className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50">
        {busy ? 'Submitting…' : rating === 0 ? 'Choose a star rating' : 'Submit & see results'}
      </button>
    </div>
  );
}

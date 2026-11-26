// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { Download, Eye, CheckCircle2, XCircle, Code2, FileText, ChevronDown, ChevronRight, ListChecks, PenLine, Type } from 'lucide-react';
import { generatePdfReport } from '@/exam/lib/generatePdfReport';
import { resultVars, reportPdfBase64, reportFileName } from '@/exam/lib/resultReport';
import { fetchMCQSubmissions, fetchWritingSubmissions, fetchFIBSubmissions } from '@/exam/lib/supabase-helpers';
import { fetchKey, saveKey } from '@/exam/lib/codexamSettings';
import { DEFAULT_RESULT_TEMPLATE, RESULT_VARS } from '@/exam/lib/mailTemplates';
import { Mail, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import MailTemplateEditor, { MailPreview } from '@/exam/components/MailTemplateEditor';
import MailAttachments from '@/exam/components/MailAttachments';
import { mailRequestHeaders } from '@/exam/lib/mailRequest';
import { MCQSubmission, WritingSubmission, FIBSubmission, Student, Exam } from '@/exam/types';
import { correctedReport, type Corrections } from '@/exam/lib/reportCorrections';
import ResultMarkEditor from '@/exam/components/ResultMarkEditor';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import DateRangeFilter, { inRange, type DateRange } from '@/components/DateRangeFilter';
import ReportLayoutPicker from '@/exam/components/ReportLayoutPicker';

export default function StudentReports() {
  const { students = [], questions = [], mcqs = [], exams = [], writings = [], fibs = [] } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [mcqSubs, setMcqSubs] = useState<MCQSubmission[]>([]);
  const [writingSubs, setWritingSubs] = useState<WritingSubmission[]>([]);
  const [fibSubs, setFibSubs] = useState<FIBSubmission[]>([]);
  const [downloadFor, setDownloadFor] = useState<{ student: Student; exam: Exam } | null>(null);
  const [includeQA, setIncludeQA] = useState(true);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [mailOpen, setMailOpen] = useState(false);
  const [mailScope, setMailScope] = useState<'all' | 'selected'>('all');
  const [tpl, setTpl] = useState(DEFAULT_RESULT_TEMPLATE);
  const [target, setTarget] = useState<'personal' | 'login'>('personal');
  const [passPct, setPassPct] = useState(40);
  const [attachments, setAttachments] = useState([]);
  const [mailing, setMailing] = useState(false);
  const [examFilter, setExamFilter] = useState('');
  const [range, setRange] = useState<DateRange>({ from: '', to: '' });
  const [attachPdf, setAttachPdf] = useState(true);
  const [pdfQA, setPdfQA] = useState(true);
  const [sendWhen, setSendWhen] = useState<'now' | '5' | '10' | '30' | 'custom'>('now');
  const [sendAtCustom, setSendAtCustom] = useState('');
  const [corrections, setCorrections] = useState<Corrections>({});
  const [auto, setAuto] = useState({ enabled: false, delayMinutes: 0, attachPdf: true, includeQA: true, frequency: 'submit', time: '18:17', tzOffsetMinutes: 330 });
  useEffect(() => { fetchKey('report_corrections', {}).then(setCorrections); fetchKey('result_auto_global', auto).then(v => setAuto(p => ({ ...p, ...v }))); }, []);
  const saveAuto = async (next) => { try { await saveKey('result_auto_global', next); setAuto(next); toast.success('Automatic result settings saved'); } catch { toast.error('Could not save automatic results'); } };
  const saveMark = async (b, kind, questionId, marks, isCorrect) => {
    const response = await fetch('/api/public/correct-result', { method: 'POST', headers: await mailRequestHeaders(), body: JSON.stringify({ studentId: b.student.id, examId: b.exam.id, kind, questionId, marks, isCorrect }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not save');
    setCorrections(data.corrections); toast.success('Corrected marks saved');
  };
  const [rechecking, setRechecking] = useState(false);
  const recheckFib = async () => {
    const targets = shown.filter(b => picked.has(keyOf(b)) && fibSubs.some(s => s.studentId === b.student.id && s.examId === b.exam.id && !s.isCorrect));
    if (!targets.length) { toast.error('Select students who have fill-in-the-blank answers marked wrong'); return; }
    setRechecking(true);
    let flipped = 0, failed = 0;
    for (const b of targets) {
      try {
        const response = await fetch('/api/public/recheck-fib', { method: 'POST', headers: await mailRequestHeaders(), body: JSON.stringify({ studentId: b.student.id, examId: b.exam.id }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Recheck failed');
        flipped += data.flipped || 0;
        if (data.corrections) setCorrections(data.corrections);
      } catch { failed++; }
    }
    setRechecking(false);
    if (failed) toast.error(`AI recheck failed for ${failed} report${failed === 1 ? '' : 's'}`);
    toast.success(flipped ? `AI accepted ${flipped} answer${flipped === 1 ? '' : 's'} and updated the marks` : 'AI recheck finished — no answers changed');
  };
  useEffect(() => { fetchKey('result_template', DEFAULT_RESULT_TEMPLATE).then(v => setTpl({ ...DEFAULT_RESULT_TEMPLATE, ...(v || {}) })); }, []);

  useEffect(() => {
    const load = () => {
      fetchMCQSubmissions().then(d => setMcqSubs(d ?? [])).catch(console.error);
      fetchWritingSubmissions().then(d => setWritingSubs(d ?? [])).catch(console.error);
      fetchFIBSubmissions().then(d => setFibSubs(d ?? [])).catch(console.error);
    };
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, []);

  const getQuestion = (qId: string) => questions.find(q => q.id === qId);
  const getMCQ = (mId: string) => mcqs.find(m => m.id === mId);
  const getWriting = (wId: string) => writings.find(w => w.id === wId);
  const getFib = (fId: string) => fibs.find(f => f.id === fId);

  // Group submissions by (student, exam)
  type Bucket = {
    student: Student;
    exam: Exam;
    codingSubs: typeof students[0]['submissions'];
    mcqSubs: MCQSubmission[];
    writingSubs: WritingSubmission[];
    fibSubs: FIBSubmission[];
  };

  const buckets = useMemo<Bucket[]>(() => {
    const out: Bucket[] = [];
    for (const s of (students || [])) {
      for (const e of (exams || [])) {
        const examQuestionIds = Array.isArray(e.questionIds) ? e.questionIds : [];
        const cs = (Array.isArray(s.submissions) ? s.submissions : []).filter(sub => examQuestionIds.includes(sub.questionId));
        const ms = mcqSubs.filter(x => x.studentId === s.id && x.examId === e.id);
        const ws = writingSubs.filter(x => x.studentId === s.id && x.examId === e.id);
        const fs = fibSubs.filter(x => x.studentId === s.id && x.examId === e.id);
        if (cs.length + ms.length + ws.length + fs.length === 0) continue;
        out.push(correctedReport({ student: s, exam: e, codingSubs: cs, mcqSubs: ms, writingSubs: ws, fibSubs: fs }, corrections));
      }
    }
    return out.sort((a, b) => a.student.name.localeCompare(b.student.name));
  }, [students, exams, mcqSubs, writingSubs, fibSubs, corrections]);

  const calcMarks = (b: Bucket) => {
    const codingM = b.codingSubs.reduce((a, s) => a + (s.marks ?? 0), 0);
    const codingX = b.codingSubs.reduce((a, s) => a + (s.maxMarks ?? 10), 0);
    const mcqM = b.mcqSubs.reduce((a, s) => a + (s.marksAwarded || 0), 0);
    const mcqX = b.mcqSubs.reduce((a, s) => a + (getMCQ(s.mcqId)?.marks ?? 1), 0);
    const writeM = b.writingSubs.reduce((a, s) => a + (s.marksAwarded || 0), 0);
    const writeX = b.writingSubs.reduce((a, s) => a + (s.maxMarks || 0), 0);
    const fibM = b.fibSubs.reduce((a, s) => a + (s.marksAwarded || 0), 0);
    const fibX = b.fibSubs.reduce((a, s) => a + (s.maxMarks || 0), 0);
    const total = codingM + mcqM + writeM + fibM;
    const max = codingX + mcqX + writeX + fibX;
    return { codingM, codingX, mcqM, mcqX, writeM, writeX, fibM, fibX, total, max };
  };

  const keyOf = (b) => `${b.student.id}__${b.exam.id}`;
  const lastAt = (b) => [...b.codingSubs, ...b.mcqSubs, ...b.writingSubs, ...b.fibSubs].map((x: any) => x.submittedAt || x.submitted_at).filter(Boolean).sort().pop();
  const shown = buckets.filter(b => (!examFilter || b.exam.id === examFilter) && inRange(lastAt(b), range));
  const reportInput = (b, includeQA = true) => ({ student: { ...b.student, submissions: b.codingSubs }, exam: b.exam, questions, mcqs, writings, fibs, codingSubs: b.codingSubs, mcqSubs: b.mcqSubs, writingSubs: b.writingSubs, fibSubs: b.fibSubs, includeQA, passPct });
  const varsFor = (b) => resultVars(reportInput(b));
  const fill = (t, v) => t.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => v[k] ?? '');
  const targets = mailScope === 'all' ? shown : shown.filter(b => picked.has(keyOf(b)));
  const sample = targets[0];
  const sendResults = async () => {
    if (!targets.length) { toast.error('Select at least one report'); return; }
    setMailing(true);
    try {
      await saveKey('result_template', tpl).catch(() => {});
      if (sendWhen !== 'now') {
        const at = sendWhen === 'custom' ? new Date(sendAtCustom) : new Date(Date.now() + Number(sendWhen) * 60000);
        if (!sendAtCustom && sendWhen === 'custom') throw new Error('Pick the date and time to send');
        const r = await fetch('/api/public/schedule-results', { method: 'POST', headers: await mailRequestHeaders(),
          body: JSON.stringify({ sendAt: at.toISOString(), attachPdf, includeQA: pdfQA, target, passPct, subject: tpl.subject, body: tpl.body, items: targets.map(b => ({ studentId: b.student.id, examId: b.exam.id })) }) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Scheduling failed');
        toast.success(`${j.queued} result email(s) scheduled for ${at.toLocaleString()}`);
        setMailOpen(false); setMailing(false); return;
      }
      let sent = 0, total = 0; const failed = [];
      // With PDFs each student gets their own request (keeps every request small).
      const groups = attachPdf ? targets.map(b => [b]) : [targets];
      for (const group of groups) {
        const items = [];
        for (const b of group) {
          const item = { studentId: b.student.id, vars: varsFor(b) };
          if (attachPdf) { const input = reportInput(b, pdfQA); item.attachments = [{ name: reportFileName(input).slice(0, 110), type: 'application/pdf', data: await reportPdfBase64(input) }]; }
          items.push(item);
        }
        const r = await fetch('/api/public/send-results', { method: 'POST', headers: await mailRequestHeaders(),
          body: JSON.stringify({ attachments, subject: tpl.subject, body: tpl.body, target, items }) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Sending failed');
        sent += j.sent; total += j.total; failed.push(...(j.failed || []));
      }
      toast.success(`Results sent: ${sent} of ${total}`);
      if (failed.length) toast.error(`Failed: ${failed.map(f => f.email).join(', ')}`);
      setMailOpen(false);
    } catch (e) { toast.error(e.message); }
    setMailing(false);
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="portal-banner mb-6 rounded-2xl bg-primary bg-gradient-to-br from-primary to-primary/75 p-6 sm:p-8 text-primary-foreground">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Student Reports</h1>
          <p className="text-primary-foreground/80 text-sm mt-2">Per-test results — view details, download PDF, or email results to students</p>
        </div>

        <section className="mb-5 border-b pb-5 space-y-3"><label className="flex items-center gap-3 font-semibold"><Switch checked={auto.enabled} onCheckedChange={enabled => saveAuto({ ...auto, enabled })} />Auto-send results for every test</label><div className="flex flex-wrap items-center gap-3 text-sm"><select aria-label="Automatic results frequency" className="h-10 rounded-md border bg-background px-3" value={auto.frequency} onChange={e => saveAuto({ ...auto, frequency: e.target.value })}><option value="submit">After each submission</option><option value="daily">Daily completed results</option></select>{auto.frequency === 'daily' ? <input aria-label="Daily result email time" type="time" value={auto.time} className="h-10 rounded-md border bg-background px-3" onChange={e => saveAuto({ ...auto, time: e.target.value })} /> : <label>Delay (minutes) <input aria-label="Result email delay" type="number" min={0} max={10080} className="w-20 h-10 rounded-md border bg-background px-2" value={auto.delayMinutes} onChange={e => setAuto({ ...auto, delayMinutes: Math.max(0, Math.min(10080, Number(e.target.value))) })} onBlur={() => saveAuto(auto)} /></label>}<label className="flex items-center gap-2"><input type="checkbox" checked={auto.attachPdf} onChange={e => saveAuto({ ...auto, attachPdf: e.target.checked })} />Detailed PDF</label><label className="flex items-center gap-2"><input type="checkbox" checked={auto.includeQA} onChange={e => saveAuto({ ...auto, includeQA: e.target.checked })} />Questions & answers</label></div></section>

        <ReportLayoutPicker />
        <div className="mb-5 flex flex-col sm:flex-row flex-wrap gap-4 sm:items-center rounded-2xl border bg-card p-4">
          <select value={examFilter} onChange={e => setExamFilter(e.target.value)} className="h-10 min-w-0 max-w-full rounded-lg border bg-background px-3 text-sm">
            <option value="">All tests</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          <DateRangeFilter value={range} onChange={setRange} />
          <label className="flex flex-wrap items-center gap-2 text-sm"><input type="checkbox" checked={shown.length > 0 && shown.every(b => picked.has(keyOf(b)))} onChange={e => setPicked(e.target.checked ? new Set(shown.map(keyOf)) : new Set())} /> Select all ({picked.size} selected)</label>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <button onClick={recheckFib} disabled={!picked.size || rechecking} className="h-9 px-3 rounded-lg border text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-40"><Type className="w-4 h-4" /> {rechecking ? 'Rechecking…' : 'AI recheck blanks'}</button>
            <button onClick={() => { setMailScope('selected'); setMailOpen(true); }} disabled={!picked.size} className="h-9 px-3 rounded-lg border text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-40"><Mail className="w-4 h-4" /> Email selected</button>
            <button onClick={() => { setMailScope('all'); setMailOpen(true); }} disabled={!shown.length} className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-1.5 shadow disabled:opacity-40"><Send className="w-4 h-4" /> Email results to all</button>
          </div>
        </div>

        <div className="space-y-3">
          {shown.map(b => {
            const key = `${b.student.id}__${b.exam.id}`;
            const m = calcMarks(b);
            const pct = m.max > 0 ? ((m.total / m.max) * 100).toFixed(1) : '0';
            const totalQ = b.codingSubs.length + b.mcqSubs.length + b.writingSubs.length + b.fibSubs.length;
            const sn = b.exam.sectionNames || { coding: 'Coding', mcq: 'MCQ', writing: 'Writing', fib: 'Fill in Blanks' };
            return (
              <div key={key} className="bg-card border rounded-2xl shadow-sm p-5">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div className="flex flex-wrap items-center gap-4 min-w-0">
                    <input type="checkbox" checked={picked.has(key)} onChange={() => setPicked(p => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; })} className="w-4 h-4 accent-primary" />
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
                      {b.student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-sm">{b.student.name}</h3>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs font-medium text-primary">{b.exam.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground break-all">{b.student.email}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>Total submissions: {totalQ}</span>
                        {b.codingSubs.length > 0 && <span>{sn.coding}: {b.codingSubs.length}</span>}
                        {b.mcqSubs.length > 0 && <span>{sn.mcq}: {b.mcqSubs.length}</span>}
                        {b.writingSubs.length > 0 && <span>{sn.writing}: {b.writingSubs.length}</span>}
                        {b.fibSubs.length > 0 && <span>{sn.fib}: {b.fibSubs.length}</span>}
                        <span className="font-semibold text-foreground">Marks: {m.total}/{m.max} ({pct}%)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setPicked(new Set([key])); setMailScope('selected'); setMailOpen(true); }}><Send className="w-3.5 h-3.5 mr-1" />Resend result</Button>
                    <button onClick={() => setExpanded(expanded === key ? null : key)}
                      className="flex flex-wrap items-center gap-1.5 px-3 h-8 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                    <button onClick={() => { setDownloadFor({ student: b.student, exam: b.exam }); setIncludeQA(true); }}
                      className="flex flex-wrap items-center gap-1.5 px-3 h-8 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-all">
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </button>
                  </div>
                </div>

                {expanded === key && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    {b.mcqSubs.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                          <ListChecks className="w-3.5 h-3.5" /> {sn.mcq} ({m.mcqM}/{m.mcqX})
                        </h4>
                        <div className="space-y-1.5">
                          {b.mcqSubs.map(s => {
                            const mc = getMCQ(s.mcqId);
                            if (!mc) return null;
                            return (
                              <div key={s.mcqId} className={`text-xs rounded-lg border p-3 ${s.isCorrect ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'}`}>
                                <div className="flex items-start gap-2">
                                  {s.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />}
                                  <div className="flex-1">
                                    <p className="font-medium text-foreground mb-1">{mc.question}</p>
                                    <p className="text-muted-foreground">Student's Answer: <span className={s.selectedIndex < 0 ? 'italic' : s.isCorrect ? 'text-primary font-medium' : 'text-destructive font-medium'}>{s.selectedIndex >= 0 ? `${String.fromCharCode(65 + s.selectedIndex)}. ${mc.options[s.selectedIndex]}` : 'Not Attempted'}</span></p>
                                    <p className="text-muted-foreground">Correct Answer: <span className="text-primary font-medium">{String.fromCharCode(65 + mc.correctIndex)}. {mc.options[mc.correctIndex]}</span></p>
                                  </div>
                                  <span className="font-semibold tabular-nums">{s.marksAwarded}/{mc.marks}</span>
                                </div>
                                <ResultMarkEditor marks={s.marksAwarded} max={mc.marks ?? 1} correct={s.isCorrect} onSave={(marks, ok) => saveMark(b, 'mcq', s.mcqId, marks, ok)} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {b.writingSubs.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                          <PenLine className="w-3.5 h-3.5" /> {sn.writing} ({m.writeM}/{m.writeX})
                        </h4>
                        <div className="space-y-2">
                          {b.writingSubs.map(ws => {
                            const w = getWriting(ws.writingId);
                            return (
                              <div key={ws.writingId} className="text-xs border rounded-lg p-3 bg-muted/20">
                                <p className="font-medium mb-1">{w?.title}</p>
                                <p className="text-muted-foreground mb-2 whitespace-pre-wrap">{w?.prompt}</p>
                                <pre className="bg-background rounded p-2 whitespace-pre-wrap font-sans">{ws.answerText || '(empty)'}</pre>
                                <p className="text-muted-foreground mt-1">{ws.wordCount} words · {ws.marksAwarded}/{ws.maxMarks} marks</p>
                                <ResultMarkEditor marks={ws.marksAwarded} max={ws.maxMarks} correct={ws.isCorrect ?? ws.marksAwarded > 0} onSave={(marks, ok) => saveMark(b, 'writing', ws.writingId, marks, ok)} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {b.fibSubs.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                          <Type className="w-3.5 h-3.5" /> {sn.fib} ({m.fibM}/{m.fibX})
                        </h4>
                        <div className="space-y-1.5">
                          {b.fibSubs.map(fs => {
                            const f = getFib(fs.fibId);
                            if (!f) return null;
                            return (
                              <div key={fs.fibId} className={`text-xs rounded-lg border p-3 ${fs.isCorrect ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'}`}>
                                <p className="font-medium text-foreground mb-1">{f.sentence}</p>
                                <p className="text-muted-foreground">Student's Answers: <span className={fs.isCorrect ? 'text-primary' : 'text-destructive'}>{(fs.answers || []).join(', ') || '—'}</span></p>
                                <p className="text-muted-foreground">Correct: <span className="text-primary">{(f.answers || []).join(', ')}</span></p>
                                <p className="text-muted-foreground">{fs.marksAwarded}/{fs.maxMarks} marks</p>
                                <ResultMarkEditor marks={fs.marksAwarded} max={fs.maxMarks} correct={fs.isCorrect} onSave={(marks, ok) => saveMark(b, 'fib', fs.fibId, marks, ok)} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {b.codingSubs.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5" /> {sn.coding} ({m.codingM}/{m.codingX})
                        </h4>
                        <div className="space-y-2">
                          {b.codingSubs.map(sub => {
                            const q = getQuestion(sub.questionId);
                            const subKey = `${key}-${sub.questionId}`;
                            const isOpen = expandedSub === subKey;
                            return (
                              <div key={sub.questionId} className="border rounded-lg overflow-hidden">
                                <button onClick={() => setExpandedSub(isOpen ? null : subKey)}
                                  className="w-full flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-3 hover:bg-muted/50 text-left">
                                  <div className="flex flex-wrap items-center gap-3">
                                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    <span className="text-sm font-medium">{q?.title || sub.questionId}</span>
                                    <span className="text-xs text-muted-foreground">{sub.language}</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-xs">
                                    <span className="text-primary">Public: {sub.passedPublic}/{sub.totalPublic}</span>
                                    <span>Private: {sub.passedPrivate}/{sub.totalPrivate}</span>
                                    <span className="font-bold">{sub.marks ?? 0}/{sub.maxMarks ?? 10}</span>
                                  </div>
                                </button>
                                {isOpen && (
                                  <div className="border-t p-3">
                                    <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">{sub.code}</pre>
                                    <ResultMarkEditor marks={sub.marks ?? 0} max={sub.maxMarks ?? 10} correct={sub.isCorrect ?? (sub.marks > 0)} onSave={(marks, ok) => saveMark(b, 'coding', sub.questionId, marks, ok)} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {buckets.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No submissions yet.</p>
            </div>
          )}
        </div>
      </div>

      {downloadFor && (() => {
        const { student, exam } = downloadFor;
        const corrected = buckets.find(b => b.student.id === student.id && b.exam.id === exam.id);
        const scopedStudent: Student = { ...student, submissions: corrected?.codingSubs || [] };
        const scopedMcqSubs = corrected?.mcqSubs || [];
        return (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDownloadFor(null)}>
            <div className="bg-card border rounded-2xl p-6 max-w-md w-full shadow-lg" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-1">Download Report</h3>
              <p className="text-sm text-muted-foreground mb-4">{student.name} · <span className="text-primary">{exam.title}</span></p>
              <div className="space-y-2 mb-5">
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <input type="radio" name="dl" checked={includeQA} onChange={() => setIncludeQA(true)} className="mt-1" />
                  <div>
                    <div className="text-sm font-medium">Include questions &amp; answers</div>
                    <div className="text-xs text-muted-foreground">Every question, the student's answer, the correct answer and tips to improve.</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <input type="radio" name="dl" checked={!includeQA} onChange={() => setIncludeQA(false)} className="mt-1" />
                  <div>
                    <div className="text-sm font-medium">Score summary only</div>
                    <div className="text-xs text-muted-foreground">Marks and integrity metrics — no question text or answers.</div>
                  </div>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDownloadFor(null)} className="px-4 h-9 text-sm rounded-lg border hover:bg-muted">Cancel</button>
                <button
                  onClick={() => { generatePdfReport(scopedStudent, questions, mcqs, scopedMcqSubs, { includeQuestionsAndAnswers: includeQA, examTitle: exam.title, exam, writings, fibs, writingSubs: corrected?.writingSubs || [], fibSubs: corrected?.fibSubs || [] }); setDownloadFor(null); }}
                  className="px-4 h-9 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {mailOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setMailOpen(false)}>
          <div className="bg-card border rounded-2xl shadow-sm w-full max-w-3xl max-h-[90vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /> Email results</h3>
              <button onClick={() => setMailOpen(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{mailScope === 'all' ? 'All' : 'Selected'} reports: <span className="font-semibold text-foreground">{targets.length}</span> email(s) will be sent.</p>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <input value={tpl.subject} onChange={e => setTpl({ ...tpl, subject: e.target.value })} className="w-full h-10 px-3 rounded-lg border bg-background text-sm" placeholder="Subject" />
                <MailTemplateEditor body={tpl.body} onChange={body => setTpl(t => ({ ...t, body }))} subject={tpl.subject} onSubjectChange={subject => setTpl(t => ({ ...t, subject }))} purpose="test result announcement" variables={RESULT_VARS} preview={false} /><MailAttachments value={attachments} onChange={setAttachments} />
                <p className="text-[11px] text-muted-foreground">Variables: {RESULT_VARS}</p>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <select value={target} onChange={e => setTarget(e.target.value)} className="h-9 rounded-lg border bg-background px-2"><option value="personal">Personal email</option><option value="login">Login email</option></select>
                  <label className="flex flex-wrap items-center gap-1.5">Pass mark <input type="number" min={0} max={100} value={passPct} onChange={e => setPassPct(Number(e.target.value))} className="w-16 h-9 px-2 rounded-lg border bg-background" />%</label>
                  <button onClick={() => setTpl(DEFAULT_RESULT_TEMPLATE)} className="text-xs underline text-muted-foreground">Reset template</button>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3 space-y-2 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={attachPdf} onChange={e => setAttachPdf(e.target.checked)} className="accent-primary" /> Attach detailed PDF report</label>
                  {attachPdf && <label className="flex items-center gap-2 pl-6 text-xs"><input type="checkbox" checked={pdfQA} onChange={e => setPdfQA(e.target.checked)} className="accent-primary" /> Include questions, student answers &amp; correct answers</label>}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-medium">Send:</span>
                    {[['now', 'Now'], ['5', 'In 5 min'], ['10', 'In 10 min'], ['30', 'In 30 min'], ['custom', 'Pick time']].map(([v, l]) => (
                      <button key={v} type="button" onClick={() => setSendWhen(v)} className={`h-8 px-3 rounded-lg border text-xs font-medium ${sendWhen === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground hover:bg-muted'}`}>{l}</button>
                    ))}
                  </div>
                  {sendWhen === 'custom' && <input type="datetime-local" value={sendAtCustom} onChange={e => setSendAtCustom(e.target.value)} className="h-9 w-full max-w-xs rounded-lg border bg-background px-2 text-sm" />}
                </div>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Preview {sample ? `· ${sample.student.name}` : ''}</p>
                <div className="rounded-2xl border bg-muted/40 p-4 text-sm">
                  {sample ? (<>
                    <p className="font-semibold mb-2">{fill(tpl.subject, { ...varsFor(sample), name: sample.student.name, email: sample.student.email })}</p>
                    <MailPreview body={tpl.body} vars={{ ...varsFor(sample), name: sample.student.name, email: sample.student.email }} />
                  </>) : <p className="text-muted-foreground">No reports selected.</p>}
                </div>
                <div className="mt-3 max-h-32 overflow-auto text-xs space-y-1">
                  {targets.map(b => <div key={keyOf(b)} className="flex justify-between"><span>{b.student.name}</span><span className="text-muted-foreground">{b.exam.title} · {varsFor(b).percentage}%</span></div>)}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setMailOpen(false)} className="px-4 h-10 text-sm rounded-lg border hover:bg-muted">Cancel</button>
              <button onClick={sendResults} disabled={mailing || !targets.length} className="px-4 h-10 text-sm rounded-lg bg-primary text-primary-foreground font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"><Send className="w-4 h-4" /> {mailing ? 'Working…' : sendWhen === 'now' ? `Send ${targets.length} email(s)` : `Schedule ${targets.length} email(s)`}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

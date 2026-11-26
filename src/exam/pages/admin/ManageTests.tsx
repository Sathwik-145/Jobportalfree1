// @ts-nocheck
import GenerateQuestions from '@/exam/components/GenerateQuestions';
import { useState, useEffect } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { Exam } from '@/exam/types';
import { generateId } from '@/exam/data/sampleData';
import { buildStarterPack } from '@/exam/data/starterPack';
import { Plus, Play, Calendar, StopCircle, Pencil, Trash2, X, Clock, FileCode2, Timer, TimerOff, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchExamCompletedStudentIds } from '@/exam/lib/supabase-helpers';
import { fetchKey, saveKey } from '@/exam/lib/codexamSettings';
import { Button } from '@/components/ui/button';
import { bulkTestStatus } from '@/exam/lib/testActions';
import { upsertExam } from '@/exam/lib/supabase-helpers';

const KINDS = [['mcq', 'Multiple choice'], ['fib', 'Fill in the blanks'], ['writing', 'Writing'], ['coding', 'Coding']] as const;
const DEFAULT_RESULT_CFG = { enabled: false, delayMinutes: 0, attachPdf: true, includeQA: true, target: 'personal', passPct: 40 };

export default function ManageTests() {
  const { exams, setExams, questions, students, setStudents, mcqs, setMcqs, writings, fibs } = useAuth();
  const addStarter = () => {
    const pack = buildStarterPack();
    const haveE = new Set(exams.map(e => e.id)); const haveM = new Set(mcqs.map(m => m.id));
    const newM = pack.mcqs.filter(m => !haveM.has(m.id)); const newE = pack.exams.filter(e => !haveE.has(e.id));
    if (!newE.length) return toast.info('Starter tests are already added');
    setMcqs(prev => [...prev, ...newM]); setExams(prev => [...prev, ...newE]);
    toast.success(`Added ${newE.length} tests (as drafts) with ${newM.length} questions`);
  };
  const [editing, setEditing] = useState<Exam | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());
  const [pendingAssign, setPendingAssign] = useState<{ studentId: string } | null>(null);
  const [bulkRetakeMode, setBulkRetakeMode] = useState<'ask' | 'retake' | 'skip'>('ask');
  const [restartingExam, setRestartingExam] = useState<Exam | null>(null);
  const [restartMode, setRestartMode] = useState<'immediate' | 'schedule'>('immediate');
  const [restartDate, setRestartDate] = useState('');
  const [restartTime, setRestartTime] = useState('');
  const [kinds, setKinds] = useState({ mcq: true, fib: true, writing: true, coding: true });
  const [resultCfgs, setResultCfgs] = useState({});
  const [resultCfg, setResultCfg] = useState(DEFAULT_RESULT_CFG);
  const [bulkBusy, setBulkBusy] = useState(false);
  const changeAll = async (action: 'start' | 'end') => {
    if (!exams.length || !confirm(action === 'start' ? 'Start all tests now? Scheduled dates will be cleared. Existing submissions and student assignments are kept.' : 'End all tests now? Existing submissions are kept.')) return;
    setBulkBusy(true);
    try {
      const next = bulkTestStatus(exams, action, new Date().toISOString());
      await Promise.all(next.map(upsertExam));
      setExams(next);
      toast.success(action === 'start' ? 'All tests started' : 'All tests ended');
    } catch (error) { toast.error(error.message || 'Could not update all tests'); }
    finally { setBulkBusy(false); }
  };
  useEffect(() => { fetchKey('result_auto_send', {}).then(v => setResultCfgs(v || {})).catch(() => {}); }, []);
  useEffect(() => {
    if (!editing) return;
    const has = { mcq: (editing.mcqIds || []).length > 0, fib: (editing.fibIds || []).length > 0, writing: (editing.writingIds || []).length > 0, coding: (editing.questionIds || []).length > 0 };
    setKinds(Object.values(has).some(Boolean) ? has : { mcq: true, fib: true, writing: true, coding: true });
    setResultCfg({ ...DEFAULT_RESULT_CFG, ...(resultCfgs[editing.id] || {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id]);

  const emptyExam = (): Exam => ({
    id: generateId(),
    title: '',
    description: '',
    questionIds: [],
    mcqIds: [],
    writingIds: [],
    fibIds: [],
    sectionNames: { coding: 'Coding', mcq: 'Multiple Choice', writing: 'Writing', fib: 'Fill in the Blanks' },
    assignedStudentIds: [],
    status: 'draft',
    createdAt: new Date().toISOString(),
    isTimed: true,
    startBufferMinutes: 10,
    examDurationMinutes: 60,
    allowCopyPaste: true,
  });
  const normalizeExam = (exam: Exam): Exam => ({
    ...emptyExam(),
    ...exam,
    questionIds: Array.isArray(exam.questionIds) ? exam.questionIds : [],
    mcqIds: Array.isArray(exam.mcqIds) ? exam.mcqIds : [],
    writingIds: Array.isArray(exam.writingIds) ? exam.writingIds : [],
    fibIds: Array.isArray(exam.fibIds) ? exam.fibIds : [],
    assignedStudentIds: Array.isArray(exam.assignedStudentIds) ? exam.assignedStudentIds : [],
    sectionNames: exam.sectionNames || { coding: 'Coding', mcq: 'Multiple Choice', writing: 'Writing', fib: 'Fill in the Blanks' },
  });

  const getBufferDeadline = (exam: Exam) => {
    if (!exam.startedAt) return null;
    return new Date(new Date(exam.startedAt).getTime() + (exam.startBufferMinutes ?? 0) * 60 * 1000);
  };

  // Fetch students who have already submitted this exam
  useEffect(() => {
    if (!editing) { setCompletedSet(new Set()); setBulkRetakeMode('ask'); return; }
    fetchExamCompletedStudentIds(editing.id, editing.questionIds || [])
      .then(setCompletedSet)
      .catch(() => setCompletedSet(new Set()));
  }, [editing?.id, editing?.questionIds?.join(',')]);

  // Students who are assigned AND already completed this exam
  const assignedCompletedIds = editing
    ? (editing.assignedStudentIds || []).filter(id => completedSet.has(id))
    : [];

  const handleSave = () => {
    if (!editing || !editing.title.trim()) return;
    if (!Object.values(kinds).some(Boolean)) { toast.error('Choose at least one question type'); return; }
    if (!kinds.mcq) editing.mcqIds = [];
    if (!kinds.fib) editing.fibIds = [];
    if (!kinds.writing) editing.writingIds = [];
    if (!kinds.coding) editing.questionIds = [];
    if (![...(editing.mcqIds || []), ...(editing.fibIds || []), ...(editing.writingIds || []), ...(editing.questionIds || [])].length) { toast.error('Select at least one question'); return; }
    const nextCfgs = { ...resultCfgs, [editing.id]: resultCfg };
    setResultCfgs(nextCfgs);
    saveKey('result_auto_send', nextCfgs).catch(() => toast.error('Could not save the result email settings'));

    // Determine which assigned-completed students should get retake access
    const grantRetakeIds = bulkRetakeMode === 'retake' ? assignedCompletedIds : [];

    if (assignedCompletedIds.length > 0 && bulkRetakeMode === 'ask') {
      toast.error(`${assignedCompletedIds.length} assigned student(s) already submitted. Choose "Allow retake" or "Skip completed" first.`);
      return;
    }

    if (bulkRetakeMode === 'skip' && assignedCompletedIds.length > 0) {
      // Remove already-completed students from assignment
      editing.assignedStudentIds = (editing.assignedStudentIds || []).filter(id => !completedSet.has(id));
    }

    setExams(prev => {
      const idx = prev.findIndex(e => e.id === editing.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = editing;
        return copy;
      }
      return [...prev, editing];
    });

    // Grant retake to selected students
    if (grantRetakeIds.length > 0) {
      setStudents(prev => prev.map(s => {
        if (!grantRetakeIds.includes(s.id)) return s;
        const current = s.retakeExamIds || [];
        if (current.includes(editing.id)) return s;
        return { ...s, retakeExamIds: [...current, editing.id] };
      }));
      toast.success(`Test saved. Retake granted to ${grantRetakeIds.length} student(s).`);
    } else {
      toast.success('Test saved');
    }

    setEditing(null);
    setBulkRetakeMode('ask');
  };

  const handleStart = (id: string) => {
    setExams(prev => prev.map(e =>
      e.id === id ? { ...e, status: 'active' as const, startedAt: new Date().toISOString() } : e
    ));
    toast.success('Test started! Students can now take this test.');
  };

  const handleSchedule = (id: string) => {
    if (!scheduleDate || !scheduleTime) {
      toast.error('Please set date and time');
      return;
    }

    const exam = exams.find(e => e.id === id);
    if (!exam) return;

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

    setExams(prev => prev.map(e =>
      e.id === id ? { ...e, status: 'scheduled' as const, scheduledAt } : e
    ));

    toast.success(`Test scheduled for ${new Date(scheduledAt).toLocaleString()}. Students will have ${exam.startBufferMinutes} min to start after activation.`);
  };

  const handleEnd = (id: string) => {
    setExams(prev => prev.map(e =>
      e.id === id ? { ...e, status: 'ended' as const, endedAt: new Date().toISOString() } : e
    ));
    toast.success('Test ended');
  };

  const handleDelete = (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    scheduled: 'bg-warning/10 text-warning',
    active: 'bg-primary/10 text-primary',
    ended: 'bg-destructive/10 text-destructive',
  };

  if (editing) {
    return (
      <AdminLayout>
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 mb-6 rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{editing.title ? 'Edit Test' : 'New Test'}</h1>
            <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 rounded-2xl border bg-card p-5 sm:p-8 shadow-sm">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Test Title</label>
              <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. Mid-Term Coding Assessment" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}
                rows={3} className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                placeholder="Brief description of this test..." />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Test Type</label>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setEditing({ ...editing, isTimed: true })}
                  className={`flex items-center gap-2 px-4 h-10 rounded-lg border text-sm font-medium transition-colors ${
                    editing.isTimed ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground hover:text-foreground'
                  }`}>
                  <Timer className="w-4 h-4" /> Timed
                </button>
                <button
                  onClick={() => setEditing({ ...editing, isTimed: false })}
                  className={`flex items-center gap-2 px-4 h-10 rounded-lg border text-sm font-medium transition-colors ${
                    !editing.isTimed ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground hover:text-foreground'
                  }`}>
                  <TimerOff className="w-4 h-4" /> Untimed
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {editing.isTimed ? 'The entire exam has a single countdown timer.' : 'Students can take as long as they need.'}
              </p>
            </div>

            {editing.isTimed && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Exam Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={editing.examDurationMinutes}
                  onChange={e => setEditing({ ...editing, examDurationMinutes: Math.max(1, Number(e.target.value) || 60) })}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="60"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Total time for the entire exam across all questions.
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block">Start Buffer (minutes)</label>
              <input
                type="number"
                min="0"
                value={editing.startBufferMinutes}
                onChange={e => setEditing({ ...editing, startBufferMinutes: Math.max(0, Number(e.target.value) || 0) })}
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Window after activation for students to start. E.g. if exam activates at 2:00 PM with 10 min buffer, students can start between 2:00–2:10 PM.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Copy-Paste Control</label>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setEditing({ ...editing, allowCopyPaste: true })}
                  className={`flex items-center gap-2 px-4 h-10 rounded-lg border text-sm font-medium transition-colors ${
                    editing.allowCopyPaste ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground hover:text-foreground'
                  }`}>
                  Allowed
                </button>
                <button
                  onClick={() => setEditing({ ...editing, allowCopyPaste: false })}
                  className={`flex items-center gap-2 px-4 h-10 rounded-lg border text-sm font-medium transition-colors ${
                    !editing.allowCopyPaste ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-background text-muted-foreground hover:text-foreground'
                  }`}>
                  Disabled
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {editing.allowCopyPaste ? 'Students can paste code from outside into the editor.' : 'Students cannot paste code from outside. Copy-paste within the editor is still allowed.'}
              </p>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <label className="text-sm font-semibold mb-1 block">Question types in this test</label>
              <p className="text-xs text-muted-foreground mb-3">Pick only what you need — e.g. MCQs only, or MCQ + fill in the blanks with no coding.</p>
              <div className="flex flex-wrap gap-2">
                {KINDS.map(([k, label]) => (
                  <button key={k} type="button" onClick={() => setKinds(v => ({ ...v, [k]: !v[k] }))}
                    className={`h-9 px-3 rounded-lg border text-sm font-medium transition-colors ${kinds[k] ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground hover:bg-muted'}`}>
                    {kinds[k] ? '✓ ' : ''}{label}
                  </button>
                ))}
                <button type="button" onClick={() => setKinds({ mcq: true, fib: false, writing: false, coding: false })} className="h-9 px-3 rounded-lg border border-dashed text-xs text-muted-foreground hover:text-foreground">MCQ only</button>
              </div>
            </div>

            {kinds.coding && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Select Coding Questions</label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {questions.length === 0 && <p className="text-xs text-muted-foreground">No coding questions available.</p>}
                {questions.map(q => (
                  <label key={q.id} className="flex flex-wrap items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <input type="checkbox" checked={(editing.questionIds || []).includes(q.id)}
                      onChange={e => {
                        const current = editing.questionIds || [];
                        if (e.target.checked) setEditing({ ...editing, questionIds: [...current, q.id] });
                        else setEditing({ ...editing, questionIds: current.filter(id => id !== q.id) });
                      }}
                      className="rounded" />
                    <span className="text-sm font-medium flex-1 min-w-0 break-words">{q.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      q.difficulty === 'easy' ? 'bg-primary/10 text-primary' :
                      q.difficulty === 'medium' ? 'bg-warning/10 text-warning' :
                      'bg-destructive/10 text-destructive'
                    }`}>{q.difficulty}</span>
                  </label>
                ))}
              </div>
            </div>
            )}

            <div className="border rounded-lg p-4 bg-muted/20">
              <label className="text-sm font-semibold mb-2 block">Section Names (editable — shown to students)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['coding','mcq','writing','fib'] as const).map(k => (
                  <div key={k}>
                    <label className="text-xs text-muted-foreground capitalize">{k}</label>
                    <input value={editing.sectionNames?.[k] ?? ''} onChange={e => setEditing({ ...editing, sectionNames: { ...editing.sectionNames, [k]: e.target.value } })}
                      className="w-full h-9 px-2 rounded-lg border bg-background text-sm" />
                  </div>
                ))}
              </div>
            </div>

            {kinds.writing && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Select Writing Questions ({(editing.writingIds || []).length})</label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {writings.length === 0 && <p className="text-xs text-muted-foreground">No writing questions yet. Add some in the Writing tab.</p>}
                {writings.map(w => (
                  <label key={w.id} className="flex flex-wrap items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <input type="checkbox" checked={(editing.writingIds || []).includes(w.id)}
                      onChange={e => {
                        const cur = editing.writingIds || [];
                        setEditing({ ...editing, writingIds: e.target.checked ? [...cur, w.id] : cur.filter(id => id !== w.id) });
                      }} className="rounded" />
                    <span className="text-sm flex-1">{w.title}</span>
                    <span className="text-xs text-muted-foreground">{w.marks} marks</span>
                  </label>
                ))}
              </div>
            </div>
            )}

            {kinds.fib && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Select Fill-in-Blanks ({(editing.fibIds || []).length})</label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {fibs.length === 0 && <p className="text-xs text-muted-foreground">No fill-in-blanks yet. Add some in the FIB tab.</p>}
                {fibs.map(f => (
                  <label key={f.id} className="flex flex-wrap items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <input type="checkbox" checked={(editing.fibIds || []).includes(f.id)}
                      onChange={e => {
                        const cur = editing.fibIds || [];
                        setEditing({ ...editing, fibIds: e.target.checked ? [...cur, f.id] : cur.filter(id => id !== f.id) });
                      }} className="rounded" />
                    <span className="text-sm flex-1 truncate">{f.sentence}</span>
                    <span className="text-xs text-muted-foreground">{f.marks}m</span>
                  </label>
                ))}
              </div>
            </div>
            )}

            {kinds.mcq && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">Select MCQs ({(editing.mcqIds || []).length} selected)</label>
                {mcqs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = (editing.mcqIds || []).length === mcqs.length;
                      setEditing({ ...editing, mcqIds: allSelected ? [] : mcqs.map(m => m.id) });
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    {(editing.mcqIds || []).length === mcqs.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {mcqs.length === 0 && <p className="text-xs text-muted-foreground">No MCQs available. Create some in the MCQs tab.</p>}
                {mcqs.map(m => (
                  <label key={m.id} className="flex flex-wrap items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <input type="checkbox" checked={(editing.mcqIds || []).includes(m.id)}
                      onChange={e => {
                        const current = editing.mcqIds || [];
                        if (e.target.checked) setEditing({ ...editing, mcqIds: [...current, m.id] });
                        else setEditing({ ...editing, mcqIds: current.filter(id => id !== m.id) });
                      }}
                      className="rounded" />
                    <span className="text-sm flex-1 truncate">{m.question}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      m.difficulty === 'easy' ? 'bg-primary/10 text-primary' :
                      m.difficulty === 'medium' ? 'bg-warning/10 text-warning' :
                      'bg-destructive/10 text-destructive'
                    }`}>{m.difficulty}</span>
                  </label>
                ))}
              </div>
            </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block">Assign Students</label>
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students added yet. Add students first.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  <label className="flex flex-wrap items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border-b pb-3 mb-1">
                    <input type="checkbox"
                      checked={(editing.assignedStudentIds || []).length === students.length}
                      onChange={e => {
                        if (e.target.checked) setEditing({ ...editing, assignedStudentIds: students.map(s => s.id) });
                        else setEditing({ ...editing, assignedStudentIds: [] });
                      }}
                      className="rounded" />
                    <span className="text-sm font-medium">Select All ({students.length})</span>
                  </label>
                  {students.map(s => {
                    const alreadyDone = completedSet.has(s.id);
                    return (
                      <label key={s.id} className="flex flex-wrap items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                        <input type="checkbox" checked={(editing.assignedStudentIds || []).includes(s.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              if (alreadyDone) {
                                setPendingAssign({ studentId: s.id });
                              } else {
                                setEditing({ ...editing, assignedStudentIds: [...(editing.assignedStudentIds || []), s.id] });
                              }
                            } else {
                              setEditing({ ...editing, assignedStudentIds: (editing.assignedStudentIds || []).filter(id => id !== s.id) });
                            }
                          }}
                          className="rounded" />
                        <span className="text-sm font-medium flex-1 min-w-0 break-words">{s.name}</span>
                        {alreadyDone && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">Already submitted</span>
                        )}
                        <span className="text-xs text-muted-foreground break-all">{s.email}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Bulk completion warning */}
              {assignedCompletedIds.length > 0 && (
                <div className="mt-3 p-3 rounded-lg border border-warning/30 bg-warning/5">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-warning">{assignedCompletedIds.length} of the selected students already submitted this test.</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Choose how to handle them:</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button type="button"
                      onClick={() => setBulkRetakeMode('retake')}
                      className={`text-xs px-3 h-8 rounded-lg border font-medium transition-colors ${
                        bulkRetakeMode === 'retake' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
                      }`}>
                      Allow retake (give access to everyone)
                    </button>
                    <button type="button"
                      onClick={() => setBulkRetakeMode('skip')}
                      className={`text-xs px-3 h-8 rounded-lg border font-medium transition-colors ${
                        bulkRetakeMode === 'skip' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
                      }`}>
                      Ignore completed (assign only remaining)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Per-student "already submitted" confirmation popup */}
            {pendingAssign && (
              <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-card border rounded-2xl shadow-lg p-6 max-w-sm">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    <h3 className="font-semibold">Already Submitted</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    <span className="font-medium text-foreground">{students.find(s => s.id === pendingAssign.studentId)?.name}</span> has already submitted this test. Assign anyway and grant a retake?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setPendingAssign(null)}
                      className="flex-1 h-9 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80">
                      Cancel
                    </button>
                    <button onClick={() => {
                      setEditing({ ...editing, assignedStudentIds: [...(editing.assignedStudentIds || []), pendingAssign.studentId] });
                      setBulkRetakeMode('retake');
                      setPendingAssign(null);
                    }}
                      className="flex-1 h-9 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
                      Assign & Retake
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={resultCfg.enabled} onChange={e => setResultCfg({ ...resultCfg, enabled: e.target.checked })} className="w-4 h-4 accent-primary" /> Email results automatically after a student submits</label>
              {resultCfg.enabled && <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium">Send:</span>
                  {[[0, 'Immediately'], [5, 'After 5 min'], [10, 'After 10 min'], [30, 'After 30 min'], [60, 'After 1 hour']].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setResultCfg({ ...resultCfg, delayMinutes: v })} className={`h-8 px-3 rounded-lg border text-xs font-medium ${Number(resultCfg.delayMinutes) === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground hover:bg-muted'}`}>{l}</button>
                  ))}
                  <label className="flex items-center gap-1 text-xs">Custom <input type="number" min={0} max={10080} value={resultCfg.delayMinutes} onChange={e => setResultCfg({ ...resultCfg, delayMinutes: Math.max(0, Number(e.target.value)) })} className="w-20 h-8 px-2 rounded-lg border bg-background" /> min</label>
                </div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={resultCfg.attachPdf} onChange={e => setResultCfg({ ...resultCfg, attachPdf: e.target.checked })} className="accent-primary" /> Attach detailed PDF report</label>
                {resultCfg.attachPdf && <label className="flex items-center gap-2 text-sm pl-6"><input type="checkbox" checked={resultCfg.includeQA} onChange={e => setResultCfg({ ...resultCfg, includeQA: e.target.checked })} className="accent-primary" /> Include questions, student's answers, correct answers &amp; improvement tips</label>}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <select value={resultCfg.target} onChange={e => setResultCfg({ ...resultCfg, target: e.target.value })} className="h-9 rounded-lg border bg-background px-2"><option value="personal">Personal email</option><option value="login">Login email</option></select>
                  <label className="flex items-center gap-1.5">Pass mark <input type="number" min={0} max={100} value={resultCfg.passPct} onChange={e => setResultCfg({ ...resultCfg, passPct: Number(e.target.value) })} className="w-16 h-9 px-2 rounded-lg border bg-background" />%</label>
                </div>
                <p className="text-xs text-muted-foreground">Uses the result email template from Student Reports. Delayed emails go out on the next mail-timer run.</p>
              </>}
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <button onClick={handleSave}
                className="px-6 h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all">
                Save Test
              </button>
              <button onClick={() => setEditing(null)}
                className="px-6 h-10 bg-muted text-foreground rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 mb-6 rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tests</h1>
            <GenerateQuestions type="test" />
            <p className="text-muted-foreground text-sm">Create, schedule and manage tests — MCQ, fill in the blanks, writing and coding</p>
          </div>
          <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={bulkBusy || !exams.length} onClick={() => changeAll('start')}><Play className="w-4 h-4" />Start all tests</Button>
          <Button variant="destructive" disabled={bulkBusy || !exams.length} onClick={() => changeAll('end')}><StopCircle className="w-4 h-4" />End all tests</Button>
          <button onClick={addStarter} className="flex flex-wrap items-center gap-2 px-4 h-10 rounded-lg border bg-card font-medium text-sm hover:bg-muted"><FileCode2 className="w-4 h-4" /> Add 20 starter tests</button>
          <button onClick={() => setEditing(emptyExam())}
            className="flex flex-wrap items-center gap-2 px-4 h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all">
            <Plus className="w-4 h-4" /> Create Test
          </button>
          </div>
        </div>

        <div className="space-y-4">
          {exams.map(exam => {
            const bufferDeadline = getBufferDeadline(exam);

            return (
              <div key={exam.id} className="bg-card border rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold">{exam.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[exam.status]}`}>
                        {exam.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        exam.isTimed ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {exam.isTimed ? '⏱ Timed' : '∞ Untimed'}
                      </span>
                      {!exam.allowCopyPaste && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-destructive/10 text-destructive">
                          No Paste
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{exam.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {[[(exam.mcqIds || []).length, 'MCQ'], [(exam.fibIds || []).length, 'blanks'], [(exam.writingIds || []).length, 'writing'], [(exam.questionIds || []).length, 'coding']].filter(([n]) => n > 0).map(([n, l]) => `${n} ${l}`).join(' · ') || 'No questions'}
                      {' · '}{exam.assignedStudentIds?.length || 0} student{(exam.assignedStudentIds?.length || 0) !== 1 ? 's' : ''} assigned
                      {exam.scheduledAt && ` · Scheduled: ${new Date(exam.scheduledAt).toLocaleString()}`}
                      {typeof exam.startBufferMinutes === 'number' && ` · Buffer: ${exam.startBufferMinutes} min`}
                      {exam.startedAt && ` · Started: ${new Date(exam.startedAt).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(exam.status === 'draft' || exam.status === 'scheduled') && (
                      <button onClick={() => setEditing(normalizeExam(exam))} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                    {(exam.status === 'active' || exam.status === 'ended') && (
                      <button onClick={() => setEditing(normalizeExam(exam))} className="p-2 hover:bg-muted rounded-lg transition-colors" title="Edit students">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(exam.id)} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>

                {exam.status === 'draft' && (
                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t">
                    <button onClick={() => handleStart(exam.id)}
                      className="flex flex-wrap items-center gap-1.5 px-4 h-9 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all">
                      <Play className="w-3.5 h-3.5" /> Start Now
                    </button>
                    <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
                      <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                        className="h-9 min-w-0 w-full sm:w-auto px-3 text-xs rounded-lg border bg-background" />
                      <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                        className="h-9 min-w-0 w-full sm:w-auto px-3 text-xs rounded-lg border bg-background" />
                      <button onClick={() => handleSchedule(exam.id)}
                        className="flex flex-wrap items-center gap-1.5 px-4 h-9 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 active:scale-[0.98] transition-all">
                        <Calendar className="w-3.5 h-3.5" /> Schedule
                      </button>
                    </div>
                  </div>
                )}

                {exam.status === 'scheduled' && exam.scheduledAt && (
                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t">
                    <span className="flex flex-wrap items-center gap-1.5 text-sm text-warning">
                      <Clock className="w-4 h-4" /> Activates at {new Date(exam.scheduledAt).toLocaleString()} · Students have {exam.startBufferMinutes} min to start
                    </span>
                    <button onClick={() => handleStart(exam.id)}
                      className="flex flex-wrap items-center gap-1.5 px-4 h-9 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all">
                      <Play className="w-3.5 h-3.5" /> Start Now
                    </button>
                  </div>
                )}

                {exam.status === 'active' && (
                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t">
                    <span className="text-sm text-primary font-medium animate-pulse">● Live</span>
                    <button onClick={() => handleEnd(exam.id)}
                      className="flex flex-wrap items-center gap-1.5 px-4 h-9 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all">
                      <StopCircle className="w-3.5 h-3.5" /> End Test
                    </button>
                  </div>
                )}

                {exam.status === 'ended' && (
                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t">
                    <span className="text-sm text-muted-foreground">Ended at {new Date(exam.endedAt!).toLocaleString()}</span>
                    <button onClick={() => {
                      setRestartingExam(exam);
                      setRestartMode('immediate');
                      setRestartDate('');
                      setRestartTime('');
                    }}
                      className="flex flex-wrap items-center gap-1.5 px-4 h-9 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all">
                      <Play className="w-3.5 h-3.5" /> Restart Test
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {exams.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <FileCode2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No tests yet. Create your first one.</p>
            </div>
          )}
        </div>

        {/* Restart dialog */}
        {restartingExam && (
          <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border rounded-2xl shadow-lg p-6 max-w-md w-full">
              <h3 className="font-semibold text-lg mb-1">Restart "{restartingExam.title}"</h3>
              <p className="text-sm text-muted-foreground mb-5">Choose when this test should become available again.</p>

              <div className="grid grid-cols-2 gap-2 mb-5">
                <button
                  onClick={() => setRestartMode('immediate')}
                  className={`flex items-center justify-center gap-2 h-11 rounded-lg border text-sm font-medium transition-colors ${
                    restartMode === 'immediate' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
                  }`}>
                  <Play className="w-4 h-4" /> Start Immediately
                </button>
                <button
                  onClick={() => setRestartMode('schedule')}
                  className={`flex items-center justify-center gap-2 h-11 rounded-lg border text-sm font-medium transition-colors ${
                    restartMode === 'schedule' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
                  }`}>
                  <Calendar className="w-4 h-4" /> Schedule for Later
                </button>
              </div>

              {restartMode === 'schedule' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
                    <input type="date" value={restartDate} onChange={e => setRestartDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border bg-background text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Time</label>
                    <input type="time" value={restartTime} onChange={e => setRestartTime(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border bg-background text-sm" />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-end">
                <button onClick={() => setRestartingExam(null)}
                  className="px-4 h-10 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80">
                  Cancel
                </button>
                <button onClick={() => {
                  if (!restartingExam) return;
                  if (restartMode === 'immediate') {
                    setExams(prev => prev.map(e => e.id === restartingExam.id
                      ? { ...e, status: 'active' as const, startedAt: new Date().toISOString(), endedAt: undefined }
                      : e));
                    toast.success('Test restarted and is now live.');
                  } else {
                    if (!restartDate || !restartTime) {
                      toast.error('Pick a date and time first.');
                      return;
                    }
                    const scheduledAt = new Date(`${restartDate}T${restartTime}`).toISOString();
                    setExams(prev => prev.map(e => e.id === restartingExam.id
                      ? { ...e, status: 'scheduled' as const, scheduledAt, startedAt: undefined, endedAt: undefined }
                      : e));
                    toast.success(`Test scheduled for ${new Date(scheduledAt).toLocaleString()}.`);
                  }
                  setRestartingExam(null);
                }}
                  className="px-5 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

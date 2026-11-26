// @ts-nocheck
import "@/exam/exam-student.css";
import ExamBrandName from '@/components/ExamBrandName';
import SubmitConfirmDialog from '@/exam/components/SubmitConfirmDialog';
import { fibIsCorrect } from '@/exam/lib/fibGrading';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { cachedSettings, fetchSettings, homePathFor, canSeeCompleted, fetchSlots, fetchKey } from '@/exam/lib/codexamSettings';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { useNavigate } from '@/lib/router-compat';
import { Terminal, Play, CheckCircle2, Clock, Send, AlertTriangle, FileCode2, Maximize, ListChecks, ArrowLeft, ArrowRight, MessageSquareWarning, PenLine, Type } from 'lucide-react';
import { Exam } from '@/exam/types';
import { toast } from 'sonner';
import { upsertMCQSubmission, upsertWritingSubmission, upsertFIBSubmission } from '@/exam/lib/supabase-helpers';
import ThemeToggle from '@/exam/components/ThemeToggle';
import FeedbackForm from '@/exam/components/FeedbackForm';
import ReevaluationDialog from '@/exam/components/ReevaluationDialog';
import NotificationBanner from '@/exam/components/NotificationBanner';
import ExamWalkthrough from '@/exam/components/ExamWalkthrough';
import TabSwitchDialog from '@/exam/components/TabSwitchDialog';
import RequestExtension from '@/exam/components/RequestExtension';
import { notifyAdmin } from '@/lib/notifyAdmin';
import { examAvailability, explicitlyAssigned } from '@/exam/lib/examAvailability';
import { readCompletedExams } from '@/exam/lib/dailyAssignments';
import { supabase } from '@/lib/db-client';
import MediaProctor from '@/exam/components/MediaProctor';
import { stopAll } from '@/exam/lib/mediaSession';

function getCompletedExams(studentId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`codexam_completed_${studentId}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function markExamCompleted(studentId: string, examId: string) {
  const set = getCompletedExams(studentId);
  set.add(examId);
  localStorage.setItem(`codexam_completed_${studentId}`, JSON.stringify([...set]));
}

function getInProgressExam(studentId: string): string | null {
  return localStorage.getItem(`codexam_in_progress_${studentId}`);
}

export default function StudentDashboard() {
  const { user, questions, students, setStudents, exams, mcqs, writings, fibs } = useAuth();
  const navigate = useNavigate();
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [mcqIndex, setMcqIndex] = useState(0);
  const [writingAnswers, setWritingAnswers] = useState<Record<string, string>>({});
  const [fibAnswers, setFibAnswers] = useState<Record<string, string[]>>({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitCountdown, setSubmitCountdown] = useState<number | null>(null);
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'mcq' | 'coding' | 'writing' | 'fib' | null>(null);
  const [reevalFor, setReevalFor] = useState<Exam | null>(null);
  const [submittedExamId, setSubmittedExamId] = useState<string | null>(null);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const hasStartedRef = useRef(false);
  const [portalSettings, setPortalSettings] = useState(cachedSettings());
  useEffect(() => { fetchSettings().then(setPortalSettings); const timer = setInterval(() => fetchSettings().then(setPortalSettings), 30000); return () => clearInterval(timer); }, []);

  const student = students.find(s => s.id === user?.id);
  const [savedCompletedIds, setSavedCompletedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!student || !exams.length) return;
    const load = () => readCompletedExams(supabase, exams, [student.id]).then(result => setSavedCompletedIds(result[student.id] || new Set())).catch(console.error);
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [student?.id, exams]);

  // Personal test slots (start time + start window) set when the admin auto-assigns a test
  const [slots, setSlots] = useState<Record<string, { start: string | null; buffer: number }>>({});
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!user?.id) return;
    const load = () => fetchSlots().then(m => setSlots(m?.[user.id] || {})).catch(() => {});
    load();
    const a = setInterval(load, 30000);
    const b = setInterval(() => setNow(Date.now()), 5000);
    return () => { clearInterval(a); clearInterval(b); };
  }, [user?.id]);
  const slotWindow = (exam: Exam) => {
    return examAvailability(exam, now, slots[exam.id]);
  };
  const fmtT = (t: number) => new Date(t).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

  // Tests the admin planned for this student today in any daily schedule
  const [plannedToday, setPlannedToday] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!user?.id) return;
    Promise.all([fetchKey<any>('mail_schedule', null), fetchKey<any[]>('mail_schedules_more', [])]).then(([m, more]) => {
      const d = new Date(); const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const set = new Set<string>();
      for (const sc of [m, ...(Array.isArray(more) ? more : [])]) {
        if (!sc?.enabled || sc.assignMode !== 'daily') continue;
        const v = sc.dailyPlan?.[user.id]?.[today];
        (Array.isArray(v) ? v : v ? [v] : []).forEach((x: string) => set.add(x));
      }
      setPlannedToday(set);
    }).catch(() => {});
  }, [user?.id]);

  const isAssignedToExam = (exam: Exam) => {
    if (!student) return false;
    if (explicitlyAssigned(exam, student.id, slots[exam.id])) return true;
    return portalSettings.showUnassignedTests === true && !exam.assignedStudentIds?.length;
  };

  const retakeSet = useMemo(() => new Set(student?.retakeExamIds || []), [student?.retakeExamIds]);

  const completedExamIds = useMemo(() => {
    if (!student) return new Set<string>();
    const local = getCompletedExams(student.id);
    return new Set([...local, ...savedCompletedIds].filter(id => !retakeSet.has(id)));
  }, [student?.id, exams, retakeSet, savedCompletedIds]);
  const inProgressExamId = student ? getInProgressExam(student.id) : null;

  const assignedExams = exams.filter(e => e.status !== 'draft' && isAssignedToExam(e));
  const activeExams = assignedExams.filter(e => !completedExamIds.has(e.id) && slotWindow(e).state === 'open');
  const scheduledExams = portalSettings.showUpcomingTests === false ? [] : assignedExams.filter(e => !completedExamIds.has(e.id) && slotWindow(e).state === 'before');
  const expiredExams = assignedExams.filter(e => !completedExamIds.has(e.id) && slotWindow(e).state === 'closed');
  const closedSlotExams = portalSettings.showExpiredTests === true ? expiredExams : [];
  const completedExams = assignedExams.filter(e => completedExamIds.has(e.id));

  const currentExam = inProgressExamId ? exams.find(e => e.id === inProgressExamId) : null;
  const isInProgress = !!currentExam && !!inProgressExamId && !completedExamIds.has(inProgressExamId);

  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!isInProgress || !student) return;
    hasStartedRef.current = true;
    const seenKey = `codexam_walkthrough_${student.id}_${currentExam?.id}`;
    if (!localStorage.getItem(seenKey)) {
      setShowWalkthrough(true);
      localStorage.setItem(seenKey, '1');
    } else {
      const timer = setTimeout(enterFullscreen, 300);
      return () => clearTimeout(timer);
    }
  }, [isInProgress, enterFullscreen, student?.id, currentExam?.id]);

  useEffect(() => {
    if (!isInProgress) return;
    const handleFsChange = () => {
      if (!document.fullscreenElement && hasStartedRef.current && !showWalkthrough) {
        setShowFullscreenWarning(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [isInProgress, showWalkthrough]);

  useEffect(() => {
    if (!isInProgress || !student) return;
    const sid = student.id;
    const handler = () => {
      if (!document.hidden) return;
      setStudents(prev => {
        const cur = prev.find(s => s.id === sid);
        if (!cur) return prev;
        const newCount = cur.tabSwitchCount + 1;
        if (newCount >= cur.maxTabSwitches) {
          stopAll();
          toast.error('Exam terminated: too many tab switches!');
          if (document.fullscreenElement) document.exitFullscreen();
          return prev.map(s => s.id === sid ? {
            ...s, tabSwitchCount: newCount, examStatus: 'terminated' as const, isBlocked: true
          } : s);
        }
        toast.warning(`Tab switch detected (${newCount}/${cur.maxTabSwitches})`);
        return prev.map(s => s.id === sid ? { ...s, tabSwitchCount: newCount } : s);
      });
    };
    document.addEventListener('visibilitychange', handler);
    window.addEventListener('blur', handler);
    return () => {
      document.removeEventListener('visibilitychange', handler);
      window.removeEventListener('blur', handler);
    };
  }, [isInProgress, student?.id, setStudents]);

  const isWithinBuffer = (exam: Exam) => {
    return slotWindow(exam).state === 'open';
  };

  useEffect(() => {
    if (!student || isInProgress) return;
    const eligible = activeExams.filter(e => isWithinBuffer(e));
    // Only auto-open when this is the student's one and only test; otherwise show the full list
    if (eligible.length === 1 && assignedExams.length === 1) {
      localStorage.setItem('codexam_selected_exam', eligible[0].id);
      navigate('/system-check');
    }
  }, [activeExams.length, isInProgress, student?.id]);

  const assignedQuestions = currentExam
    ? questions.filter(q => (currentExam.questionIds || []).includes(q.id))
    : [];

  const assignedMCQs = currentExam
    ? mcqs.filter(m => (currentExam.mcqIds || []).includes(m.id))
    : [];

  const assignedWritings = currentExam
    ? writings.filter(w => (currentExam.writingIds || []).includes(w.id))
    : [];

  const assignedFibs = currentExam
    ? fibs.filter(f => (currentExam.fibIds || []).includes(f.id))
    : [];

  const hasMCQs = assignedMCQs.length > 0;
  const hasCoding = assignedQuestions.length > 0;
  const hasWriting = assignedWritings.length > 0;
  const hasFIB = assignedFibs.length > 0;
  const sectionCount = [hasMCQs, hasCoding, hasWriting, hasFIB].filter(Boolean).length;
  const showSectionChooser = isInProgress && sectionCount > 1 && selectedSection === null;
  const sectionNames = currentExam?.sectionNames || { coding: 'Coding', mcq: 'Multiple Choice', writing: 'Writing', fib: 'Fill in the Blanks' };

  // Auto-select section: read returning hint from localStorage, or pick the only one available
  useEffect(() => {
    if (!isInProgress) { setSelectedSection(null); return; }
    const hint = localStorage.getItem('codexam_section');
    if (hint === 'mcq' || hint === 'coding' || hint === 'writing' || hint === 'fib') {
      setSelectedSection(hint as any);
      localStorage.removeItem('codexam_section');
      return;
    }
    if (sectionCount === 1) {
      if (hasMCQs) setSelectedSection('mcq');
      else if (hasCoding) setSelectedSection('coding');
      else if (hasWriting) setSelectedSection('writing');
      else if (hasFIB) setSelectedSection('fib');
    }
  }, [isInProgress, hasMCQs, hasCoding, hasWriting, hasFIB, sectionCount]);

  // If ExamPage triggered a final submit, finalize on the dashboard
  useEffect(() => {
    if (!student || !currentExam) return;
    if (localStorage.getItem('codexam_pending_final_submit') !== '1') return;
    localStorage.removeItem('codexam_pending_final_submit');
    (async () => {
      await finalizeSubmission();
      setSubmitCountdown(10);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, currentExam?.id]);

  // Reset MCQ index when entering MCQ section
  useEffect(() => {
    if (selectedSection === 'mcq') setMcqIndex(0);
  }, [selectedSection]);

  const mcqStorageKey = currentExam && student ? `codexam_mcq_answers_${student.id}_${currentExam.id}` : '';
  const writingStorageKey = currentExam && student ? `codexam_writing_${student.id}_${currentExam.id}` : '';
  const fibStorageKey = currentExam && student ? `codexam_fib_${student.id}_${currentExam.id}` : '';
  useEffect(() => {
    if (!mcqStorageKey) return;
    try {
      setMcqAnswers(JSON.parse(localStorage.getItem(mcqStorageKey) || '{}'));
      setWritingAnswers(JSON.parse(localStorage.getItem(writingStorageKey) || '{}'));
      setFibAnswers(JSON.parse(localStorage.getItem(fibStorageKey) || '{}'));
    } catch {}
  }, [mcqStorageKey]);

  const setMcqAnswer = (mcqId: string, idx: number) => {
    setMcqAnswers(prev => {
      const next = { ...prev, [mcqId]: idx };
      if (mcqStorageKey) localStorage.setItem(mcqStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const setWritingAnswer = (id: string, text: string) => {
    setWritingAnswers(prev => {
      const next = { ...prev, [id]: text };
      if (writingStorageKey) localStorage.setItem(writingStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const setFibAnswer = (id: string, idx: number, val: string) => {
    setFibAnswers(prev => {
      const arr = [...(prev[id] || [])];
      arr[idx] = val;
      const next = { ...prev, [id]: arr };
      if (fibStorageKey) localStorage.setItem(fibStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

  const getSubmission = (qId: string) => student?.submissions.find(s => s.questionId === qId);
  const allCompleted = assignedQuestions.every(q => getSubmission(q.id));

  useEffect(() => {
    if (!currentExam || !isInProgress || currentExam.isTimed === false || !student) return;
    const tick = () => {
      const stored = localStorage.getItem(`codexam_timer_${student.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const elapsed = Math.floor((Date.now() - parsed.savedAt) / 1000);
        const remaining = Math.max(0, parsed.timeLeft - elapsed);
        setGlobalTimeLeft(remaining);
        if (remaining <= 0) {
          handleAutoSubmit();
        }
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [currentExam?.id, isInProgress]);

  const saveMCQSubmissions = async () => {
    if (!student || !currentExam) return;
    const now = new Date().toISOString();
    await Promise.all(assignedMCQs.map(m => {
      const selected = mcqAnswers[m.id];
      const hasAnswer = typeof selected === 'number';
      const isCorrect = hasAnswer && selected === m.correctIndex;
      return upsertMCQSubmission({
        studentId: student.id, examId: currentExam.id, mcqId: m.id,
        selectedIndex: hasAnswer ? selected : -1, isCorrect,
        marksAwarded: isCorrect ? m.marks : 0, submittedAt: now,
      });
    }));
    if (mcqStorageKey) localStorage.removeItem(mcqStorageKey);
  };

  const saveWritingSubmissions = async () => {
    if (!student || !currentExam) return;
    const now = new Date().toISOString();
    await Promise.all(assignedWritings.map(w => {
      const text = writingAnswers[w.id] || '';
      const wc = countWords(text);
      const meets = wc >= w.minWords && wc <= w.maxWords;
      return upsertWritingSubmission({
        studentId: student.id, examId: currentExam.id, writingId: w.id,
        answerText: text, wordCount: wc,
        marksAwarded: meets && text ? w.marks : 0, maxMarks: w.marks, submittedAt: now,
      });
    }));
    if (writingStorageKey) localStorage.removeItem(writingStorageKey);
  };

  const saveFIBSubmissions = async () => {
    if (!student || !currentExam) return;
    const now = new Date().toISOString();
    await Promise.all(assignedFibs.map(f => {
      const answers = fibAnswers[f.id] || [];
      const allCorrect = fibIsCorrect(f, answers);
      return upsertFIBSubmission({
        studentId: student.id, examId: currentExam.id, fibId: f.id,
        answers, isCorrect: allCorrect,
        marksAwarded: allCorrect ? f.marks : 0, maxMarks: f.marks, submittedAt: now,
      });
    }));
    if (fibStorageKey) localStorage.removeItem(fibStorageKey);
  };

  const finalizeSubmission = async () => {
    if (!student || !currentExam) return;
    stopAll();
    try { await Promise.all([saveMCQSubmissions(), saveWritingSubmissions(), saveFIBSubmissions()]); }
    catch { toast.error('Your submission could not be saved. Please try again before leaving.'); return; }
    notifyAdmin('test_submitted', { studentId: student.id, examId: currentExam.id });
    localStorage.removeItem(`codexam_timer_${student.id}`);
    localStorage.removeItem(`codexam_in_progress_${student.id}`);
    localStorage.removeItem('codexam_selected_exam');
    localStorage.removeItem('codexam_section');
    markExamCompleted(student.id, currentExam.id);
    setSubmittedExamId(currentExam.id);
    // Admin-configured automatic result email (immediately or after a delay)
    fetch('/api/public/queue-result', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: student.id, examId: currentExam.id }), keepalive: true }).catch(() => {});
    setStudents(prev => prev.map(s =>
      s.id === student.id ? {
        ...s,
        examStatus: 'completed' as const,
        retakeExamIds: (s.retakeExamIds || []).filter(id => id !== currentExam.id),
      } : s
    ));
    if (document.fullscreenElement) document.exitFullscreen();
  };

  const handleAutoSubmit = async () => {
    if (submitCountdown !== null) return;
    await finalizeSubmission();
    setSubmitCountdown(10);
  };

  const handleSubmitTest = async () => {
    setShowSubmitConfirm(false);
    await finalizeSubmission();
    setSubmitCountdown(10);
  };

  // Countdown timer for success overlay
  useEffect(() => {
    if (submitCountdown === null) return;
    if (submitCountdown <= 0) {
      setSubmitCountdown(null);
      return;
    }
    const t = setTimeout(() => setSubmitCountdown(c => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [submitCountdown]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!student) return null;

  const handleSelectExam = (exam: Exam) => {
    const w = slotWindow(exam);
    if (w && w.state === 'before') { toast.info(`This test starts at ${fmtT(w.start!)} for you`); return; }
    if (w && w.state === 'closed') { toast.error('Your start window has closed'); return; }
    localStorage.setItem('codexam_selected_exam', exam.id);
    navigate('/system-check');
  };

  const handleStartQuestion = (qId: string) => {
    if (currentExam) {
      localStorage.setItem('codexam_selected_exam', currentExam.id);
    }
    // Remember we came from coding so going back skips the section chooser
    localStorage.setItem('codexam_section', 'coding');
    const goToQuestion = () => navigate(`/exam-take/${qId}`);
    if (document.fullscreenElement) { goToQuestion(); return; }
    const p = document.documentElement.requestFullscreen?.();
    if (p && typeof p.finally === 'function') { p.finally(goToQuestion); return; }
    goToQuestion();
  };

  const showExamsList = !isInProgress;
  const hasAnyExams = activeExams.length > 0 || scheduledExams.length > 0 || (canSeeCompleted(portalSettings, student?.id) && completedExams.length > 0) || closedSlotExams.length > 0;
  const currentMCQ = assignedMCQs[mcqIndex];
  const isLastMCQ = mcqIndex >= assignedMCQs.length - 1;
  const answeredCount = Object.keys(mcqAnswers).filter(k => assignedMCQs.some(m => m.id === k)).length;

  return (
    <>
    {isInProgress && student.examStatus !== 'terminated' && submitCountdown === null && <MediaProctor owner={{ studentId: student.id, name: student.name, email: student.email, examTitle: currentExam?.title }} />}
    <div className="codexam-theme exam-student exam-home min-h-screen bg-background">
      {student && <NotificationBanner studentId={student.id} />}
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-16 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Terminal className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm"><ExamBrandName /></span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {globalTimeLeft !== null && isInProgress && currentExam?.isTimed !== false && (
              <span className={`flex items-center gap-1 text-sm font-mono tabular-nums ${globalTimeLeft < 300 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                <Clock className="w-3.5 h-3.5" /> {formatTime(globalTimeLeft)}
              </span>
            )}
            <span className="hidden sm:inline text-sm text-muted-foreground">{student.name}</span>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
              Tab switches: {student.tabSwitchCount}/{student.maxTabSwitches}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="exam-home-hero surface-ink portal-banner flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 rounded-[1.5rem] bg-primary bg-gradient-to-br from-primary to-primary/80 p-6 sm:p-8 text-primary-foreground shadow-lg shadow-primary/10">
          <div className="min-w-0">
            <p className="eyebrow muted-on-ink mb-3">Student workspace · Your exams</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-1">
              {isInProgress && currentExam ? currentExam.title : `Hello, ${student.name.split(' ')[0]} 👋`}
            </h1>
            <p className="text-primary-foreground/80 text-sm">
              {isInProgress && currentExam ? currentExam.description : 'Your next challenge starts here. Explore your assigned assessments below.'}
            </p>
          </div>
          {isInProgress && currentExam && student.examStatus !== 'terminated' && (
            <button onClick={() => setShowSubmitConfirm(true)}
              className="flex items-center gap-2 px-5 h-10 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all">
              <Send className="w-4 h-4" /> Submit Test
            </button>
          )}
        </div>

        {showExamsList && (
          <section aria-label="Exam status summary" className="exam-summary">
            <div><span className="eyebrow">Available now</span><strong>{activeExams.length}</strong></div>
            <div><span className="eyebrow">Upcoming</span><strong>{scheduledExams.length}</strong></div>
            {canSeeCompleted(portalSettings, student?.id) && <div><span className="eyebrow">Completed</span><strong>{completedExams.length}</strong></div>}
          </section>
        )}

        {/* Submission success overlay — stays until feedback submitted or user dismisses */}
        {(submitCountdown !== null || submittedExamId) && (
          <div className="fixed inset-0 bg-background/98 backdrop-blur-sm z-[60] flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
            <div className={`bg-card border rounded-[1.5rem] shadow-2xl my-4 sm:my-8 text-center w-full ${submittedExamId ? 'max-w-3xl p-6 sm:p-10' : 'max-w-md p-8'}`}>
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </div>
              <h2 className="font-display font-bold text-3xl sm:text-4xl mb-2">Test Submitted Successfully!</h2>
              <p className="text-base text-muted-foreground mb-4">
                Your responses have been recorded and locked in.
              </p>
              {submittedExamId && student ? (
                <FeedbackForm studentId={student.id} examId={submittedExamId} onDone={() => { setSubmittedExamId(null); setSubmitCountdown(null); navigate(homePathFor(portalSettings)); }} />
              ) : (
                <button onClick={() => setSubmitCountdown(null)}
                  className="mt-3 px-6 h-10 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90">
                  Continue
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab switch / fullscreen exit dialog with completion summary */}
        {showFullscreenWarning && student && (
          <TabSwitchDialog
            tabSwitchCount={student.tabSwitchCount}
            maxTabSwitches={student.maxTabSwitches}
            completedSummary={{
              mcqAnswered: answeredCount,
              mcqTotal: assignedMCQs.length,
              codingDone: assignedQuestions.filter(q => getSubmission(q.id)).length,
              codingTotal: assignedQuestions.length,
            }}
            onResume={() => { setShowFullscreenWarning(false); enterFullscreen(); }}
            onSubmit={() => { setShowFullscreenWarning(false); handleSubmitTest(); }}
          />
        )}

        {/* Walkthrough on first exam entry */}
        {showWalkthrough && currentExam && (
          <ExamWalkthrough
            hasMCQs={hasMCQs}
            hasCoding={hasCoding}
            isTimed={currentExam.isTimed !== false}
            onClose={() => { setShowWalkthrough(false); setTimeout(enterFullscreen, 200); }}
          />
        )}

        {/* Submit Confirm */}
        {showSubmitConfirm && (
          <SubmitConfirmDialog
            message="This action cannot be undone."
            warnings={[
              hasCoding && !allCompleted ? `You have ${assignedQuestions.length - ((student.submissions || []).filter(s => (currentExam?.questionIds || []).includes(s.questionId)).length)} unanswered coding question(s).` : null,
              hasMCQs && answeredCount < assignedMCQs.length ? `You answered ${answeredCount}/${assignedMCQs.length} MCQ(s).` : null,
            ]}
            onCancel={() => setShowSubmitConfirm(false)}
            onConfirm={handleSubmitTest}
          />
        )}

        {/* Terminated */}
        {student.examStatus === 'terminated' && (
          <div className="bg-destructive/10 text-destructive rounded-xl p-5 mb-6">
            <p className="font-semibold">Exam Terminated</p>
            <p className="text-sm mt-1">Your exam was terminated due to excessive tab switching.</p>
            <div className="mt-3 pt-3 border-t border-destructive/20 text-sm">
              <p className="font-medium">Need help?</p>
              <p className="mt-1">Reply to the email through which you received your assessment link &amp; credentials — the admin will respond regarding your query quickly.</p>
            </div>
          </div>
        )}

        {/* No exams at all */}
        {!hasAnyExams && !isInProgress && student.examStatus !== 'terminated' && (
          <div className="bg-accent/10 text-accent rounded-xl p-5 mb-6">
            <p className="font-semibold">{expiredExams.length ? 'Exam no longer available' : 'No available assigned test'}</p>
            <p className="text-sm mt-1">{expiredExams.length ? 'Your exam start window has expired. Contact the admin by replying to the email containing your exam link.' : 'Your assigned exam will be available during its scheduled start window. For help, reply to your exam email.'}</p>
          </div>
        )}

        {/* Exam selection list */}
        {showExamsList && student.examStatus !== 'terminated' && (
          <>
            {activeExams.length > 0 && (
              <div className="mb-6">
                <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active Tests</h2>
                <div className="space-y-3">
                  {activeExams.map(exam => {
                    const withinBuffer = isWithinBuffer(exam);
                    return (
                      <div key={exam.id} className="bg-card border rounded-[1.5rem] p-5 sm:p-6 shadow-sm hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-display font-semibold text-lg break-words">{exam.title}</h3>
                              <span className="text-xs px-3 py-1 rounded-full font-medium bg-primary/10 text-primary">Active</span>
                              {exam.isTimed && (
                                <span className="text-xs px-3 py-1 rounded-full font-medium bg-muted text-muted-foreground">⏱ {exam.examDurationMinutes} min</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{exam.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {exam.questionIds.length} questions{!withinBuffer && ' · Buffer time expired'}
                            </p>
                            {slotWindow(exam)?.end && (
                              <p className="text-xs font-medium text-primary mt-1">Start before {fmtT(slotWindow(exam)!.end!)}</p>
                            )}
                          </div>
                          {withinBuffer ? (
                            <button onClick={() => handleSelectExam(exam)}
                              className="flex items-center gap-2 justify-center w-full sm:w-auto shrink-0 px-6 h-12 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all">
                              <Play className="w-4 h-4" /> Start test
                            </button>
                          ) : (
                            <span className="text-xs text-destructive font-medium">Buffer Expired</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {scheduledExams.length > 0 && (
              <div className="mb-6">
                <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Scheduled Tests</h2>
                <div className="space-y-3">
                  {scheduledExams.map(exam => (
                    <div key={exam.id} className="bg-card border rounded-[1.5rem] p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-display font-semibold text-lg break-words">{exam.title}</h3>
                            <span className="text-xs px-3 py-1 rounded-full font-medium bg-accent/10 text-accent">Scheduled</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{exam.description}</p>
                          {slotWindow(exam) ? (
                            <div className="mt-2 rounded-lg bg-accent/10 px-3 py-2">
                              <p className="text-sm font-semibold">Exam not started yet</p>
                              <p className="text-xs text-muted-foreground">It will start at <span className="font-semibold text-foreground">{fmtT(slotWindow(exam)!.start!)}</span> for you{slotWindow(exam)!.end ? ` — you can begin until ${fmtT(slotWindow(exam)!.end!)}` : ''}.</p>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1">
                              Starts at {new Date(exam.scheduledAt!).toLocaleString()} · {exam.questionIds.length} questions
                            </p>
                          )}
                        </div>
                        <Clock className="w-5 h-5 text-accent" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {closedSlotExams.length > 0 && (
              <div className="mb-6">
                <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Missed Tests</h2>
                <div className="space-y-3">
                  {closedSlotExams.map(exam => (
                    <div key={exam.id} className="bg-card border rounded-[1.5rem] p-5">
                      <h3 className="font-display font-semibold text-lg break-words">{exam.title}</h3>
                      <p className="text-xs text-destructive mt-1">Exam no longer available. {slotWindow(exam).end ? `Your start window closed at ${fmtT(slotWindow(exam).end)}.` : 'This test has ended.'} Contact the admin by replying to your exam email.</p>
                      <RequestExtension studentId={student?.id} studentName={student?.name} examId={exam.id} examTitle={exam.title} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedExams.length > 0 && canSeeCompleted(portalSettings, student?.id) && (
              <div className="mb-6">
                <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Completed Tests</h2>
                <div className="space-y-3">
                  {completedExams.map(exam => (
                    <div key={exam.id} className="bg-card border rounded-[1.5rem] p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-display font-semibold text-lg break-words">{exam.title}</h3>
                            <span className="text-xs px-3 py-1 rounded-full font-medium bg-primary/10 text-primary flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Submitted
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{exam.description}</p>
                        </div>
                        <button onClick={() => setReevalFor(exam)}
                          className="flex items-center gap-1.5 justify-center px-4 h-11 border rounded-xl text-xs font-medium hover:bg-muted transition-colors">
                          <MessageSquareWarning className="w-3.5 h-3.5 text-accent" /> Request Re-evaluation
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Section chooser when multiple sections exist */}
        {showSectionChooser && student.examStatus !== 'terminated' && (
          <div>
            <h2 className="font-display text-lg font-bold mb-4">Choose a Section to Begin</h2>
            <p className="text-sm text-muted-foreground mb-6">You can switch between sections at any time during the exam.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hasMCQs && (
                <button onClick={() => setSelectedSection('mcq')}
                  className="bg-card border-2 rounded-[1.5rem] p-6 text-left hover:border-primary hover:shadow-md transition-all group">
                  <ListChecks className="w-10 h-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-display font-bold text-lg mb-1">{sectionNames.mcq}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{assignedMCQs.length} question{assignedMCQs.length !== 1 ? 's' : ''} · Answered {answeredCount}/{assignedMCQs.length}</p>
                  <span className="text-sm text-primary font-medium">Open →</span>
                </button>
              )}
              {hasCoding && (
                <button onClick={() => setSelectedSection('coding')}
                  className="bg-card border-2 rounded-[1.5rem] p-6 text-left hover:border-primary hover:shadow-md transition-all group">
                  <FileCode2 className="w-10 h-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-display font-bold text-lg mb-1">{sectionNames.coding}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{assignedQuestions.length} question{assignedQuestions.length !== 1 ? 's' : ''}</p>
                  <span className="text-sm text-primary font-medium">Open →</span>
                </button>
              )}
              {hasWriting && (
                <button onClick={() => setSelectedSection('writing')}
                  className="bg-card border-2 rounded-[1.5rem] p-6 text-left hover:border-primary hover:shadow-md transition-all group">
                  <PenLine className="w-10 h-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-display font-bold text-lg mb-1">{sectionNames.writing}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{assignedWritings.length} prompt{assignedWritings.length !== 1 ? 's' : ''}</p>
                  <span className="text-sm text-primary font-medium">Open →</span>
                </button>
              )}
              {hasFIB && (
                <button onClick={() => setSelectedSection('fib')}
                  className="bg-card border-2 rounded-[1.5rem] p-6 text-left hover:border-primary hover:shadow-md transition-all group">
                  <Type className="w-10 h-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-display font-bold text-lg mb-1">{sectionNames.fib}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{assignedFibs.length} question{assignedFibs.length !== 1 ? 's' : ''}</p>
                  <span className="text-sm text-primary font-medium">Open →</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Back to sections */}
        {isInProgress && sectionCount > 1 && selectedSection !== null && student.examStatus !== 'terminated' && (
          <button onClick={() => setSelectedSection(null)}
            className="mb-4 inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border bg-card text-sm font-medium hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Sections
          </button>
        )}

        {/* Writing Section */}
        {isInProgress && selectedSection === 'writing' && hasWriting && student.examStatus !== 'terminated' && (
          <div className="mb-8 space-y-6">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <PenLine className="w-5 h-5" /> {sectionNames.writing}
            </h2>
            <p className="text-sm text-muted-foreground bg-muted/50 border rounded-xl px-4 py-3">
              Have a question about this section? Email{' '}
              <a href="mailto:jobportalfreeofficial@gmail.com" className="font-medium text-primary underline">jobportalfreeofficial@gmail.com</a>
            </p>
            {assignedWritings.map((w, idx) => {
              const text = writingAnswers[w.id] || '';
              const wc = countWords(text);
              const meets = wc >= w.minWords && wc <= w.maxWords;
              return (
                <div key={w.id} className="bg-card border rounded-[1.5rem] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <h3 className="font-display font-semibold">{idx + 1}. {w.title}</h3>
                    <span className="text-xs text-muted-foreground">{w.marks} marks · {w.minWords}-{w.maxWords} words</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{w.prompt}</p>
                  <textarea
                    value={text}
                    onChange={e => setWritingAnswer(w.id, e.target.value)}
                    rows={10}
                    placeholder="Write your answer here..."
                    className="w-full p-3 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className={meets ? 'text-primary' : 'text-muted-foreground'}>
                      {wc} words {meets ? '✓' : `(need ${w.minWords}-${w.maxWords})`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Fill in the Blanks Section */}
        {isInProgress && selectedSection === 'fib' && hasFIB && student.examStatus !== 'terminated' && (
          <div className="mb-8 space-y-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Type className="w-5 h-5" /> {sectionNames.fib}
            </h2>
            {assignedFibs.map((f, idx) => {
              const parts = f.sentence.split('___');
              const answers = fibAnswers[f.id] || [];
              return (
                <div key={f.id} className="bg-card border rounded-[1.5rem] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <span className="text-sm font-semibold">Q{idx + 1}</span>
                    <span className="text-xs text-muted-foreground">{f.marks} mark{f.marks !== 1 ? 's' : ''} · {f.difficulty}</span>
                  </div>
                  <div className="text-sm leading-relaxed flex flex-wrap items-center gap-1">
                    {parts.map((p, i) => (
                      <span key={i} className="contents">
                        <span>{p}</span>
                        {i < parts.length - 1 && (
                          <input
                            value={answers[i] || ''}
                            onChange={e => setFibAnswer(f.id, i, e.target.value)}
                            className="inline-block px-2 h-8 border-b-2 border-primary/40 bg-muted/30 rounded-t text-sm focus:outline-none focus:border-primary min-w-[100px]"
                            placeholder={`blank ${i + 1}`}
                          />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}


        {/* MCQ Section — one at a time, Save & Next */}
        {isInProgress && selectedSection === 'mcq' && hasMCQs && currentMCQ && student.examStatus !== 'terminated' && (
          <div className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <ListChecks className="w-5 h-5" /> {sectionNames.mcq}
              </h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                Question {mcqIndex + 1} of {assignedMCQs.length} · Answered {answeredCount}/{assignedMCQs.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-6">
              <div className="h-full bg-primary transition-all" style={{ width: `${((mcqIndex + 1) / assignedMCQs.length) * 100}%` }} />
            </div>

            <div className="bg-card border rounded-[1.5rem] p-6">
              <div className="flex items-start gap-3 mb-5">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  Q{mcqIndex + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-base leading-relaxed">{currentMCQ.question}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      currentMCQ.difficulty === 'easy' ? 'bg-primary/10 text-primary' :
                      currentMCQ.difficulty === 'medium' ? 'bg-accent/10 text-accent' :
                      'bg-destructive/10 text-destructive'
                    }`}>{currentMCQ.difficulty}</span>
                    <span className="text-xs text-muted-foreground">{currentMCQ.marks} mark{currentMCQ.marks !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:pl-11 mb-6">
                {currentMCQ.options.map((opt, oIdx) => {
                  const selected = mcqAnswers[currentMCQ.id] === oIdx;
                  return (
                    <label
                      key={oIdx}
                      className={`flex items-center gap-3 min-h-16 p-4 rounded-[1.5rem] border cursor-pointer transition-all ${
                        selected ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20' : 'border-border hover:border-primary/40 hover:bg-accent/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`mcq-${currentMCQ.id}`}
                        checked={selected}
                        onChange={() => setMcqAnswer(currentMCQ.id, oIdx)}
                        className="shrink-0 accent-primary"
                      />
                      <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0 font-semibold">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="text-sm">{opt}</span>
                    </label>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
                <button
                  onClick={() => setMcqIndex(i => Math.max(0, i - 1))}
                  disabled={mcqIndex === 0}
                  className="flex items-center gap-1.5 px-4 h-12 rounded-xl border bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>
                {!isLastMCQ ? (
                  <button
                    onClick={() => setMcqIndex(i => Math.min(assignedMCQs.length - 1, i + 1))}
                    className="flex items-center gap-1.5 px-5 h-12 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    Save & Next <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      toast.success('All MCQs saved.');
                      if (hasCoding) setSelectedSection(null);
                    }}
                    className="flex items-center gap-1.5 px-5 h-12 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save & Finish
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Coding Questions list */}
        {isInProgress && selectedSection === 'coding' && hasCoding && (
          <div>
            <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4">
              <FileCode2 className="w-5 h-5" /> {sectionNames.coding}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Pick any question to begin. You can return here to switch questions anytime.</p>
            <div className="space-y-3">
              {assignedQuestions.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((q, idx) => {
                const sub = getSubmission(q.id);
                return (
                  <div key={q.id} className="bg-card border rounded-[1.5rem] p-5 flex items-center justify-between hover:shadow-sm transition-shadow">
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                      <span className="text-lg font-bold text-muted-foreground w-8">{idx + 1}</span>
                      {sub ? (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-display font-semibold text-sm">{q.title}</h3>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            q.difficulty === 'easy' ? 'bg-primary/10 text-primary' :
                            q.difficulty === 'medium' ? 'bg-accent/10 text-accent' :
                            'bg-destructive/10 text-destructive'
                          }`}>{q.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{q.timeLimit} min</span>
                          {sub && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-primary" />
                              Public: {sub.passedPublic}/{sub.totalPublic}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {student.examStatus !== 'terminated' && (
                      <button onClick={() => handleStartQuestion(q.id)}
                        className="flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all">
                        {sub ? <>Review</> : <><Play className="w-3.5 h-3.5" /> Start</>}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isInProgress && assignedQuestions.length === 0 && assignedMCQs.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <FileCode2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No questions assigned for this exam.</p>
          </div>
        )}
      </div>

      {reevalFor && student && (
        <ReevaluationDialog
          studentId={student.id}
          studentName={student.name}
          examId={reevalFor.id}
          examTitle={reevalFor.title}
          questions={[
            ...questions.filter(q => (reevalFor.questionIds || []).includes(q.id)).map(q => ({ id: q.id, title: q.title, type: 'coding' as const })),
            ...mcqs.filter(m => (reevalFor.mcqIds || []).includes(m.id)).map(m => ({ id: m.id, title: m.question, type: 'mcq' as const })),
          ]}
          onClose={() => setReevalFor(null)}
        />
      )}
    </div>
    </>
  );
}

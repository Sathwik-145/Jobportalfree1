// @ts-nocheck
import "@/exam/exam-student.css";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from '@/lib/router-compat';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { LANGUAGE_LABELS, LANGUAGE_TEMPLATES } from '@/exam/data/sampleData';
import { TestResultData } from '@/exam/types';
import Editor from '@monaco-editor/react';
import { Play, Send, AlertTriangle, Maximize, Clock, CheckCircle2, XCircle, ArrowLeft, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import SubmitConfirmDialog from '@/exam/components/SubmitConfirmDialog';
import { supabase } from '@/lib/db-client';
import NotificationBanner from '@/exam/components/NotificationBanner';
import MediaProctor from '@/exam/components/MediaProctor';
import { stopAll } from '@/exam/lib/mediaSession';

export default function ExamPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const { user, questions, students, setStudents, exams } = useAuth();
  const navigate = useNavigate();

  const student = students.find(s => s.id === user?.id);
  const question = questions.find(q => q.id === questionId);

  // Get the selected exam from localStorage, fallback to first active
  const selectedExamId = localStorage.getItem('codexam_selected_exam');
  const currentExam = exams.find(e => e.id === selectedExamId) || exams.find(e => e.status === 'active') || null;
  const isTimed = currentExam?.isTimed !== false;

  const [language, setLanguage] = useState(question?.languages[0] || 'python');
  const [code, setCode] = useState(LANGUAGE_TEMPLATES[language] || '');
  const [output, setOutput] = useState('');
  const [publicResults, setPublicResults] = useState<TestResultData[]>([]);
  const [privatePassedCount, setPrivatePassedCount] = useState<{ passed: number; total: number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(() => {
    // Load persisted timer from localStorage for global exam timer
    const stored = localStorage.getItem(`codexam_timer_${user?.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Calculate elapsed time since last save
      const elapsed = Math.floor((Date.now() - parsed.savedAt) / 1000);
      return Math.max(0, parsed.timeLeft - elapsed);
    }
    return (currentExam?.examDurationMinutes || 60) * 60;
  });
  const [showWarning, setShowWarning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'output' | 'public' | 'private'>('output');
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  // Timer - only if timed, persist to localStorage
  useEffect(() => {
    if (!isTimed) return;
    if (timeLeft <= 0) {
      localStorage.removeItem(`codexam_timer_${user?.id}`);
      handleSubmit();
      return;
    }
    // Save current time to localStorage
    localStorage.setItem(`codexam_timer_${user?.id}`, JSON.stringify({ timeLeft, savedAt: Date.now() }));
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft, isTimed]);

  // Fullscreen
  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    }
    setIsFullscreen(true);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && hasStarted.current) {
        setShowWarning(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Tab switch detection
  useEffect(() => {
    if (!student || !question) return;
    hasStarted.current = true;

    if (student.examStatus === 'not_started') {
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, examStatus: 'in_progress' } : s));
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) return;
      setStudents(prev => {
        const cur = prev.find(s => s.id === student.id);
        if (!cur) return prev;
        const newCount = cur.tabSwitchCount + 1;
        if (newCount >= cur.maxTabSwitches) {
          stopAll();
          toast.error('Exam terminated: too many tab switches!');
          if (document.fullscreenElement) document.exitFullscreen();
          setTimeout(() => navigate('/exam-student'), 50);
          return prev.map(s => s.id === student.id ? {
            ...s, tabSwitchCount: newCount, examStatus: 'terminated' as const, isBlocked: true
          } : s);
        }
        toast.warning(`Warning: Tab switch detected (${newCount}/${cur.maxTabSwitches})`);
        return prev.map(s => s.id === student.id ? { ...s, tabSwitchCount: newCount } : s);
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [student?.id]);

  // Enter fullscreen on mount
  useEffect(() => {
    const timer = setTimeout(enterFullscreen, 300);
    return () => clearTimeout(timer);
  }, []);

  if (!question || !student) {
    navigate('/exam-student');
    return null;
  }

  if (student.examStatus === 'terminated') {
    navigate('/exam-student');
    return null;
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Execute code against test cases using the browser-accessible Judge0 runner.
  const executeTestCases = async (
    testCases: typeof question.publicTestCases,
    userCode: string
  ): Promise<TestResultData[]> => {
    const template = LANGUAGE_TEMPLATES[language] || '';
    const codeStripped = userCode.trim();
    const templateStripped = template.trim();

    if (!codeStripped || codeStripped === templateStripped) {
      return testCases.map(tc => ({
        passed: false,
        input: tc.input,
        expected: tc.expectedOutput,
        got: '(no output)',
        error: 'No solution code written. Please write your solution before running tests.',
      }));
    }

    try {
      const response = await fetch('/api/public/execute-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: userCode, language, testCases }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(data.results)) {
        throw new Error(data.error || `Runner HTTP ${response.status}`);
      }
      return data.results.map((result: TestResultData) => ({
        ...result,
        got: result.got || '(no output)',
      }));
    } catch (e: any) {
      const message = e?.message || 'Unable to reach code runner';
      return testCases.map(tc => ({
        passed: false,
        input: tc.input,
        expected: tc.expectedOutput,
        got: '(no output)',
        error: message,
      }));
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setActiveTab('public');
    try {
      const results = await executeTestCases(question.publicTestCases, code);
      setPublicResults(results);
      const passed = results.filter(r => r.passed).length;
      setOutput(`Ran ${results.length} public test cases.\nPassed: ${passed}/${results.length}`);
    } catch (err) {
      toast.error('Failed to run code');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setShowSubmitConfirm(false);
    setIsRunning(true);
    try {
      const [pubResults, privResults] = await Promise.all([
        executeTestCases(question.publicTestCases, code),
        executeTestCases(question.privateTestCases, code),
      ]);

      setPublicResults(pubResults);

      const passedPub = pubResults.filter(r => r.passed).length;
      const passedPriv = privResults.filter(r => r.passed).length;
      setPrivatePassedCount({ passed: passedPriv, total: privResults.length });
      setActiveTab('private');
      const totalCases = pubResults.length + privResults.length;
      const passedTotal = passedPub + passedPriv;
      const maxMarks = question.maxMarks || 10;
      const marks = totalCases > 0 ? Math.round((passedTotal / totalCases) * maxMarks) : 0;

      const submission = {
        questionId: question.id,
        language,
        code,
        passedPublic: passedPub,
        totalPublic: pubResults.length,
        passedPrivate: passedPriv,
        totalPrivate: privResults.length,
        submittedAt: new Date().toISOString(),
        publicResults: pubResults,
        privateResults: privResults,
        marks,
        maxMarks,
      };

      setStudents(prev => prev.map(s => {
        if (s.id !== student.id) return s;
        const subs = (s.submissions || []).filter(sub => sub.questionId !== question.id);
        return { ...s, submissions: [...subs, submission] };
      }));

      toast.success('Solution submitted!');
    } catch (err) {
      toast.error('Failed to submit solution');
    } finally {
      setIsRunning(false);
    }
  };

  const handleFinalSubmit = () => {
    stopAll();
    // Hand off to dashboard which owns the success overlay + finalize flow
    localStorage.setItem('codexam_pending_final_submit', '1');
    if (document.fullscreenElement) document.exitFullscreen();
    navigate('/exam-student');
  };

  const handleBackToQuestions = () => {
    // Stay inside the coding section when returning to dashboard
    localStorage.setItem('codexam_section', 'coding');
    const goToQuestions = () => navigate('/exam-student');
    const fullscreenPromise = document.documentElement.requestFullscreen?.();

    if (fullscreenPromise && typeof fullscreenPromise.finally === 'function') {
      fullscreenPromise.finally(goToQuestions);
      return;
    }

    goToQuestions();
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(LANGUAGE_TEMPLATES[lang] || '');
  };


  const toggleTestExpand = (key: string) => {
    setExpandedTests(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderResults = (results: TestResultData[], label: string) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-xs tabular-nums">
          {results.filter(r => r.passed).length}/{results.length} passed
        </span>
      </div>
      {results.map((r, i) => {
        const key = `${label}-${i}`;
        const isOpen = expandedTests.has(key);
        return (
          <div key={i} className={`text-xs font-mono rounded-lg border ${
            r.passed ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'
          }`}>
            <button
              onClick={() => toggleTestExpand(key)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/30 transition-colors ${r.passed ? 'text-primary' : 'text-destructive'}`}
            >
              <div className="exam-live-actions flex items-center gap-2">
                {r.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span className="font-semibold">Test {i + 1}: {r.passed ? 'PASSED' : 'FAILED'}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-3 pb-2 space-y-1 text-muted-foreground border-t border-inherit">
                <div className="pt-1.5"><span className="text-foreground/60">Input: </span><pre className="inline whitespace-pre-wrap text-foreground/80 m-0">{r.input}</pre></div>
                <div><span className="text-foreground/60">Expected: </span><pre className="inline whitespace-pre-wrap text-primary m-0">{r.expected}</pre></div>
                <div><span className="text-foreground/60">Your Output: </span><pre className={`inline whitespace-pre-wrap m-0 ${r.passed ? 'text-primary' : 'text-destructive'}`}>{r.got}</pre></div>
                {r.error && (
                  <div className="mt-1 p-2 bg-destructive/10 rounded text-destructive">{r.error}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div ref={containerRef} className="codexam-theme exam-student exam-live fixed inset-0 flex flex-col bg-background z-40">
      {student && <NotificationBanner studentId={student.id} />}
      <MediaProctor owner={student ? { studentId: student.id, name: student.name, email: student.email, examTitle: currentExam?.title } : null} />
      {/* Warning overlay */}
      {showWarning && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-[1.5rem] shadow-lg p-6 max-w-sm text-center">
            <AlertTriangle className="w-10 h-10 text-accent mx-auto mb-3" />
            <h2 className="font-display font-semibold text-lg mb-2">Fullscreen Required</h2>
            <p className="text-sm text-muted-foreground mb-4">You must stay in fullscreen mode during the exam.</p>
            <button onClick={() => { setShowWarning(false); enterFullscreen(); }}
              className="px-6 h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90">
              <Maximize className="w-4 h-4 inline mr-2" /> Re-enter Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Submit confirm */}
      {showSubmitConfirm && (
        <SubmitConfirmDialog
          message="This will end your exam session. You won't be able to make changes."
          confirmLabel="Submit"
          onCancel={() => setShowSubmitConfirm(false)}
          onConfirm={handleFinalSubmit}
        />
      )}

      {/* Top bar */}
      <div className="exam-live-header sticky top-0 z-20 border-b bg-card/95 backdrop-blur flex h-11 items-center justify-between gap-2 px-2 sm:px-4 shrink-0 shadow-sm">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button aria-label="Back to Questions" onClick={handleBackToQuestions}
            className="h-9 shrink-0 flex items-center gap-1 rounded-lg bg-accent px-2 text-xs font-medium text-accent-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /><span className="hidden md:inline">Back to Questions</span>
          </button>
          <div className="w-px h-5 bg-border" />
          <h1 className="font-display min-w-0 flex-1 truncate font-semibold text-sm">{question.title}</h1>
          <span className={`hidden lg:inline text-xs px-2 py-0.5 rounded-full font-medium ${
            question.difficulty === 'easy' ? 'bg-primary/10 text-primary' :
            question.difficulty === 'medium' ? 'bg-accent/10 text-accent' :
            'bg-destructive/10 text-destructive'
          }`}>{question.difficulty}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="hidden xl:inline text-xs text-muted-foreground">
            Tab switches: {student.tabSwitchCount}/{student.maxTabSwitches}
          </span>
          {isTimed && (
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-mono font-semibold tabular-nums border ${timeLeft < 300 ? 'bg-destructive/10 text-destructive border-destructive/30 animate-pulse' : 'bg-primary/10 text-primary border-primary/20'}`}>
              <Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)}
            </span>
          )}
          {!isTimed && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Untimed
            </span>
          )}
          <select value={language} onChange={e => handleLanguageChange(e.target.value)}
            className="h-9 w-20 sm:w-auto min-w-0 px-1 sm:px-2 text-xs rounded-lg border bg-background">
            {question.languages.map(l => <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>)}
          </select>
          <button onClick={() => setShowSubmitConfirm(true)}
            className="flex items-center gap-1.5 px-2 h-9 bg-destructive text-destructive-foreground rounded-xl text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all">
            <Send className="w-3 h-3" /><span className="hidden sm:inline">Submit Test</span><span className="sm:hidden">Submit</span>
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="exam-live-body flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* Problem description */}
        <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 border-b lg:border-b-0 lg:border-r bg-card lg:overflow-y-auto p-5 sm:p-6">
          <div className="prose prose-sm max-w-none">
            <div className="text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{
              __html: question.description
                .replace(/\\n/g, '\n')
                .replace(/```\n?([\s\S]*?)```/g, '<pre class="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto my-2">$1</pre>')
                .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            }} />
          </div>

          <div className="mt-6">
            <h3 className="font-display text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sample Test Cases</h3>
            {question.publicTestCases.slice(0, question.sampleCount ?? 3).map((tc, i) => (
              <div key={tc.id} className="mb-3 bg-muted/60 border rounded-[1.5rem] p-4">
                <p className="text-xs font-medium mb-1">Case {i + 1}</p>
                <div className="text-xs font-mono space-y-1">
                  <div><span className="text-muted-foreground">Input: </span><pre className="inline whitespace-pre-wrap text-foreground/80 m-0">{tc.input}</pre></div>
                  <div><span className="text-muted-foreground">Output: </span><pre className="inline whitespace-pre-wrap text-foreground/80 m-0">{tc.expectedOutput}</pre></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code editor + output */}
        <div className="flex-1 flex flex-col min-w-0 min-h-[650px] lg:min-h-0 shrink-0">
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language === 'c' ? 'c' : language}
              value={code}
              onChange={v => setCode(v || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                padding: { top: 16 },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
              }}
              onMount={(editor) => {
                // Block external paste if copy-paste is disabled for this exam
                if (currentExam && !currentExam.allowCopyPaste) {
                  editor.onDidPaste(() => {
                    // We can't reliably distinguish internal vs external paste via onDidPaste,
                    // so we intercept the paste command instead
                  });
                  // Override the paste action
                  editor.addAction({
                    id: 'block-paste',
                    label: 'Block Paste',
                    keybindings: [
                      // @ts-ignore
                      monaco?.KeyMod?.CtrlCmd | monaco?.KeyCode?.KeyV,
                    ].filter(Boolean),
                    run: () => {
                      toast.warning('Pasting from outside is disabled for this exam.');
                    },
                  });
                  // Also block context menu paste
                  editor.getDomNode()?.addEventListener('paste', (e) => {
                    e.preventDefault();
                    toast.warning('Pasting from outside is disabled for this exam.');
                  });
                }
              }}
            />
          </div>

          {/* Output panel */}
          <div className="h-64 border-t bg-card flex flex-col shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b shrink-0">
              <div className="flex items-center gap-1">
                {(['output', 'public', ...(privatePassedCount ? ['private'] : [])] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab as typeof activeTab)}
                    className={`px-3 h-11 text-xs font-medium rounded-xl transition-colors ${
                      activeTab === tab ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}>
                    {tab === 'output' ? 'Console' : tab === 'public' ? `Public (${publicResults.length})` : `Private (${privatePassedCount?.total || 0})`}
                  </button>
                ))}
              </div>
              <div className="exam-live-actions flex items-center gap-2">
                <button onClick={handleRun} disabled={isRunning}
                  className="flex items-center gap-1.5 px-3 h-11 bg-muted text-foreground rounded-xl text-xs font-medium hover:bg-muted/80 active:scale-[0.98] transition-all disabled:opacity-50">
                  {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} {isRunning ? 'Running...' : 'Run'}
                </button>
                <button onClick={handleSubmit} disabled={isRunning}
                  className="flex items-center gap-1.5 px-3 h-11 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
                  {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} {isRunning ? 'Submitting...' : 'Submit Solution'}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'output' && (
                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  {output || 'Click "Run" to test against public test cases, or "Submit Solution" to evaluate against all test cases.'}
                </pre>
              )}
              {activeTab === 'public' && publicResults.length > 0 && renderResults(publicResults, 'Public Test Cases')}
              {activeTab === 'public' && publicResults.length === 0 && (
                <p className="text-xs text-muted-foreground">Run your code to see public test case results.</p>
              )}
              {activeTab === 'private' && privatePassedCount && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <div className={`text-2xl font-bold tabular-nums ${privatePassedCount.passed === privatePassedCount.total ? 'text-primary' : 'text-accent'}`}>
                    {privatePassedCount.passed}/{privatePassedCount.total}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Private test cases passed
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// @ts-nocheck
import "@/exam/exam-student.css";
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { Terminal, AlertTriangle, Clock, Monitor, Eye, CheckSquare, ArrowRight } from 'lucide-react';
import { fetchSlots, fetchSettings } from '@/exam/lib/codexamSettings';
import { examAvailability, explicitlyAssigned } from '@/exam/lib/examAvailability';
import { toast } from 'sonner';
import { fetchKey } from '@/exam/lib/codexamSettings';
import { DEFAULT_MEDIA, MEDIA_KEY } from '@/exam/components/MediaProctor';
import { hasGranted } from '@/exam/lib/mediaSession';
import { notifyAdmin } from '@/lib/notifyAdmin';

export default function ExamInstructions() {
  const { user, questions, students, setStudents, exams } = useAuth();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const student = students.find(s => s.id === user?.id);

  // Get the selected exam from localStorage
  const selectedExamId = localStorage.getItem('codexam_selected_exam');
  const selectedExam = exams.find(e => e.id === selectedExamId && e.status !== 'draft');

  const handleStartExam = useCallback(async () => {
    if (!agreed || !student || !selectedExam) return;
    const [slots, settings, media] = await Promise.all([fetchSlots(), fetchSettings(), fetchKey(MEDIA_KEY, DEFAULT_MEDIA)]);
    const need = { ...DEFAULT_MEDIA, ...(media || {}) };
    if ((need.camera || need.microphone || need.screen) && !hasGranted(need)) {
      toast.error('Please allow monitoring before starting.'); navigate('/exam-permissions'); return;
    }
    const slot = slots[student.id]?.[selectedExam.id];
    const assigned = explicitlyAssigned(selectedExam, student.id, slot) || (settings.showUnassignedTests && !selectedExam.assignedStudentIds?.length);
    if (!assigned || examAvailability(selectedExam, Date.now(), slot).state !== 'open') {
      toast.error('Exam no longer available. Reply to your exam email to contact the admin.'); navigate('/exam-student'); return;
    }

    const continueToExam = () => {
      // Initialize global timer in localStorage
      if (selectedExam.isTimed !== false) {
        localStorage.setItem(`codexam_timer_${student.id}`, JSON.stringify({
          timeLeft: (selectedExam.examDurationMinutes || 60) * 60,
          savedAt: Date.now(),
        }));
      }
      // Track which exam is in progress per-student
      localStorage.setItem(`codexam_in_progress_${student.id}`, selectedExam.id);
      notifyAdmin('exam_started', { studentId: student.id, examId: selectedExam.id });
      setStudents(prev => prev.map(s =>
        s.id === student.id ? { ...s, examStatus: 'in_progress' as const } : s
      ));
      navigate('/exam-student');
    };

    const fullscreenPromise = document.documentElement.requestFullscreen?.();
    if (fullscreenPromise && typeof fullscreenPromise.finally === 'function') {
      fullscreenPromise.finally(continueToExam);
      return;
    }

    continueToExam();
  }, [agreed, navigate, student, setStudents, selectedExam]);

  if (!student || !selectedExam) {
    navigate('/exam-student');
    return null;
  }

  const isTimed = selectedExam.isTimed !== false;

  return (
    <div ref={containerRef} className="codexam-theme exam-student exam-preflight min-h-screen bg-muted/40 text-foreground p-4 sm:p-6 flex items-start sm:items-center justify-center">
      <div className="w-full max-w-2xl mx-auto">
        <nav aria-label="Exam preparation" className="exam-steps">
          <ol>
            <li><span>1</span><small>System check</small></li>
            <li><span>2</span><small>Permissions</small></li>
            <li aria-current="step"><span>3</span><small>Instructions</small></li>
            <li><span>4</span><small>Exam</small></li>
          </ol>
        </nav>
        <header className="surface-ink exam-instructions-header flex h-11 items-center justify-between gap-3 border-b border-border bg-card px-4 mb-4 rounded-xl">
          <h1 className="font-display flex min-w-0 items-center gap-2 text-sm font-semibold"><Terminal className="h-4 w-4 shrink-0 text-primary" />Exam Instructions</h1>
          <span className="shrink-0 text-xs text-muted-foreground">{isTimed ? `${selectedExam.examDurationMinutes || 60} min` : 'Untimed'}</span>
        </header>

        <div className="bg-card border rounded-[1.5rem] p-5 sm:p-7 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b">
            <h2 className="font-display font-semibold text-lg">{selectedExam.title}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
              {selectedExam.questionIds.length} question{selectedExam.questionIds.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-[1.5rem] bg-muted/40 p-4">
              <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {isTimed
                    ? `You have ${selectedExam.examDurationMinutes || 60} minutes for the entire exam. The timer starts when you enter.`
                    : 'This is an untimed test. Take as long as you need.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-[1.5rem] bg-muted/40 p-4">
              <Monitor className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Fullscreen Mode Required</p>
                <p className="text-sm text-muted-foreground">The exam runs in fullscreen mode. Exiting fullscreen will trigger a warning.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-[1.5rem] bg-muted/40 p-4">
              <Eye className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Tab Switch Monitoring</p>
                <p className="text-sm text-muted-foreground">
                  You are allowed a maximum of <strong>{student.maxTabSwitches}</strong> tab switches.
                  Exceeding this limit will <strong>terminate your exam automatically</strong>.
                  Current count: {student.tabSwitchCount}/{student.maxTabSwitches}.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-[1.5rem] bg-muted/40 p-4">
              <AlertTriangle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Important Rules</p>
                <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                  <li>• Do not switch tabs or windows during the exam</li>
                  <li>• Do not exit fullscreen mode</li>
                  <li>• Do not use any external resources unless permitted</li>
                  <li>• Your code will be tested against public and private test cases</li>
                  <li>• You can run your code against public test cases anytime</li>
                  <li>• Private test case results are NOT shown to you</li>
                  <li>• Marks are only visible to the admin</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <label className="flex items-start gap-3 p-4 bg-card border rounded-[1.5rem] cursor-pointer hover:bg-muted/30 transition-colors mb-6">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 accent-primary" />
          <span className="text-sm">
            I have read and understood the instructions. I agree to follow all exam rules and understand that
            violations will result in exam termination.
          </span>
        </label>

        <button onClick={handleStartExam} disabled={!agreed}
          className="exam-primary-action btn-pill btn-pill-primary w-full h-12 bg-primary text-primary-foreground rounded-[1.5rem] font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <CheckSquare className="w-4 h-4" />
          Enter Exam
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

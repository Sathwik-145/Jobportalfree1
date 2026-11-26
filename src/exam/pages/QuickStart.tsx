// @ts-nocheck
import "@/exam/exam-student.css";
import ExamBrandName from '@/components/ExamBrandName';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from '@/lib/router-compat';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { upsertStudent } from '@/exam/lib/supabase-helpers';
import { supabase } from '@/lib/db-client';
import { Student } from '@/exam/types';
import { Terminal, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { notifyAdmin } from '@/lib/notifyAdmin';
import { fetchKey, fetchSlots, saveKey } from '@/exam/lib/codexamSettings';
import { ALLOCATION_KEY, normalizeAllocation, pickRandomExam, personalSlot } from '@/exam/lib/testAllocation';

function genPassword() {
  return Math.random().toString(36).slice(-10);
}

export default function QuickStart() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state || {}) as { name?: string; email?: string; auto?: boolean };
  const { setStudents, exams, setExams } = useAuth();
  const [name, setName] = useState(prefill.name || '');
  const [email, setEmail] = useState(prefill.email || '');
  const [loading, setLoading] = useState(false);
  const autoRan = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    try {
      const alloc = normalizeAllocation(await fetchKey(ALLOCATION_KEY, null));
      if (!alloc.quickStartEnabled) {
        toast.error('Instant tests are paused right now. Please use standard registration.');
        setLoading(false);
        return;
      }
      // Build candidate pool from published tests (active or scheduled) inside the admin's pool.
      let rows: any[] = [];
      try {
        const { data: examRows, error: examErr } = await supabase
          .from('exams')
          .select('*')
          .in('status', ['active', 'scheduled']);
        if (!examErr && examRows) rows = examRows;
      } catch {}
      if (rows.length === 0) {
        rows = exams.map(ex => ({
          id: ex.id, title: ex.title, status: ex.status,
          question_ids: ex.questionIds, mcq_ids: ex.mcqIds,
          writing_ids: ex.writingIds, fib_ids: ex.fibIds,
          assigned_student_ids: ex.assignedStudentIds,
        }));
      }
      const picked: any = pickRandomExam(rows, alloc);
      if (!picked) {
        toast.error('No assessments available right now. Please contact admin.');
        setLoading(false);
        return;
      }

      const password = genPassword();
      const studentId = `s_${Date.now()}`;
      const newStudent: Student = {
        id: studentId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        isBlocked: false,
        tabSwitchCount: 0,
        maxTabSwitches: alloc.maxTabSwitches,
        examStatus: 'not_started',
        assignedQuestions: picked.question_ids || [],
        submissions: [],
        retakeExamIds: [],
      };

      try { await upsertStudent(newStudent); } catch {}
      // Admin setting: quick-start students see their own score after submitting.
      if (alloc.quickStartShowResults) {
        try { await supabase.from('students').update({ show_results: 'show' }).eq('id', studentId); } catch {}
      }

      // Give this student their own start window that begins now. Without it the window was
      // measured from when the test was first started (often long ago), so it showed
      // "Exam no longer available" straight away.
      const nowIso = new Date().toISOString();
      try {
        const slots = await fetchSlots();
        await saveKey('student_exam_slots', { ...slots, [studentId]: { ...(slots[studentId] || {}), [picked.id]: personalSlot(nowIso, alloc.quickStartWindowMinutes) } });
      } catch (err) { console.warn('Could not save the start window', err); }

      const newAssignedIds = Array.from(new Set([...(picked.assigned_student_ids || []), studentId]));
      try {
        await supabase.from('exams').update({ assigned_student_ids: newAssignedIds }).eq('id', picked.id);
      } catch {}

      try {
        const registrationId = crypto.randomUUID();
        const { error } = await supabase.from('registrations').insert({
          id: registrationId,
          name: newStudent.name, email: newStudent.email, phone: '',
          notes: `Quick-start auto-assigned to "${picked.title}"`,
          status: 'approved', approved_at: new Date().toISOString(),
          approved_student_id: studentId,
        });
        if (!error) notifyAdmin('quick_signup', { eventId: registrationId });
      } catch {}

      // Also persist locally so admin tabs see it even without DB
      try {
        const key = 'codexam_quick_registrations';
        const prev = JSON.parse(localStorage.getItem(key) || '[]');
        prev.unshift({
          id: `r_${Date.now()}`,
          name: newStudent.name, email: newStudent.email, phone: '',
          notes: `Quick-start auto-assigned to "${picked.title}"`,
          status: 'approved', created_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          approved_student_id: studentId,
          exam_id: picked.id, exam_title: picked.title,
        });
        localStorage.setItem(key, JSON.stringify(prev));
      } catch {}

      const authUser = { id: studentId, email: newStudent.email, name: newStudent.name, role: 'student' as const };
      localStorage.setItem('codexam_user', JSON.stringify(authUser));

      setStudents(prev => [...prev, newStudent]);
      setExams(prev => prev.map(e => e.id === picked.id ? { ...e, assignedStudentIds: newAssignedIds } : e));

      // Pre-select the exam so SystemCheck and downstream pages know which one
      localStorage.setItem('codexam_selected_exam', picked.id);

      toast.success(`Welcome ${newStudent.name}! Starting: ${picked.title}`);
      // Go directly into the system check flow
      setTimeout(() => { window.location.href = '/system-check'; }, 500);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to start assessment');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoRan.current) return;
    if (prefill.auto && prefill.name && prefill.email) {
      autoRan.current = true;
      handleSubmit({ preventDefault: () => {} } as any);
    }
  }, [prefill.auto, prefill.name, prefill.email]);

  return (
    <div className="codexam-theme exam-student exam-entry min-h-screen flex items-center justify-center bg-muted/40 p-4 sm:p-8 font-sans">
      <div className="w-full max-w-md">
        <div className="surface-ink portal-banner flex items-center justify-center gap-3 mb-6 rounded-[1.5rem] bg-primary bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 shadow-lg shadow-primary/10">
          <div className="w-12 h-12 rounded-[1.5rem] bg-primary flex items-center justify-center">
            <Terminal className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight"><ExamBrandName /></h1>
        </div>
        <div className="bg-card rounded-[1.5rem] border shadow-xl shadow-primary/5 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="font-display text-2xl font-bold tracking-tight">Instant Assessment</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your details — we'll assign you a random test and start it immediately.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Full name</label>
              <input required value={name} onChange={e => setName(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              {loading ? 'Allocating test...' : 'Start Assessment Now'}
            </button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-6">
            Want approval first? <Link to="/exam-register" className="text-primary hover:underline">Standard registration</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

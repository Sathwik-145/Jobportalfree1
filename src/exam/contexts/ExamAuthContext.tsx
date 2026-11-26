// @ts-nocheck
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { AuthUser, UserRole, Student, Question, Exam, MCQQuestion, WritingQuestion, FIBQuestion } from '@/exam/types';
import { sampleQuestions, sampleExams, sampleStudents, sampleMCQs, sampleFibs, sampleWritings } from '@/exam/data/sampleData';
import { fetchKey } from '@/exam/lib/codexamSettings';
import { checkStudentPassword } from '@/exam/lib/studentLogin.functions';
import { matchesLogin, PERSONAL_LOGIN_KEY, PERSONAL_LOGIN_POLICY_KEY, DEFAULT_PERSONAL_LOGIN_POLICY, personalLoginEnabled, uniquePersonalAddress } from '@/exam/lib/loginIdentity';
import {
  fetchQuestions, fetchStudents, fetchExams,
  upsertQuestion, deleteQuestion,
  upsertStudent, deleteStudentDb, upsertSubmission,
  upsertExam, deleteExamDb,
  fetchMCQs, upsertMCQ, deleteMCQ,
  fetchWritingQuestions, upsertWritingQuestion, deleteWritingQuestion,
  fetchFIBQuestions, upsertFIBQuestion, deleteFIBQuestion,
} from '@/exam/lib/supabase-helpers';

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  bridgeAdmin: (email: string) => void;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  mcqs: MCQQuestion[];
  setMcqs: React.Dispatch<React.SetStateAction<MCQQuestion[]>>;
  writings: WritingQuestion[];
  setWritings: React.Dispatch<React.SetStateAction<WritingQuestion[]>>;
  fibs: FIBQuestion[];
  setFibs: React.Dispatch<React.SetStateAction<FIBQuestion[]>>;
  activeExam: Exam | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('codexam_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [questions, setQuestionsState] = useState<Question[]>([]);
  const [students, setStudentsState] = useState<Student[]>([]);
  const [exams, setExamsState] = useState<Exam[]>([]);
  const [mcqs, setMcqsState] = useState<MCQQuestion[]>([]);
  const [writings, setWritings] = useState<WritingQuestion[]>([]);
  const [fibs, setFibs] = useState<FIBQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const prevQuestions = useRef<Question[]>([]);
  const prevStudents = useRef<Student[]>([]);
  const prevExams = useRef<Exam[]>([]);
  const prevMcqs = useRef<MCQQuestion[]>([]);
  const initialized = useRef(false);

  // Load data from DB on mount
  useEffect(() => {
    async function load() {
      // Local seed fallback (so the admin/student sees the bundled tests + questions
      // even when the remote DB is empty or unreachable).
      const seedQuestions = () => {
        try {
          const stored = localStorage.getItem('codexam_seed_questions');
          if (stored) return JSON.parse(stored) as Question[];
        } catch {}
        return sampleQuestions;
      };
      const seedExams = () => {
        try {
          const stored = localStorage.getItem('codexam_seed_exams');
          if (stored) return JSON.parse(stored) as Exam[];
        } catch {}
        return sampleExams;
      };
      const seedStudents = () => {
        try {
          const stored = localStorage.getItem('codexam_seed_students');
          if (stored) return JSON.parse(stored) as Student[];
        } catch {}
        return sampleStudents;
      };

      // Seed version: when bumped, missing default exams/questions/mcqs are merged into local cache.
      const SEED_VERSION = 'v3-2026-06-05';
      const oldVer = (() => { try { return localStorage.getItem('codexam_seed_version'); } catch { return null; } })();
      const versionBumped = oldVer !== SEED_VERSION;
      if (versionBumped) {
        try { localStorage.setItem('codexam_seed_version', SEED_VERSION); } catch {}
      }

      let q: Question[] = [];
      let s: Student[] = [];
      let e: Exam[] = [];
      let m: MCQQuestion[] = [];
      try {
        [q, s, e, m] = await Promise.all([fetchQuestions(), fetchStudents(), fetchExams(), fetchMCQs()]);
      } catch (err) {
        console.warn('Database unreachable, using local seed data:', err);
      }
      if (!q || q.length === 0) q = seedQuestions();
      if (!e || e.length === 0) e = seedExams();
      if (!s || s.length === 0) s = seedStudents();

      // Merge new seed exams that aren't already in the loaded list (covers stale localStorage).
      if (versionBumped || e.length < sampleExams.length) {
        const haveIds = new Set(e.map((x: any) => x.id));
        for (const seed of sampleExams) {
          if (!haveIds.has(seed.id)) e.push(seed);
        }
      }
      // Same for questions (so new coding/MCQ items show up)
      if (versionBumped) {
        const haveQ = new Set(q.map((x: any) => x.id));
        for (const seed of sampleQuestions) if (!haveQ.has(seed.id)) q.push(seed);
      }
      if (!m || m.length === 0) {
        try { const stored = localStorage.getItem('codexam_seed_mcqs'); m = stored ? JSON.parse(stored) : sampleMCQs; } catch { m = sampleMCQs; }
      }
      setQuestionsState(q);
      setStudentsState(s);
      setExamsState(e);
      setMcqsState(m || []);
      prevQuestions.current = q;
      prevStudents.current = s;
      prevExams.current = e;
      prevMcqs.current = m || [];
      initialized.current = true;
      setIsLoading(false);
    }
    load();
  }, []);


  // FIX: Periodic refetch of exams so students see activation changes
  useEffect(() => {
    const refresh = () => { void fetchStudents().then(rows => { setStudentsState(rows); prevStudents.current = rows; }); };
    window.addEventListener('exam-students-changed', refresh);
    return () => window.removeEventListener('exam-students-changed', refresh);
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    const interval = setInterval(async () => {
      try {
        const latestExams = await fetchExams();
        if (latestExams && latestExams.length > 0) {
          setExamsState(latestExams);
          prevExams.current = latestExams;
        }
      } catch (err) {
        console.warn('Failed to refetch exams:', err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.role]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    let consecutiveFailures = 0;
    const interval = setInterval(async () => {
      try {
        const latestStudents = await fetchStudents();
        if (latestStudents && latestStudents.length > 0) {
          setStudentsState(latestStudents);
          prevStudents.current = latestStudents;
        }
        consecutiveFailures = 0;
      } catch (err: any) {
        consecutiveFailures++;
        // Stop polling after 3 failures (e.g. table missing) to avoid console spam
        if (consecutiveFailures >= 3) {
          clearInterval(interval);
          console.info('[exam] Skipping students refetch — backend table not available.');
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.role]);

  // Local persistence fallback for seed data when DB is unreachable
  useEffect(() => {
    if (!initialized.current) return;
    try { localStorage.setItem('codexam_seed_questions', JSON.stringify(questions)); } catch {}
  }, [questions]);
  useEffect(() => {
    if (!initialized.current) return;
    try { localStorage.setItem('codexam_seed_exams', JSON.stringify(exams)); } catch {}
  }, [exams]);
  useEffect(() => {
    if (!initialized.current) return;
    try { localStorage.setItem('codexam_seed_students', JSON.stringify(students)); } catch {}
  }, [students]);
  useEffect(() => {
    if (!initialized.current) return;
    try { localStorage.setItem('codexam_seed_mcqs', JSON.stringify(mcqs)); } catch {}
  }, [mcqs]);
  useEffect(() => {
    if (!initialized.current) return;
    try { localStorage.setItem('codexam_seed_writings', JSON.stringify(writings)); } catch {}
  }, [writings]);
  useEffect(() => {
    if (!initialized.current) return;
    try { localStorage.setItem('codexam_seed_fibs', JSON.stringify(fibs)); } catch {}
  }, [fibs]);

  // Persist user to localStorage
  useEffect(() => {
    if (user) localStorage.setItem('codexam_user', JSON.stringify(user));
    else localStorage.removeItem('codexam_user');
  }, [user]);

  // Sync questions changes to DB
  useEffect(() => {
    if (!initialized.current) return;
    const prev = prevQuestions.current;
    const curr = questions;
    prevQuestions.current = curr;
    for (const q of curr) {
      const old = prev.find(p => p.id === q.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(q)) {
        upsertQuestion(q).catch(console.error);
      }
    }
    for (const p of prev) {
      if (!curr.find(q => q.id === p.id)) {
        deleteQuestion(p.id).catch(console.error);
      }
    }
  }, [questions]);

  // Sync students changes to DB
  useEffect(() => {
    if (!initialized.current) return;
    const prev = prevStudents.current;
    const curr = students;
    prevStudents.current = curr;
    for (const s of curr) {
      const old = prev.find(p => p.id === s.id);
      if (!old || JSON.stringify({ ...old, submissions: [] }) !== JSON.stringify({ ...s, submissions: [] })) {
        upsertStudent(s).catch(console.error);
      }
        for (const sub of (Array.isArray(s.submissions) ? s.submissions : [])) {
          const oldSub = (Array.isArray(old?.submissions) ? old.submissions : []).find(os => os.questionId === sub.questionId);
        if (!oldSub || JSON.stringify(oldSub) !== JSON.stringify(sub)) {
          upsertSubmission(s.id, sub).catch(console.error);
        }
      }
    }
    for (const p of prev) {
      if (!curr.find(s => s.id === p.id)) {
        deleteStudentDb(p.id).catch(console.error);
      }
    }
  }, [students]);

  // Sync exams changes to DB
  useEffect(() => {
    if (!initialized.current) return;
    const prev = prevExams.current;
    const curr = exams;
    prevExams.current = curr;
    for (const e of curr) {
      const old = prev.find(p => p.id === e.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(e)) {
        upsertExam(e).catch(console.error);
      }
    }
    for (const p of prev) {
      if (!curr.find(e => e.id === p.id)) {
        deleteExamDb(p.id).catch(console.error);
      }
    }
  }, [exams]);

  // FIX: Check scheduled exams - activate at scheduled time, NOT scheduled + buffer
  // Buffer is the window students have to START after activation
  useEffect(() => {
    const interval = setInterval(() => {
      setExamsState(prev => prev.map(exam => {
        if (exam.status === 'scheduled' && exam.scheduledAt) {
          const scheduled = new Date(exam.scheduledAt).getTime();
          // Activate at scheduled time, buffer is login window AFTER activation
          if (Date.now() >= scheduled) {
            return { ...exam, status: 'active' as const, startedAt: new Date().toISOString() };
          }
        }
        return exam;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeExam = exams.find(e => e.status === 'active') || null;

  const login = useCallback(async (email: string, password: string) => {
    try {
      const remote = await fetchStudents();
      let local: any[] = [];
      try { local = JSON.parse(localStorage.getItem('codexam_seed_students') || '[]'); } catch {}
      const merged = [...remote];
      for (const s of [...(prevStudents.current || []), ...local]) {
        if (s && !merged.some(m => m.id === s.id)) merged.push(s);
      }
      const latestStudents = merged;
      setStudentsState(latestStudents);
      prevStudents.current = latestStudents;

      // Also refetch exams on login so student gets latest state
      const latestExams = await fetchExams();
      setExamsState(latestExams);
      prevExams.current = latestExams;

      // Exam admins sign in through the main admin login (real account + admin role), never a built-in password.

      const em = email.trim().toLowerCase();
      const pw = password.trim();
      const [aliases, policy, contacts] = await Promise.all([
        fetchKey<Record<string, string>>(PERSONAL_LOGIN_KEY, {}),
        fetchKey(PERSONAL_LOGIN_POLICY_KEY, DEFAULT_PERSONAL_LOGIN_POLICY),
        fetchKey<Record<string, string>>('student_contacts', {}),
      ]);
      const candidates = latestStudents.filter(s => {
        let personal: string | undefined;
        const explicit = policy.students?.[s.id];
        if (explicit !== false && (personalLoginEnabled(policy, s.id) || (explicit === undefined && aliases[s.id]))) {
          try { personal = uniquePersonalAddress(s.id, s.email || '', contacts[s.id] || aliases[s.id], contacts, latestStudents); } catch { personal = undefined; }
        }
        return matchesLogin(s.email || '', personal, em);
      });
      if (!candidates.length || !pw) return { success: false, error: 'Invalid credentials.' };
      // Passwords are checked on the server; the browser never sees them.
      const { studentId } = await checkStudentPassword({ data: { candidateIds: candidates.slice(0, 25).map(s => s.id), password: pw } });
      const student = studentId ? candidates.find(s => s.id === studentId) : undefined;
      if (student) {
        if (student.isBlocked) return { success: false, error: 'Your access has been blocked. Contact admin.' };
        const u={ id: student.id, email: student.email, name: student.name, role: 'student' as const }; localStorage.setItem('codexam_user', JSON.stringify(u)); setUser(u);
        return { success: true, role: 'student' };
      }
      return { success: false, error: 'Invalid credentials.' };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Connection error. Please try again.' };
    }
  }, []);

  const logout = () => setUser(null);
  // Called only after the main sign-in confirmed an admin/sub-admin role.
  const bridgeAdmin = useCallback((email: string) => {
    setUser({ id: 'admin', email, name: 'Admin', role: 'admin' });
  }, []);

  // Sync MCQs
  useEffect(() => {
    if (!initialized.current) return;
    const prev = prevMcqs.current;
    const curr = mcqs;
    prevMcqs.current = curr;
    for (const m of curr) {
      const old = prev.find(p => p.id === m.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(m)) {
        upsertMCQ(m).catch(console.error);
      }
    }
    for (const p of prev) {
      if (!curr.find(m => m.id === p.id)) {
        deleteMCQ(p.id).catch(console.error);
      }
    }
  }, [mcqs]);

  useEffect(() => {
    const refresh = async () => {
      const [q, m, w, f, e] = await Promise.all([fetchQuestions(), fetchMCQs(), fetchWritingQuestions(), fetchFIBQuestions(), fetchExams()]);
      setQuestionsState(q); setMcqsState(m); setWritings(w); setFibs(f); setExamsState(e);
    };
    window.addEventListener('assistant-bank-updated', refresh);
    return () => window.removeEventListener('assistant-bank-updated', refresh);
  }, []);

  // Load writings & fibs on mount + poll (with local seed fallback)
  useEffect(() => {
    const seedW = () => { try { const s = localStorage.getItem('codexam_seed_writings'); return s ? JSON.parse(s) : sampleWritings; } catch { return sampleWritings; } };
    const seedF = () => { try { const s = localStorage.getItem('codexam_seed_fibs'); return s ? JSON.parse(s) : sampleFibs; } catch { return sampleFibs; } };
    fetchWritingQuestions().then(w => setWritings(w && w.length ? w : seedW())).catch(() => setWritings(seedW()));
    fetchFIBQuestions().then(f => setFibs(f && f.length ? f : seedF())).catch(() => setFibs(seedF()));
    const i = setInterval(() => {
      fetchWritingQuestions().then(w => { if (w && w.length) setWritings(w); }).catch(() => {});
      fetchFIBQuestions().then(f => { if (f && f.length) setFibs(f); }).catch(() => {});
    }, 8000);
    return () => clearInterval(i);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, login, logout, bridgeAdmin,
      questions, setQuestions: setQuestionsState,
      students, setStudents: setStudentsState,
      exams, setExams: setExamsState,
      mcqs, setMcqs: setMcqsState,
      writings, setWritings,
      fibs, setFibs,
      activeExam, isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
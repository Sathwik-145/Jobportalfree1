// @ts-nocheck
export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  publicTestCases: TestCase[];
  privateTestCases: TestCase[];
  defaultPublicCount: number;
  defaultPrivateCount: number;
  languages: string[];
  timeLimit: number;
  createdAt: string;
  order?: number;
  maxMarks?: number;
  sampleCount?: number;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  password: string;
  isBlocked: boolean;
  tabSwitchCount: number;
  maxTabSwitches: number;
  examStatus: 'not_started' | 'in_progress' | 'completed' | 'terminated';
  assignedQuestions: string[];
  submissions: Submission[];
  retakeExamIds?: string[];
}

export interface Submission {
  questionId: string;
  language: string;
  code: string;
  passedPublic: number;
  totalPublic: number;
  passedPrivate: number;
  totalPrivate: number;
  submittedAt: string;
  publicResults?: TestResultData[];
  privateResults?: TestResultData[];
  marks?: number;
  maxMarks?: number;
}

export interface TestResultData {
  passed: boolean;
  input: string;
  expected: string;
  got: string;
  error?: string;
}

export interface SectionNames {
  coding: string;
  mcq: string;
  writing: string;
  fib: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  questionIds: string[];
  mcqIds: string[];
  writingIds: string[];
  fibIds: string[];
  sectionNames: SectionNames;
  assignedStudentIds: string[];
  status: 'draft' | 'scheduled' | 'active' | 'ended';
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  isTimed: boolean;
  startBufferMinutes: number;
  examDurationMinutes: number;
  allowCopyPaste: boolean;
}

export interface WritingQuestion {
  id: string;
  title: string;
  prompt: string;
  minWords: number;
  maxWords: number;
  marks: number;
  createdAt: string;
}

export interface WritingSubmission {
  id?: string;
  studentId: string;
  examId: string;
  writingId: string;
  answerText: string;
  wordCount: number;
  marksAwarded: number;
  maxMarks: number;
  submittedAt: string;
}

export interface FIBQuestion {
  id: string;
  sentence: string;
  answers: string[];
  caseSensitive: boolean;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  createdAt: string;
}

export interface FIBSubmission {
  id?: string;
  studentId: string;
  examId: string;
  fibId: string;
  answers: string[];
  isCorrect: boolean;
  marksAwarded: number;
  maxMarks: number;
  submittedAt: string;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  explanation: string;
  createdAt: string;
}

export interface MCQSubmission {
  id?: string;
  studentId: string;
  examId: string;
  mcqId: string;
  selectedIndex: number;
  isCorrect: boolean;
  marksAwarded: number;
  submittedAt: string;
}

export interface Admin {
  email: string;
  password: string;
}

export type UserRole = 'admin' | 'student';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

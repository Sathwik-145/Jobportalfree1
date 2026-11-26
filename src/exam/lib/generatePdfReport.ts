// @ts-nocheck
import { Student, Question, MCQQuestion, MCQSubmission } from '@/exam/types';
import { buildReportPdf, reportFileName } from './resultReport';

/** Downloads the detailed report (questions, student answers, correct answers, improvements). */
export async function generatePdfReport(
  student: Student,
  questions: Question[],
  mcqs: MCQQuestion[] = [],
  mcqSubmissions: MCQSubmission[] = [],
  options: { includeQuestionsAndAnswers?: boolean; examTitle?: string; exam?: any; writings?: any[]; fibs?: any[]; writingSubs?: any[]; fibSubs?: any[] } = { includeQuestionsAndAnswers: true }
) {
  const input = {
    student,
    exam: options.exam || (options.examTitle ? { title: options.examTitle } : null),
    questions, mcqs, writings: options.writings || [], fibs: options.fibs || [],
    codingSubs: Array.isArray(student.submissions) ? student.submissions : [],
    mcqSubs: mcqSubmissions.filter(s => s.studentId === student.id),
    writingSubs: (options.writingSubs || []).filter(s => s.studentId === student.id),
    fibSubs: (options.fibSubs || []).filter(s => s.studentId === student.id),
    includeQA: options.includeQuestionsAndAnswers !== false,
  };
  const doc = await buildReportPdf(input);
  doc.save(reportFileName(input));
}

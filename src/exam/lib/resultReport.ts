// @ts-nocheck
// Shared (browser + server) result summary, improvement tips and detailed PDF builder.
import type { Student, Question, MCQQuestion, MCQSubmission, WritingQuestion, WritingSubmission, FIBQuestion, FIBSubmission, Exam } from '@/exam/types';
import { REPORT_LAYOUT_KEY, validReportLayout, reportLayoutInfo, type ReportLayout } from './reportLayouts';

export interface ReportInput {
  layout?: ReportLayout;
  student: Student;
  exam?: Exam | null;
  questions?: Question[];
  mcqs?: MCQQuestion[];
  writings?: WritingQuestion[];
  fibs?: FIBQuestion[];
  codingSubs?: Student['submissions'];
  mcqSubs?: MCQSubmission[];
  writingSubs?: WritingSubmission[];
  fibSubs?: FIBSubmission[];
  includeQA?: boolean;
  passPct?: number;
}

const DEFAULT_SN = { coding: 'Coding', mcq: 'Multiple Choice', writing: 'Writing', fib: 'Fill in the Blanks' };

export function summarize(r: ReportInput) {
  const mcqById = new Map((r.mcqs || []).map(m => [m.id, m]));
  const cs = r.codingSubs || [], ms = r.mcqSubs || [], ws = r.writingSubs || [], fs = r.fibSubs || [];
  const codingM = cs.reduce((a, s) => a + (s.marks ?? 0), 0), codingX = cs.reduce((a, s) => a + (s.maxMarks ?? 10), 0);
  const mcqM = ms.reduce((a, s) => a + (s.marksAwarded || 0), 0), mcqX = ms.reduce((a, s) => a + (mcqById.get(s.mcqId)?.marks ?? 1), 0);
  const writeM = ws.reduce((a, s) => a + (s.marksAwarded || 0), 0), writeX = ws.reduce((a, s) => a + (s.maxMarks || 0), 0);
  const fibM = fs.reduce((a, s) => a + (s.marksAwarded || 0), 0), fibX = fs.reduce((a, s) => a + (s.maxMarks || 0), 0);
  const total = codingM + mcqM + writeM + fibM, max = codingX + mcqX + writeX + fibX;
  const pct = max > 0 ? (total / max) * 100 : 0;
  return { codingM, codingX, mcqM, mcqX, writeM, writeX, fibM, fibX, total, max, pct };
}

export function improvementsFor(r: ReportInput): string[] {
  const s = summarize(r);
  const sn = { ...DEFAULT_SN, ...(r.exam?.sectionNames || {}) };
  const tips: string[] = [];
  const rate = (m: number, x: number) => (x > 0 ? m / x : 1);
  const mcqById = new Map((r.mcqs || []).map(m => [m.id, m]));
  if ((r.mcqSubs || []).length && rate(s.mcqM, s.mcqX) < 0.8) {
    const cats = [...new Set((r.mcqSubs || []).filter(x => !x.isCorrect).map(x => mcqById.get(x.mcqId)?.category).filter(Boolean))];
    tips.push(`${sn.mcq}: revise ${cats.length ? cats.slice(0, 4).join(', ') : 'the core concepts'} and practise timed quizzes. Read every option before choosing.`);
    const skipped = (r.mcqSubs || []).filter(x => x.selectedIndex < 0).length;
    if (skipped) tips.push(`${skipped} multiple-choice question(s) were left unanswered — attempt every question, there is no negative marking unless stated.`);
  }
  if ((r.fibSubs || []).length && rate(s.fibM, s.fibX) < 0.8) tips.push(`${sn.fib}: focus on exact terms and spelling; review key definitions and keywords.`);
  if ((r.writingSubs || []).length && rate(s.writeM, s.writeX) < 0.8) {
    const short = (r.writingSubs || []).filter(w => { const q = (r.writings || []).find(x => x.id === w.writingId); return q && w.wordCount < (q.minWords || 0); }).length;
    tips.push(`${sn.writing}: structure answers with an introduction, clear points and a conclusion${short ? `; ${short} answer(s) were below the minimum word count` : ''}.`);
  }
  if ((r.codingSubs || []).length && rate(s.codingM, s.codingX) < 0.8) {
    const failedPriv = (r.codingSubs || []).some(c => c.passedPrivate < c.totalPrivate);
    tips.push(`${sn.coding}: test edge cases (empty input, large numbers, duplicates)${failedPriv ? ' — some hidden test cases failed' : ''}, and dry-run your logic before submitting.`);
  }
  if ((r.student?.tabSwitchCount || 0) > 0) tips.push(`Stay on the exam tab — ${r.student.tabSwitchCount} tab switch(es) were recorded.`);
  if (!tips.length) tips.push(s.pct >= 90 ? 'Excellent work! Keep practising harder problems to stay sharp.' : 'Good performance. Review the questions you missed below to reach full marks.');
  return tips;
}

export function resultVars(r: ReportInput) {
  const m = summarize(r);
  const sn = { ...DEFAULT_SN, ...(r.exam?.sectionNames || {}) };
  const lines: string[] = [];
  if ((r.mcqSubs || []).length) lines.push(`• ${sn.mcq}: ${m.mcqM}/${m.mcqX}`);
  if ((r.codingSubs || []).length) lines.push(`• ${sn.coding}: ${m.codingM}/${m.codingX}`);
  if ((r.writingSubs || []).length) lines.push(`• ${sn.writing}: ${m.writeM}/${m.writeX}`);
  if ((r.fibSubs || []).length) lines.push(`• ${sn.fib}: ${m.fibM}/${m.fibX}`);
  const passPct = r.passPct ?? 40;
  return {
    examTitle: r.exam?.title || 'Assessment', score: String(m.total), maxScore: String(m.max), percentage: m.pct.toFixed(1),
    status: m.pct >= passPct ? 'Passed' : 'Not passed', sectionBreakdown: lines.join('\n'),
    improvements: improvementsFor(r).map(t => `• ${t}`).join('\n'),
  };
}

type RGB = [number, number, number];
const C = { green: [16, 185, 129] as RGB, dark: [15, 23, 42] as RGB, light: [241, 245, 249] as RGB, white: [255, 255, 255] as RGB, text: [30, 41, 59] as RGB, muted: [100, 116, 139] as RGB, red: [220, 38, 38] as RGB, code: [30, 41, 59] as RGB, amber: [217, 119, 6] as RGB };

/** Builds the detailed report. Returns the jsPDF document. */
export async function buildReportPdf(r: ReportInput) {
  let layout = r.layout;
  if (!layout && typeof window !== 'undefined') {
    const { fetchKey } = await import('./codexamSettings');
    layout = validReportLayout(await fetchKey(REPORT_LAYOUT_KEY, 'classic'));
  }
  layout = validReportLayout(layout);
  const includeQA = r.includeQA !== false;
  const mod = await import('jspdf');
  const JsPDF = (mod as any).jsPDF || (mod as any).default;
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 15, CW = W - M * 2;
  let y = 0;
  const s = summarize(r);
  const sn = { ...DEFAULT_SN, ...(r.exam?.sectionNames || {}) };
  const name = r.student?.name || 'Student';
  const page = (need: number) => { if (y + need > H - 18) { doc.addPage(); y = 16; doc.setFontSize(8); doc.setTextColor(...C.muted); doc.text(`Detailed report — ${name}${r.exam?.title ? ' · ' + r.exam.title : ''}`, M, 10); } };
  const para = (text: string, opts: { size?: number; color?: RGB; indent?: number; font?: string; max?: number } = {}) => {
    const size = opts.size ?? 9, ind = opts.indent ?? 0, lh = size * 0.42 + 0.6;
    doc.setFont(opts.font || 'helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(...(opts.color || C.text));
    const lines = doc.splitTextToSize(String(text ?? ''), CW - ind).slice(0, opts.max ?? 60);
    for (const ln of lines) { page(lh); doc.text(ln, M + ind, y + lh - 0.6); y += lh; }
    doc.setFont('helvetica', 'normal');
  };
  const label = (k: string, v: string, color: RGB) => { page(5); doc.setFontSize(8); doc.setTextColor(...C.muted); doc.text(k, M + 3, y + 3.5); const sv = y; y += 0; const startY = y; doc.setTextColor(...color); const lines = doc.splitTextToSize(v || '—', CW - 40).slice(0, 12); lines.forEach((ln, i) => { if (i) page(4); doc.text(ln, M + 38, (i ? y : startY) + 3.5); y += 4; }); y += 1; void sv; };
  const heading = (t: string) => { page(16); y += 2; doc.setFillColor(...P.accent); doc.rect(M, y, CW, 0.5, 'F'); y += 6; doc.setFontSize(13); doc.setTextColor(...C.text); doc.text(t, M, y); y += 6; };
  const qHead = (n: string, title: string, got: number, max: number, ok: boolean) => {
    page(12); doc.setFillColor(...(ok ? C.green : C.red)); doc.rect(M, y, 2.5, 7, 'F');
    doc.setFontSize(10); doc.setTextColor(...C.text);
    const lines = doc.splitTextToSize(`${n}. ${title}`, CW - 30).slice(0, 4);
    lines.forEach((ln, i) => doc.text(ln, M + 5, y + 5 + i * 4.4));
    doc.setTextColor(...(ok ? C.green : C.red)); doc.text(`${got}/${max}`, W - M, y + 5, { align: 'right' });
    y += Math.max(8, lines.length * 4.4 + 3);
  };

  const info = reportLayoutInfo(layout); const base = info.base;
  const P = { dark: [...info.colors.dark] as RGB, accent: [...info.colors.accent] as RGB, light: [...info.colors.light] as RGB };
  // All layouts retain identical scored content and detailed answers.
  if (base === 'compact') {
    y = 18; doc.setFontSize(16); doc.setTextColor(...P.dark); doc.text('ASSESSMENT PERFORMANCE REPORT', M, y);
    y += 9; doc.setFontSize(12); doc.text(name, M, y); y += 6;
    if (r.exam?.title) { doc.setFontSize(9); doc.text(doc.splitTextToSize(r.exam.title, CW), M, y); y += 8; }
    doc.setFontSize(18); doc.setTextColor(...P.accent); doc.text(`Score: ${s.total}/${s.max} (${s.pct.toFixed(0)}%)`, M, y); y += 10;
  } else if (base === 'editorial') {
    doc.setFillColor(...P.accent); doc.rect(M, 16, 3, 42, 'F');
    doc.setFontSize(11); doc.setTextColor(...C.muted); doc.text('ASSESSMENT / PERFORMANCE', M + 8, 23);
    doc.setFontSize(24); doc.setTextColor(...P.dark); doc.text(doc.splitTextToSize(name, CW - 10), M + 8, 35);
    y = 53; doc.setFontSize(10); doc.text(doc.splitTextToSize(r.exam?.title || 'Assessment', CW - 10), M + 8, y); y += 15;
    doc.setFillColor(...P.light); doc.rect(M, y, CW, 23, 'F'); doc.setFontSize(22); doc.setTextColor(...P.accent); doc.text(`${s.total}/${s.max}  ·  ${s.pct.toFixed(0)}%`, M + 6, y + 15); y += 30;
  } else {
  doc.setFillColor(...P.dark); doc.rect(0, 0, W, 32, 'F'); doc.setFillColor(...P.accent); doc.rect(0, 32, W, 2, 'F');
  doc.setFontSize(13); doc.setTextColor(...C.white); doc.text('CODEXAM  ·  DETAILED PERFORMANCE REPORT', W / 2, 19, { align: 'center' });
  y = 46; doc.setFontSize(22); doc.setTextColor(...C.text); doc.text(name, W / 2, y, { align: 'center' }); y += 8;
  if (r.exam?.title) { doc.setFontSize(11); doc.setTextColor(...C.muted); doc.text(r.exam.title, W / 2, y, { align: 'center' }); y += 8; }
  doc.setFillColor(...P.light); doc.roundedRect(M, y, CW, 28, 3, 3, 'F');
  doc.setFontSize(9); doc.setTextColor(...C.muted); doc.text('TOTAL SCORE', W / 2, y + 8, { align: 'center' });
  doc.setFontSize(26); doc.setTextColor(...P.accent); doc.text(`${s.total}/${s.max}  (${s.pct.toFixed(0)}%)`, W / 2, y + 21, { align: 'center' }); y += 34;
  }
  const sections = [
    (r.mcqSubs || []).length && [sn.mcq, s.mcqM, s.mcqX], (r.fibSubs || []).length && [sn.fib, s.fibM, s.fibX],
    (r.writingSubs || []).length && [sn.writing, s.writeM, s.writeX], (r.codingSubs || []).length && [sn.coding, s.codingM, s.codingX],
    [ 'Tab switches', r.student?.tabSwitchCount || 0, null ],
  ].filter(Boolean) as any[];
  const cw = CW / sections.length;
  sections.forEach(([t, a, b], i) => { const x = M + i * cw; doc.setFillColor(...P.light); doc.roundedRect(x + 1, y, cw - 2, 18, 2, 2, 'F'); doc.setFontSize(7); doc.setTextColor(...C.muted); doc.text(doc.splitTextToSize(String(t).toUpperCase(), cw - 4)[0], x + cw / 2, y + 6, { align: 'center' }); doc.setFontSize(12); doc.setTextColor(...C.text); doc.text(b == null ? String(a) : `${a}/${b}`, x + cw / 2, y + 14, { align: 'center' }); });
  y += 24;

  heading('Areas to improve');
  improvementsFor(r).forEach(t => { para(`•  ${t}`, { size: 9, indent: 2 }); y += 1; });

  // MCQ
  const mcqById = new Map((r.mcqs || []).map(m => [m.id, m]));
  const optText = (o: any) => (typeof o === 'string' ? o : o?.text ?? '');
  if ((r.mcqSubs || []).length) {
    heading(`${sn.mcq} (${s.mcqM}/${s.mcqX})`);
    r.mcqSubs.forEach((sub, i) => {
      const m = mcqById.get(sub.mcqId); if (!m) return;
      qHead(`Q${i + 1}`, includeQA ? m.question : 'Question', sub.marksAwarded || 0, m.marks ?? 1, !!sub.isCorrect);
      if (!includeQA) return;
      const opts = m.options || [];
      label('Your answer:', sub.selectedIndex >= 0 ? `${String.fromCharCode(65 + sub.selectedIndex)}. ${optText(opts[sub.selectedIndex])}` : 'Not attempted', sub.selectedIndex < 0 ? C.muted : sub.isCorrect ? C.green : C.red);
      label('Correct answer:', `${String.fromCharCode(65 + m.correctIndex)}. ${optText(opts[m.correctIndex])}`, C.green);
      if (m.explanation) label('Explanation:', m.explanation, C.text);
      y += 2;
    });
  }
  // FIB
  const fibById = new Map((r.fibs || []).map(f => [f.id, f]));
  if ((r.fibSubs || []).length) {
    heading(`${sn.fib} (${s.fibM}/${s.fibX})`);
    r.fibSubs.forEach((sub, i) => {
      const f = fibById.get(sub.fibId);
      qHead(`Q${i + 1}`, includeQA ? f?.sentence || 'Question' : 'Question', sub.marksAwarded || 0, sub.maxMarks || f?.marks || 1, !!sub.isCorrect);
      if (!includeQA) return;
      label('Your answer:', (sub.answers || []).filter(Boolean).join(', ') || 'Not attempted', sub.isCorrect ? C.green : C.red);
      label('Correct answer:', (f?.answers || []).join(' / ') || '—', C.green);
      if (f?.explanation) label('Explanation:', f.explanation, C.text);
      y += 2;
    });
  }
  // Writing
  const wById = new Map((r.writings || []).map(w => [w.id, w]));
  if ((r.writingSubs || []).length) {
    heading(`${sn.writing} (${s.writeM}/${s.writeX})`);
    r.writingSubs.forEach((sub, i) => {
      const w = wById.get(sub.writingId);
      const ok = (sub.maxMarks || 0) > 0 && (sub.marksAwarded || 0) / sub.maxMarks >= 0.6;
      qHead(`Q${i + 1}`, w?.title || 'Writing task', sub.marksAwarded || 0, sub.maxMarks || w?.marks || 0, ok);
      if (!includeQA) return;
      if (w?.prompt) label('Prompt:', w.prompt, C.text);
      label('Your answer:', `${sub.answerText || 'Not attempted'}\n(${sub.wordCount || 0} words${w ? `, expected ${w.minWords}–${w.maxWords}` : ''})`, C.text);
      y += 2;
    });
  }
  // Coding
  const qById = new Map((r.questions || []).map(q => [q.id, q]));
  if ((r.codingSubs || []).length) {
    heading(`${sn.coding} (${s.codingM}/${s.codingX})`);
    r.codingSubs.forEach((sub, i) => {
      const q = qById.get(sub.questionId);
      const ok = sub.isCorrect ?? (sub.passedPublic === sub.totalPublic && sub.passedPrivate === sub.totalPrivate);
      qHead(`Q${i + 1}`, q?.title || sub.questionId, sub.marks ?? 0, sub.maxMarks ?? 10, ok);
      para(`Tests passed — public ${sub.passedPublic}/${sub.totalPublic}, hidden ${sub.passedPrivate}/${sub.totalPrivate} · ${sub.language}`, { size: 8, color: ok ? C.green : C.amber, indent: 3 });
      if (!includeQA) return;
      if (q?.description) { y += 1; para(q.description, { size: 8, indent: 3, max: 12 }); }
      y += 1; para('Your code:', { size: 8, color: C.muted, indent: 3 });
      para((sub.code || '').split('\n').slice(0, 40).join('\n'), { size: 7, font: 'courier', indent: 5, max: 40 });
      (sub.publicResults || []).slice(0, 6).forEach((t, k) => {
        para(`Case ${k + 1}: ${t.passed ? 'PASSED' : 'FAILED'} · input: ${String(t.input).replace(/\n/g, ' ').slice(0, 60)} · expected: ${String(t.expected).replace(/\n/g, ' ').slice(0, 50)} · got: ${String(t.got).replace(/\n/g, ' ').slice(0, 50)}`, { size: 7, color: t.passed ? C.green : C.red, indent: 5, max: 3 });
      });
      y += 3;
    });
  }

  const pages = doc.getNumberOfPages();
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setFontSize(7); doc.setTextColor(...C.muted); doc.text(`Generated ${date} · CodeXam · Page ${i} of ${pages}`, W / 2, H - 7, { align: 'center' }); doc.setFillColor(...P.accent); doc.rect(0, H - 3, W, 3, 'F'); }
  return doc;
}

export const reportFileName = (r: ReportInput) => `Report_${(r.student?.name || 'Student').replace(/[^\w-]+/g, '_')}${r.exam?.title ? '_' + r.exam.title.replace(/[^\w-]+/g, '_').slice(0, 40) : ''}.pdf`;

export async function reportPdfBase64(r: ReportInput): Promise<string> {
  const doc = await buildReportPdf(r);
  const dataUri: string = doc.output('datauristring');
  return dataUri.slice(dataUri.indexOf(',') + 1);
}

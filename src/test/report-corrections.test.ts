import { expect, test } from 'vitest';
import { correctedReport, correctionKey, validateCorrection } from '@/exam/lib/reportCorrections';
import { resultVars } from '@/exam/lib/resultReport';
test('manual marks update the shared score without changing another test', () => {
  const report = { student: { id: 's' }, exam: { id: 'e' }, fibSubs: [{ fibId: 'f', marksAwarded: 0, maxMarks: 2, isCorrect: false }] };
  const corrections = { [correctionKey('s', 'e', 'fib', 'f')]: { marks: 2, isCorrect: true } };
  expect(resultVars(correctedReport(report, corrections) as any).score).toBe('2');
  expect(correctedReport({ ...report, exam: { id: 'other' } }, corrections).fibSubs?.[0].marksAwarded).toBe(0);
});
test('marks cannot exceed the answer maximum or be negative', () => {
  expect(() => validateCorrection(3, 2)).toThrow(); expect(() => validateCorrection(-1, 2)).toThrow(); expect(validateCorrection(1.5, 2)).toBe(1.5);
});
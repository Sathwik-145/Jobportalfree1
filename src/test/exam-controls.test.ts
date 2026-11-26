import { describe, it, expect } from 'vitest';
import { plannedExamIds, examAvailability } from '@/exam/lib/examAvailability';
import { unsubmittedDailyExamIds } from '@/exam/lib/dailyAssignments';
import { bulkTestStatus } from '@/exam/lib/testActions';
import { adminEventEnabled, ADMIN_EVENTS } from '@/lib/admin-events';

describe('Requested exam controls', () => {
  const exams = [{ id: 'number-puzzles', status: 'active' }, { id: 'sql', status: 'scheduled' }, { id: 'writing', status: 'active' }];
  it('replaces submitted Number Puzzles with an unsubmitted daily test', () => {
    expect(unsubmittedDailyExamIds(['number-puzzles'], exams, ['number-puzzles'])).toEqual(['sql']);
  });
  it('does not replace an exact SQL assignment when it has not been submitted', () => {
    expect(unsubmittedDailyExamIds(['sql'], exams, ['number-puzzles'])).toEqual(['sql']);
  });
  it('does not repeat submitted tests when every test is exhausted', () => {
    expect(unsubmittedDailyExamIds(['number-puzzles'], exams, exams.map(e => e.id))).toEqual([]);
  });
  it('keeps all daily tests distinct when replacing completed tests', () => {
    expect(unsubmittedDailyExamIds(['number-puzzles', 'sql'], exams, ['number-puzzles'])).toEqual(['writing', 'sql']);
  });
  it('does not allocate a fallback test on an unplanned day', () => {
    expect(plannedExamIds({ assignMode: 'daily', defaultExamId: 'number-puzzles', dailyPlan: { student: { '2026-10-22': 'sql' } } }, 'student', '2026-10-23')).toEqual([]);
  });
  it('closes a test after the configured start window', () => {
    const start = Date.parse('2026-10-23T06:00:00Z');
    expect(examAvailability({ id: 'sql', status: 'active' }, start + 11 * 60000, { start: '2026-10-23T06:00:00Z', buffer: 10 }).state).toBe('closed');
  });
  it('starts all tests with the same new start time and clears old dates', () => {
    const at = '2026-10-23T06:00:00Z';
    expect(bulkTestStatus([{ status: 'draft' }, { status: 'ended', endedAt: 'old', scheduledAt: 'old' }], 'start', at)).toEqual([
      { status: 'active', startedAt: at, endedAt: undefined, scheduledAt: undefined },
      { status: 'active', startedAt: at, endedAt: undefined, scheduledAt: undefined },
    ]);
  });
  it('ends all tests', () => {
    expect(bulkTestStatus(exams, 'end', '2026-10-23T06:00:00Z').every(e => e.status === 'ended')).toBe(true);
  });
  for (const event of Object.keys(ADMIN_EVENTS) as (keyof typeof ADMIN_EVENTS)[]) {
    it(`lets the admin independently disable ${event} alerts`, () => {
      expect(adminEventEnabled({}, event)).toBe(true);
      expect(adminEventEnabled({ [event]: false }, event)).toBe(false);
      expect(adminEventEnabled({ all: false }, event)).toBe(false);
    });
  }
});
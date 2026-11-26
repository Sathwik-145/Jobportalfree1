import { describe, it, expect } from 'vitest';
import { eligibleExams, pickRandomExam, normalizeAllocation, parseSlotTime, upcomingBookingDates, DEFAULT_ALLOCATION } from '@/exam/lib/testAllocation';
import { examAvailability } from '@/exam/lib/examAvailability';
import { festivalAllowedOn } from '@/lib/examPaths';

const exams = [
  { id: 'a', status: 'active', mcq_ids: ['m1'] },
  { id: 'b', status: 'scheduled', question_ids: ['q1'] },
  { id: 'c', status: 'draft', mcq_ids: ['m1'] },
  { id: 'd', status: 'active', mcq_ids: [] },
  { id: 'e', status: 'ended', mcq_ids: ['m1'] },
];

describe('random test allocation', () => {
  it('only picks published tests that have questions', () => {
    expect(eligibleExams(exams, DEFAULT_ALLOCATION).map(e => e.id)).toEqual(['a', 'b']);
  });
  it('respects the admin-picked pool', () => {
    const s = normalizeAllocation({ poolMode: 'selected', poolExamIds: ['b'] });
    expect(pickRandomExam(exams, s, () => 0)?.id).toBe('b');
  });
  it('returns nothing when no test is available', () => {
    expect(pickRandomExam([exams[2]], DEFAULT_ALLOCATION)).toBeNull();
  });
});

describe('quick start start window', () => {
  it('a test started long ago is closed without a personal window', () => {
    const exam = { id: 'a', status: 'active', startedAt: '2026-01-01T09:00:00Z', startBufferMinutes: 10 };
    expect(examAvailability(exam, Date.parse('2026-11-09T12:00:00Z')).state).toBe('closed');
  });
  it('a personal window that starts now keeps it open for the chosen minutes', () => {
    const exam = { id: 'a', status: 'active', startedAt: '2026-01-01T09:00:00Z', startBufferMinutes: 10 };
    const slot = { start: '2026-11-09T12:00:00Z', buffer: 30 };
    expect(examAvailability(exam, Date.parse('2026-11-09T12:20:00Z'), slot).state).toBe('open');
    expect(examAvailability(exam, Date.parse('2026-11-09T12:31:00Z'), slot).state).toBe('closed');
  });
  it('defaults to a 30 minute quick start window and 60 minute approval window', () => {
    const s = normalizeAllocation(null);
    expect(s.quickStartWindowMinutes).toBe(30);
    expect(s.approvalWindowMinutes).toBe(60);
  });
});

describe('slot booking', () => {
  it('reads 12-hour and 24-hour slot times', () => {
    expect(parseSlotTime('02:30 PM')).toEqual([14, 30]);
    expect(parseSlotTime('12:00 AM')).toEqual([0, 0]);
    expect(parseSlotTime('09:15')).toEqual([9, 15]);
    expect(parseSlotTime('nope')).toBeNull();
  });
  it('offers the configured number of days and skips Sundays', () => {
    const s = normalizeAllocation({ bookingDays: 3, bookingSkipSundays: true });
    const days = upcomingBookingDates(s, new Date(2026, 10, 7)); // Saturday 7 Nov 2026
    expect(days).toEqual(['2026-11-09', '2026-11-10', '2026-11-11']);
  });
});

describe('festival look on exam pages', () => {
  it('is hidden on student exam pages unless the admin turns it on', () => {
    expect(festivalAllowedOn('/exam-student', {})).toBe(false);
    expect(festivalAllowedOn('/exam-student', { examPages: true })).toBe(true);
  });
  it('shows on exam admin pages unless the admin turns it off', () => {
    expect(festivalAllowedOn('/exam-admin/tests', {})).toBe(true);
    expect(festivalAllowedOn('/exam-admin/tests', { examAdminPages: false })).toBe(false);
  });
  it('always shows on regular pages', () => {
    expect(festivalAllowedOn('/jobs', { examPages: false, examAdminPages: false })).toBe(true);
  });
});

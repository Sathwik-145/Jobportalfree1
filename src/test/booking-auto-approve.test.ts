import { describe, it, expect } from 'vitest';
import { autoApproveDueAt, normalizeAllocation } from '@/exam/lib/testAllocation';
import { sourceResultCfg } from '@/exam/lib/resultSourceDefaults';

const booked = '2026-11-09T10:00:00.000Z';
const t = Date.parse(booked);

describe('slot booking automatic approval', () => {
  it('is off until the admin switches it on', () => {
    expect(normalizeAllocation({}).bookingAutoApprove).toBe(false);
  });
  it('approves immediately when the delay is 0', () => {
    const s = normalizeAllocation({ bookingAutoApprove: true, bookingAutoDelayMinutes: 0 });
    expect(autoApproveDueAt(booked, s)).toBe(t);
  });
  it('waits 5 minutes when the admin picks "after 5 min"', () => {
    const s = normalizeAllocation({ bookingAutoApprove: true, bookingAutoDelayMinutes: 5 });
    expect(autoApproveDueAt(booked, s)).toBe(t + 5 * 60_000);
  });
  it('uses a custom number of minutes', () => {
    const s = normalizeAllocation({ bookingAutoApprove: true, bookingAutoDelayMinutes: 17 });
    expect(autoApproveDueAt(booked, s)).toBe(t + 17 * 60_000);
  });
  it('defaults to a random test and emailing the login', () => {
    const s = normalizeAllocation({ bookingAutoApprove: true });
    expect(s.bookingAutoExamId).toBe('');
    expect(s.bookingAutoSendEmail).toBe(true);
  });
  it('keeps the specific test the admin chose', () => {
    expect(normalizeAllocation({ bookingAutoExamId: 'exam_42' }).bookingAutoExamId).toBe('exam_42');
  });
});

describe('quick-start result emails', () => {
  it('send right after submit when the admin has not chosen otherwise', () => {
    const c = sourceResultCfg({}, 'quick');
    expect(c.mode).toBe('now');
    expect(c.enabled).toBe(true);
    expect(c.delayMinutes).toBe(0);
  });
  it('follow the admin choice once saved', () => {
    expect(sourceResultCfg({ quick: { mode: 'manual', enabled: false } }, 'quick').enabled).toBe(false);
  });
  it('leave booked-for-later students on the test setting by default', () => {
    expect(sourceResultCfg({}, 'later').mode).toBe('default');
  });
});

describe('quick-start on-screen results', () => {
  it('are shown by default', () => {
    expect(normalizeAllocation({}).quickStartShowResults).toBe(true);
  });
  it('can be switched off by the admin', () => {
    expect(normalizeAllocation({ quickStartShowResults: false }).quickStartShowResults).toBe(false);
  });
});

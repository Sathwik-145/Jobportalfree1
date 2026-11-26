import { test, expect } from 'vitest';
import { resultDueAt } from '@/exam/lib/resultSchedule';
test('delayed results wait five minutes', () => expect(resultDueAt(1000, { delayMinutes: 5 })).toBe(301000));
test('daily result emails use the selected local time and roll to tomorrow after it passes', () => {
  expect(new Date(resultDueAt(Date.parse('2026-10-20T10:00:00Z'), { frequency: 'daily', time: '18:17', tzOffsetMinutes: 330 })).toISOString()).toBe('2026-10-20T12:47:00.000Z');
  expect(new Date(resultDueAt(Date.parse('2026-10-20T14:00:00Z'), { frequency: 'daily', time: '18:17', tzOffsetMinutes: 330 })).toISOString()).toBe('2026-10-21T12:47:00.000Z');
});
import type { PersonalSlot } from './examAvailability';
export function grantInstantAccess(slots: Record<string, Record<string, PersonalSlot>>, studentIds: string[], examId: string, minutes: number, now: string) {
  if (!examId || !studentIds.length || !Number.isInteger(minutes) || minutes < 5 || minutes > 1440 || !Number.isFinite(Date.parse(now))) throw new Error('Select students and a test, and enter 5–1440 minutes.');
  const next = { ...slots };
  for (const id of studentIds) next[id] = { ...(next[id] || {}), [examId]: { start: now, buffer: minutes } };
  return next;
}
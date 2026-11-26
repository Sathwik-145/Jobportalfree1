type AvailabilityExam = { id: string; status: string; scheduledAt?: string; startedAt?: string; startBufferMinutes?: number; assignedStudentIds?: string[] };
export type PersonalSlot = { start: string | null; buffer: number };

export function examAvailability(exam: AvailabilityExam, now: number, slot?: PersonalSlot) {
  const startIso = slot?.start || (slot ? exam.scheduledAt : exam.status === 'scheduled' ? exam.scheduledAt : exam.startedAt || exam.scheduledAt);
  const start = startIso ? Date.parse(startIso) : null;
  const buffer = slot ? slot.buffer : exam.startBufferMinutes || 0;
  const end = start !== null && buffer > 0 ? start + buffer * 60000 : null;
  if (exam.status === 'draft') return { state: 'unavailable' as const, start, end };
  if (exam.status === 'ended' && !slot) return { state: 'closed' as const, start, end };
  if (start !== null && now < start) return { state: 'before' as const, start, end };
  if (end !== null && now > end) return { state: 'closed' as const, start, end };
  if (slot || exam.status === 'active' || (exam.status === 'scheduled' && start !== null)) return { state: 'open' as const, start, end };
  return { state: 'unavailable' as const, start, end };
}

export function explicitlyAssigned(exam: AvailabilityExam, studentId: string, slot?: PersonalSlot) {
  return !!slot || !!exam.assignedStudentIds?.includes(studentId);
}

export function plannedExamIds(schedule: { assignMode?: string; dailyPlan?: Record<string, Record<string, string | string[]>>; perStudentExam?: Record<string, string>; defaultExamId?: string }, studentId: string, date: string): string[] {
  const value = schedule.assignMode === 'daily' ? schedule.dailyPlan?.[studentId]?.[date] : undefined;
  // A daily plan is exact: an empty day must not silently send a different fallback test.
  const ids = schedule.assignMode === 'daily' ? (Array.isArray(value) ? value : value ? [value] : []) : [(schedule.assignMode === 'different' && schedule.perStudentExam?.[studentId]) || schedule.defaultExamId || ''];
  return [...new Set(ids.filter(Boolean))];
}

export function inSubmissionDateRange(timestamp: string, from: string, to: string) {
  if (!from && !to) return true;
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return false;
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return (!from || day >= from) && (!to || day <= to);
}
// Shared by browser and server (no imports): how random tests are picked for quick start,
// registration approvals and slot bookings, plus the admin-editable allocation settings.

export const ALLOCATION_KEY = 'test_allocation';

export interface AllocationSettings {
  /** Quick start page on/off. */
  quickStartEnabled: boolean;
  /** Minutes a quick-start student has to begin the test after signing up. */
  quickStartWindowMinutes: number;
  /** Quick-start students see their score on screen after submitting, even when results are hidden for others. */
  quickStartShowResults: boolean;
  /** Default start window (minutes) used when the admin approves a registration or booking. */
  approvalWindowMinutes: number;
  /** Which tests may be picked at random: every published test, or only the chosen ones. */
  poolMode: 'all' | 'selected';
  poolExamIds: string[];
  /** Tab switches allowed for new students. */
  maxTabSwitches: number;
  /** Email template used when approving. */
  approvalTemplateId: string;
  /** Slot booking options on the public assessments page. */
  bookingEnabled: boolean;
  bookingDays: number;
  bookingSkipSundays: boolean;
  bookingSlots: string[];
  /** Approve slot bookings automatically (allocate a test and email the login). */
  bookingAutoApprove: boolean;
  /** Minutes after booking before the automatic approval runs (0 = immediately). */
  bookingAutoDelayMinutes: number;
  /** Test given by automatic approval; empty = random from the pool. */
  bookingAutoExamId: string;
  /** Email the login details on automatic approval. */
  bookingAutoSendEmail: boolean;
  /** Only bookings made after this moment (ms) are auto-approved, so switching it on never approves old ones. */
  bookingAutoSince: number | null;
}

export const DEFAULT_ALLOCATION: AllocationSettings = {
  quickStartEnabled: true,
  quickStartWindowMinutes: 30,
  quickStartShowResults: true,
  approvalWindowMinutes: 60,
  poolMode: 'all',
  poolExamIds: [],
  maxTabSwitches: 3,
  approvalTemplateId: 'credentials',
  bookingEnabled: true,
  bookingDays: 7,
  bookingSkipSundays: true,
  bookingSlots: ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '03:30 PM', '05:00 PM'],
  bookingAutoApprove: false,
  bookingAutoDelayMinutes: 0,
  bookingAutoExamId: '',
  bookingAutoSendEmail: true,
  bookingAutoSince: null,
};

const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export function normalizeAllocation(raw: any): AllocationSettings {
  const v = { ...DEFAULT_ALLOCATION, ...(raw && typeof raw === 'object' ? raw : {}) };
  return {
    quickStartEnabled: v.quickStartEnabled !== false,
    quickStartWindowMinutes: clampInt(v.quickStartWindowMinutes, 5, 1440, DEFAULT_ALLOCATION.quickStartWindowMinutes),
    quickStartShowResults: v.quickStartShowResults !== false,
    approvalWindowMinutes: clampInt(v.approvalWindowMinutes, 5, 10080, DEFAULT_ALLOCATION.approvalWindowMinutes),
    poolMode: v.poolMode === 'selected' ? 'selected' : 'all',
    poolExamIds: Array.isArray(v.poolExamIds) ? v.poolExamIds.map(String).slice(0, 500) : [],
    maxTabSwitches: clampInt(v.maxTabSwitches, 1, 50, DEFAULT_ALLOCATION.maxTabSwitches),
    approvalTemplateId: typeof v.approvalTemplateId === 'string' && v.approvalTemplateId ? v.approvalTemplateId.slice(0, 60) : 'credentials',
    bookingEnabled: v.bookingEnabled !== false,
    bookingDays: clampInt(v.bookingDays, 1, 60, DEFAULT_ALLOCATION.bookingDays),
    bookingSkipSundays: v.bookingSkipSundays !== false,
    bookingSlots: Array.isArray(v.bookingSlots) && v.bookingSlots.length
      ? v.bookingSlots.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 24)
      : DEFAULT_ALLOCATION.bookingSlots,
    bookingAutoApprove: v.bookingAutoApprove === true,
    bookingAutoDelayMinutes: clampInt(v.bookingAutoDelayMinutes, 0, 10080, 0),
    bookingAutoExamId: typeof v.bookingAutoExamId === 'string' ? v.bookingAutoExamId.slice(0, 80) : '',
    bookingAutoSendEmail: v.bookingAutoSendEmail !== false,
    bookingAutoSince: Number.isFinite(Number(v.bookingAutoSince)) && Number(v.bookingAutoSince) > 0 ? Number(v.bookingAutoSince) : null,
  };
}

/** When a booking made at `createdAt` should be approved automatically (ms). */
export function autoApproveDueAt(createdAt: string | number | Date, s: AllocationSettings): number {
  const t = new Date(createdAt).getTime();
  return (Number.isFinite(t) ? t : 0) + s.bookingAutoDelayMinutes * 60_000;
}

/** Minimal exam shape in database (snake_case) form. */
export interface AllocExam {
  id: string;
  title?: string | null;
  status?: string | null;
  question_ids?: unknown;
  mcq_ids?: unknown;
  writing_ids?: unknown;
  fib_ids?: unknown;
}

const count = (v: unknown) => (Array.isArray(v) ? v.length : 0);
export const examHasQuestions = (e: AllocExam) => count(e.question_ids) + count(e.mcq_ids) + count(e.writing_ids) + count(e.fib_ids) > 0;

/** Tests that may be handed out at random: published (active or scheduled), not empty, inside the admin's pool. */
export function eligibleExams<T extends AllocExam>(exams: T[], s: AllocationSettings): T[] {
  const pool = new Set(s.poolExamIds);
  return exams.filter(e =>
    (e.status === 'active' || e.status === 'scheduled') &&
    examHasQuestions(e) &&
    (s.poolMode === 'all' || pool.has(e.id)));
}

export function pickRandomExam<T extends AllocExam>(exams: T[], s: AllocationSettings, rand: () => number = Math.random): T | null {
  const list = eligibleExams(exams, s);
  if (!list.length) return null;
  return list[Math.min(list.length - 1, Math.floor(rand() * list.length))];
}

/** Personal start slot for a student: open from `startIso` for `minutes`. */
export function personalSlot(startIso: string, minutes: number) {
  return { start: startIso, buffer: Math.max(5, Math.round(minutes)) };
}

/** "09:30 AM" -> [9, 30]; "14:05" -> [14, 5]. Null when unreadable. */
export function parseSlotTime(t: string): [number, number] | null {
  const m = /^\s*(\d{1,2}):(\d{2})\s*(am|pm)?\s*$/i.exec(t || '');
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3]?.toLowerCase();
  if (min > 59 || h > 23 || (ap && (h < 1 || h > 12))) return null;
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  return [h, min];
}

/** Upcoming booking dates (yyyy-MM-dd, local), starting tomorrow. */
export function upcomingBookingDates(s: AllocationSettings, today = new Date()): string[] {
  const out: string[] = [];
  for (let i = 1; out.length < s.bookingDays && i < 400; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    if (s.bookingSkipSundays && d.getDay() === 0) continue;
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return out;
}

// @ts-nocheck
import { supabase } from '@/lib/db-client';
import type { MailAttachment } from './mailAttachments';

export interface CodexamSettings {
  resultsMode: 'show' | 'hide';
  showSupportEmail: boolean;
  supportEmail: string;
  emailSubject: string;
  emailBody: string;
  /** Where "Back to Home" goes for students: exam dashboard or job portal landing page */
  homeLinkTarget: 'exam' | 'landing';
  /** Which address credential mails go to by default */
  mailTarget: 'personal' | 'login';
  /** Show completed tests on the student exam dashboard (portal default) */
  showCompletedTests: boolean;
  showExpiredTests: boolean;
  showUnassignedTests: boolean;
  showUpcomingTests: boolean;
  /** Per-student override for completed tests: studentId -> 'show' | 'hide' */
  completedOverrides: Record<string, 'show' | 'hide'>;
  /** Email templates the admin can pick from */
  templates: MailTemplate[];
}

export type { MailTemplate } from './mailTemplates';
export { TEMPLATE_VARS, DEFAULT_TEMPLATES } from './mailTemplates';
import { DEFAULT_TEMPLATES } from './mailTemplates';

export const DEFAULT_SETTINGS: CodexamSettings = {
  resultsMode: 'show',
  showSupportEmail: true,
  supportEmail: 'jobportalfreeofficial@gmail.com',
  emailSubject: 'Your CodeXam exam credentials',
  emailBody:
    'Hi {{name}},\n\nYou have been approved for the CodeXam assessment.\n\nLogin page: {{loginUrl}}\nEmail: {{email}}\nPassword: {{password}}\n\nPlease keep these details private.\n\nAll the best!\nTeam JobPortalFree',
  homeLinkTarget: 'exam',
  mailTarget: 'personal',
  showCompletedTests: true,
  showExpiredTests: false,
  showUnassignedTests: false,
  showUpcomingTests: true,
  completedOverrides: {},
  templates: DEFAULT_TEMPLATES,
};

/* ---------- generic key/value helpers (codexam_settings table) ---------- */
export async function fetchKey<T>(key: string, fallback: T): Promise<T> {
  try {
    const { data } = await supabase.from('codexam_settings').select('value').eq('key', key).maybeSingle();
    return (data?.value ?? fallback) as T;
  } catch { return fallback; }
}
export async function saveKey(key: string, value: any) {
  const { error } = await supabase.from('codexam_settings').upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/** Personal (real) email per student: studentId -> email */
export const fetchContacts = () => fetchKey<Record<string, string>>('student_contacts', {});
export async function setContact(studentId: string, email: string) {
  const m = await fetchContacts();
  if (email && email.trim()) m[studentId] = email.trim().toLowerCase(); else delete m[studentId];
  await saveKey('student_contacts', m);
  return m;
}

export interface MailerSettings { senderEmail: string; senderName: string; appPassword: string }
export const DEFAULT_MAILER: MailerSettings = { senderEmail: '', senderName: 'CodeXam', appPassword: '' };

export interface MailSchedule {
  usePersonalLogin: boolean;
  enabled: boolean;
  frequency: 'daily' | 'dates' | 'range';
  time: string;              // HH:MM in admin's local time
  tzOffsetMinutes: number;   // admin browser offset (minutes east of UTC)
  dates: string[];           // yyyy-MM-dd
  rangeFrom: string | null;
  rangeTo: string | null;
  recipients: 'all' | 'selected';
  studentIds: string[];
  onlyNotSent?: boolean;
  /** skip students who received it on any earlier run */
  onceEver?: boolean;
  /** studentId -> yyyy-MM-dd -> examId (assignMode 'daily') */
  dailyPlan?: Record<string, Record<string, string | string[]>>;
  mailTarget: 'personal' | 'login';
  templateId: string;
  includeExamSchedule: boolean;
  autoExam: boolean;
  /** 'exam' = use the test's own start time; 'custom' = start time set here (per student possible) */
  assignMode: 'same' | 'different' | 'daily';
  examStartMode: 'exam' | 'custom' | 'daily-time';
  dailyStartTime?: string;
  attachments?: MailAttachment[];
  defaultStart: string;                 // datetime-local (admin local time)
  perStudentStart: Record<string, string>;
  bufferMinutes: number;                // how long after start a student may still begin
  defaultExamId: string;
  perStudentExam: Record<string, string>;
  sentIds: string[];
  lastRunDate: string | null;
  lastRunInfo?: string;
}
export const DEFAULT_SCHEDULE: MailSchedule = {
  usePersonalLogin: false,
  enabled: false, frequency: 'daily', time: '09:00', tzOffsetMinutes: 330, dates: [], rangeFrom: null, rangeTo: null,
  recipients: 'all', studentIds: [], onceEver: false, dailyPlan: {}, mailTarget: 'personal', templateId: 'credentials', includeExamSchedule: true,
  autoExam: false, assignMode: 'same', examStartMode: 'exam', defaultStart: '', perStudentStart: {}, bufferMinutes: 10, defaultExamId: '', perStudentExam: {}, sentIds: [], lastRunDate: null,
};

export function homePathFor(s: CodexamSettings) {
  return s.homeLinkTarget === 'landing' ? '/' : '/exam-student';
}
export function canSeeCompleted(s: CodexamSettings, studentId?: string) {
  const o = studentId ? s.completedOverrides?.[studentId] : undefined;
  if (o === 'show') return true;
  if (o === 'hide') return false;
  return s.showCompletedTests !== false;
}

const LS = 'codexam_settings_cache';

export function cachedSettings(): CodexamSettings {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(LS) || '{}') }; } catch { return DEFAULT_SETTINGS; }
}

export async function fetchSettings(): Promise<CodexamSettings> {
  try {
    const { data } = await supabase.from('codexam_settings').select('value').eq('key', 'general').maybeSingle();
    const s = { ...DEFAULT_SETTINGS, ...(data?.value || {}) };
    try { localStorage.setItem(LS, JSON.stringify(s)); } catch {}
    return s;
  } catch { return cachedSettings(); }
}

export async function saveSettings(s: CodexamSettings) {
  try { localStorage.setItem(LS, JSON.stringify(s)); } catch {}
  const { error } = await supabase.from('codexam_settings').upsert({ key: 'general', value: s, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/** Per-student override: students.show_results = 'default' | 'show' | 'hide' */
export async function canStudentSeeResults(studentId: string): Promise<boolean> {
  const s = await fetchSettings();
  try {
    const { data } = await supabase.from('students').select('show_results').eq('id', studentId).maybeSingle();
    if (data?.show_results === 'show') return true;
    if (data?.show_results === 'hide') return false;
  } catch {}
  return s.resultsMode === 'show';
}

export function fillTemplate(t: string, vars: Record<string, string>) {
  return t.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');
}

/** Per-student test slots written when a test is auto-assigned: studentId -> examId -> slot */
export interface ExamSlot { start: string | null; buffer: number }
export const fetchSlots = () => fetchKey<Record<string, Record<string, ExamSlot>>>('student_exam_slots', {});
export interface ScheduleState { lastRunDate: string | null; lastRunInfo?: string; lastRunOk?: boolean; sentIds: string[] }
export const fetchScheduleState = () => fetchKey<ScheduleState>('mail_schedule_state', { lastRunDate: null, sentIds: [] });

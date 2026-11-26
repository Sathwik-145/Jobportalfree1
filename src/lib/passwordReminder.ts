// Shared by browser and server (no imports): admin password-rotation rules.
export const PASSWORD_REMINDER_EMAIL = 'jobportalfreeofficial@gmail.com';
export const PASSWORD_ROTATION_DAYS = 30;
const DAY = 86_400_000;

export interface PasswordMeta {
  changedAt?: number; // last admin password change (ms)
  lastReminderAt?: number; // last reminder email sent (ms)
  baselineAt?: number; // first time the scheduler saw this setting
  enabled?: boolean; // reminders on (default true)
}

/** Most recent of: password change, reminder sent, baseline. */
export function lastPasswordEvent(m: PasswordMeta): number {
  return Math.max(m.changedAt || 0, m.lastReminderAt || 0, m.baselineAt || 0);
}

/** True when a reminder email should go out now. */
export function reminderDue(m: PasswordMeta, now = Date.now()): boolean {
  if (m.enabled === false) return false;
  const last = lastPasswordEvent(m);
  return last > 0 && now - last >= PASSWORD_ROTATION_DAYS * DAY;
}

/** Days until the password should be changed again (negative = overdue). */
export function daysUntilRotation(m: PasswordMeta, now = Date.now()): number | null {
  const base = m.changedAt || m.baselineAt;
  if (!base) return null;
  return Math.ceil((base + PASSWORD_ROTATION_DAYS * DAY - now) / DAY);
}

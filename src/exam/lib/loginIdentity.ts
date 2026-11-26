export const PERSONAL_LOGIN_KEY = 'student_personal_logins';
export const PERSONAL_LOGIN_POLICY_KEY = 'personal_login_policy';
export type PersonalLoginPolicy = { everyone: boolean; students: Record<string, boolean> };
export const DEFAULT_PERSONAL_LOGIN_POLICY: PersonalLoginPolicy = { everyone: false, students: {} };
export function personalLoginEnabled(policy: PersonalLoginPolicy, studentId: string) {
  return policy.students?.[studentId] ?? policy.everyone === true;
}
export function uniquePersonalAddress(studentId: string, generated: string, personal: string | undefined, contacts: Record<string, string>, students: { id: string; email: string }[]) {
  const address = credentialEmail(generated, personal, true);
  if (students.some(s => s.id !== studentId && s.email.trim().toLowerCase() === address) || Object.entries(contacts).some(([id, email]) => id !== studentId && email.trim().toLowerCase() === address)) return undefined;
  return address;
}
export function credentialEmail(generated: string, personal: string | undefined, enabled: boolean) {
  if (!enabled) return generated;
  const email = (personal || generated).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /@student\.codexam\.com$/i.test(email)) throw new Error('Save a real personal email before enabling personal-email sign-in.');
  return email;
}
export function matchesLogin(canonical: string, alias: string | undefined, entered: string) {
  const normalized = entered.trim().toLowerCase();
  return canonical.trim().toLowerCase() === normalized || (!!alias && alias.toLowerCase() === normalized);
}
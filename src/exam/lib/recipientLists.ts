export type RecipientGroup = { id: string; name: string; members: string[] };
export const RECIPIENT_LIST_KEY = 'shared_mail_groups';
export const LEGACY_LIST_KEYS = ['portal_mail_groups', 'codexam_mail_groups', 'codexam_manual_mail_groups', 'exam_reminder_groups'];

export function parseRecipientEmails(value: string): string[] {
  const emails = [...new Set(value.split(/[\s,;]+/).map(x => x.trim().toLowerCase()).filter(Boolean))];
  if (emails.some(email => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) throw new Error('Check the email addresses before saving');
  return emails;
}

export function nameFromEmail(email: string): string {
  return email.split('@')[0].replace(/[._+\-\d]+/g, ' ').trim().split(/\s+/).filter(Boolean).map(word => word[0].toUpperCase() + word.slice(1)).join(' ') || 'Student';
}

export function emailForMember(member: string, students: { id: string; email: string }[], contacts: Record<string, string>): string {
  const student = students.find(s => s.id === member);
  return (student ? contacts[student.id] || student.email : member).trim().toLowerCase();
}

export function studentForEmail(email: string, students: { id: string; email: string }[], contacts: Record<string, string>) {
  const normalized = email.trim().toLowerCase();
  return students.find(s => s.email.toLowerCase() === normalized || contacts[s.id]?.toLowerCase() === normalized);
}

export function migrateRecipientLists(lists: RecipientGroup[][], students: { id: string; email: string }[], contacts: Record<string, string>): RecipientGroup[] {
  const result: RecipientGroup[] = [];
  for (const [source, groups] of lists.entries()) for (const group of Array.isArray(groups) ? groups : []) {
    const members = [...new Set((group.members || []).map(member => emailForMember(member, students, contacts)))];
    if (!result.some(g => g.name === group.name && g.members.join('|') === members.join('|'))) result.push({ ...group, id: `${source}_${group.id}`, members });
  }
  return result;
}
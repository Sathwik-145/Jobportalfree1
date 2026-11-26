// @ts-nocheck
// Registration link generator storage (local-first; config is also encoded in the URL
// so a link opens correctly on any device).

export type FieldType = 'text' | 'number' | 'email' | 'url' | 'textarea';
export interface LinkField { key: string; label: string; type: FieldType; required: boolean; }
export interface RegLink {
  id: string; title: string; description: string; fields: LinkField[];
  active: boolean; createdAt: string;
}
export interface LinkRegistration {
  id: string; linkId: string; linkTitle: string; name: string; email: string;
  answers: Record<string, string>; status: 'pending' | 'approved' | 'rejected';
  createdAt: string; studentId?: string; password?: string;
}

export const PRESET_FIELDS: LinkField[] = [
  { key: 'phone', label: 'Phone', type: 'text', required: false },
  { key: 'college', label: 'College', type: 'text', required: true },
  { key: 'branch', label: 'Branch', type: 'text', required: false },
  { key: 'year', label: 'Graduation Year', type: 'number', required: false },
  { key: 'cgpa', label: 'CGPA', type: 'number', required: true },
  { key: 'leetcode', label: 'LeetCode Score / Rating', type: 'number', required: false },
  { key: 'leetcode_url', label: 'LeetCode Profile URL', type: 'url', required: false },
  { key: 'codechef', label: 'CodeChef Rating', type: 'number', required: false },
  { key: 'github', label: 'GitHub URL', type: 'url', required: false },
  { key: 'linkedin', label: 'LinkedIn URL', type: 'url', required: false },
  { key: 'resume', label: 'Resume Link', type: 'url', required: false },
  { key: 'about', label: 'Why should we pick you?', type: 'textarea', required: false },
];

const LINKS_KEY = 'codexam_reg_links';
const REGS_KEY = 'codexam_link_regs';
const read = (k: string) => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } };
const write = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

import { supabase } from '@/lib/db-client';
import { notifyAdmin } from '@/lib/notifyAdmin';

export const listLinks = (): RegLink[] => read(LINKS_KEY);
export const saveLinks = (l: RegLink[]) => {
  write(LINKS_KEY, l);
  supabase.from('codexam_settings').upsert({ key: 'reg_links', value: l, updated_at: new Date().toISOString() }).then(() => {});
};
export async function syncLinks(): Promise<RegLink[]> {
  try {
    const { data } = await supabase.from('codexam_settings').select('value').eq('key', 'reg_links').maybeSingle();
    if (Array.isArray(data?.value)) { write(LINKS_KEY, data.value); return data.value; }
  } catch {}
  return listLinks();
}

const toRow = (r: LinkRegistration) => ({
  client_id: r.id, link_id: r.linkId, link_title: r.linkTitle, name: r.name, email: r.email,
  answers: r.answers || {}, status: r.status, created_at: r.createdAt,
  approved_student_id: r.studentId || null,
  notes: `Registration link: ${r.linkTitle}`,
});
const fromRow = (x: any): LinkRegistration => ({
  id: x.client_id, linkId: x.link_id, linkTitle: x.link_title, name: x.name, email: x.email,
  answers: x.answers || {}, status: x.status, createdAt: x.created_at,
  studentId: x.approved_student_id || undefined,
});

export const listLinkRegs = (): LinkRegistration[] => read(REGS_KEY);
export async function syncLinkRegs(): Promise<LinkRegistration[]> {
  try {
    const { data, error } = await supabase.from('registrations').select('*').not('link_id', 'is', null).order('created_at', { ascending: false });
    if (!error && data) { const r = data.map(fromRow); write(REGS_KEY, r); return r; }
  } catch {}
  return listLinkRegs();
}
export const saveLinkRegs = (r: LinkRegistration[]) => {
  const prev: LinkRegistration[] = read(REGS_KEY);
  write(REGS_KEY, r);
  const changed = r.filter(x => JSON.stringify(x) !== JSON.stringify(prev.find(p => p.id === x.id)));
  const removed = prev.filter(p => !r.some(x => x.id === p.id)).map(p => p.id);
  // New sign-ups are plain inserts (anyone may apply); edits to existing rows need a staff session.
  const added = changed.filter(x => !prev.some(p => p.id === x.id));
  const edited = changed.filter(x => prev.some(p => p.id === x.id));
  if (added.length) supabase.from('registrations').insert(added.map(toRow)).then(({ error }) => {
    if (error) console.warn(error.message);
    else added.forEach(x => notifyAdmin('link_registration', { eventId: x.id }));
  });
  if (edited.length) supabase.from('registrations').upsert(edited.map(toRow), { onConflict: 'client_id' }).then(({ error }) => {
    if (error) console.warn(error.message);
  });
  if (removed.length) supabase.from('registrations').delete().in('client_id', removed).then(() => {});
};

export const encodeLink = (l: RegLink) =>
  btoa(unescape(encodeURIComponent(JSON.stringify({ i: l.id, t: l.title, d: l.description, f: l.fields, a: l.active }))));
export const decodeLink = (s: string): RegLink | null => {
  try {
    const o = JSON.parse(decodeURIComponent(escape(atob(s))));
    return { id: o.i, title: o.t, description: o.d, fields: o.f || [], active: o.a !== false, createdAt: '' };
  } catch { return null; }
};
export const linkUrl = (l: RegLink) =>
  `${window.location.origin}/exam-apply/${l.id}?c=${encodeURIComponent(encodeLink(l))}`;
export const EXAM_LOGIN_PATH = '/exam-login';

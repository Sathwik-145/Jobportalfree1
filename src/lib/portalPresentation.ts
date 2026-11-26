import { useEffect, useState } from 'react';
import { fetchKey, saveKey } from '@/exam/lib/codexamSettings';
export type Branding = { title: string; icon: string; name?: string };
export type ContactLink = { name: string; handle: string; url: string };
export type Contacts = { email: string; phones: string[]; links: ContactLink[] };
export const defaultContacts: Contacts = {
  email: 'jobportalfreeofficial@gmail.com', phones: [], links: [
    { name: 'YouTube', handle: 'Watch tutorials & career tips', url: 'https://www.youtube.com/channel/UCT8mtDPbG6Cm_oE1JWSgEKA' },
    { name: 'Instagram', handle: '@jobportalfree', url: 'https://www.instagram.com/jobportalfree/?hl=en' },
  ],
};
export const defaultBranding = (exam: boolean): Branding => ({ name: exam ? 'CodeXam' : 'JobPortalFree', title: exam ? 'CodeXam Portal | JobPortalFree' : 'JobPortalFree - Find Your Dream Job Today | Free Job Portal for Students', icon: '/favicon.png' });
export function useExamName() { return usePresentation('exam_branding', defaultBranding(true)).name?.trim() || 'CodeXam'; }
export function safeLink(url: string) { return /^(https?:\/\/|mailto:|tel:)/i.test(url) ? url : ''; }
export function usePresentation<T>(key: string, fallback: T) {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    let alive = true;
    const load = () => fetchKey(key, fallback).then(v => { if (alive) setValue(v); });
    const changed = (e: Event) => { const d = (e as CustomEvent).detail; if (d?.key === key) setValue(d.value); };
    load(); window.addEventListener('portal-presentation', changed);
    return () => { alive = false; window.removeEventListener('portal-presentation', changed); };
  }, [key]);
  return value;
}
export async function savePresentation<T>(key: string, value: T) {
  await saveKey(key, value);
  window.dispatchEvent(new CustomEvent('portal-presentation', { detail: { key, value } }));
}

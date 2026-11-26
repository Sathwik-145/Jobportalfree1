import { useEffect, useState } from 'react';
import { writePassword } from '@/exam/lib/credentialStore';
import { Users, Save, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchKey, saveKey, fetchContacts } from '@/exam/lib/codexamSettings';
import { supabase } from '@/lib/db-client';
import { RECIPIENT_LIST_KEY, LEGACY_LIST_KEYS, parseRecipientEmails, nameFromEmail, emailForMember, studentForEmail, migrateRecipientLists, type RecipientGroup } from '@/exam/lib/recipientLists';
import { toast } from 'sonner';

export type { RecipientGroup } from '@/exam/lib/recipientLists';

/**
 * Saved recipient lists. `members` are student ids (CodeXam) or email addresses (main admin panel).
 * Load a list, change the people in it, then "Update list" to save the edit.
 */
export default function RecipientGroups({ storageKey, current, onApply, unit = 'people' }: {
  storageKey: string; current: string[]; onApply: (members: string[]) => void; unit?: string;
}) {
  const [groups, setGroups] = useState<RecipientGroup[]>([]);
  const [activeId, setActiveId] = useState('');
  const [students, setStudents] = useState<{ id: string; name: string; email: string }[]>([]);
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const usesIds = unit === 'students' || storageKey !== 'portal_mail_groups';
  useEffect(() => {
    const load = async () => {
      const [{ data }, contactMap] = await Promise.all([supabase.from('students').select('id,name,email'), fetchContacts()]);
      const rows = (data || []).map(r => ({ ...r, name: r.name ?? '' })); setStudents(rows); setContacts(contactMap);
      const shared = await fetchKey<RecipientGroup[] | null>(RECIPIENT_LIST_KEY, null);
      if (shared) { setGroups(shared); return; }
      const legacy = await Promise.all(LEGACY_LIST_KEYS.map(key => fetchKey<RecipientGroup[]>(key, [])));
      const merged = migrateRecipientLists(legacy, rows, contactMap);
      if (merged.length) await saveKey(RECIPIENT_LIST_KEY, merged);
      setGroups(merged);
    };
    void load().catch(() => toast.error('Could not load saved lists'));
    window.addEventListener('recipient-lists-changed', load); window.addEventListener('focus', load);
    return () => { window.removeEventListener('recipient-lists-changed', load); window.removeEventListener('focus', load); };
  }, [storageKey]);
  const active = groups.find(g => g.id === activeId);

  const persist = async (next: RecipientGroup[], msg: string) => {
    try { await saveKey(RECIPIENT_LIST_KEY, next); setGroups(next); window.dispatchEvent(new Event('recipient-lists-changed')); toast.success(msg); }
    catch (e: any) { toast.error(e?.message || 'Could not save the list'); }
  };
  const saveNew = () => {
    if (!current.length) return toast.error(`Pick some ${unit} first`);
    const name = window.prompt('Name for this list', '')?.trim();
    if (!name) return;
    const g = { id: crypto.randomUUID(), name: name.slice(0, 60), members: Array.from(new Set(current.map(member => emailForMember(member, students, contacts)))) };
    setActiveId(g.id);
    void persist([...groups, g], `Saved “${g.name}” (${g.members.length})`);
  };
  const update = () => {
    if (!active) return;
    void persist(groups.map(g => g.id === active.id ? { ...g, members: Array.from(new Set(current.map(member => emailForMember(member, students, contacts)))) } : g), `Updated “${active.name}” (${current.length})`);
  };
  const remove = () => {
    if (!active || !window.confirm(`Delete the list “${active.name}”?`)) return;
    setActiveId('');
    void persist(groups.filter(g => g.id !== active.id), 'List deleted');
  };
  const apply = async (members: string[]) => {
    if (!usesIds) { onApply(members); return; }
    setBusy(true);
    try {
      const emails = parseRecipientEmails(members.join(','));
      const missing = emails.filter(email => !studentForEmail(email, students, contacts));
      const { data: profiles } = missing.length ? await supabase.from('profiles').select('full_name,email').in('email', missing) : { data: [] };
      const added = missing.map(email => ({ id: crypto.randomUUID(), name: profiles?.find(p => p.email?.toLowerCase() === email)?.full_name || nameFromEmail(email), email, is_blocked: false, tab_switch_count: 0, max_tab_switches: 3, exam_status: 'not_started', assigned_questions: [], retake_exam_ids: [] }));
      if (added.length) {
        const { error } = await supabase.from('students').insert(added);
        if (error) throw error;
        for (const st of added) {
          const credError = await writePassword(supabase, st.id, crypto.randomUUID().replace(/-/g, '').slice(0, 16));
          if (credError) throw new Error(credError);
        }
        window.dispatchEvent(new Event('exam-students-changed'));
      }
      const all = [...students, ...added]; setStudents(all);
      const ids = emails.map(email => studentForEmail(email, all, contacts)?.id).filter((id): id is string => !!id);
      onApply(ids);
      if (added.length) toast.success(`${added.length} exam students created`);
    } catch (e: any) { toast.error(e.message || 'Could not add students'); }
    finally { setBusy(false); }
  };
  const pick = (id: string) => { setActiveId(id); const g = groups.find(x => x.id === id); if (g) void apply(g.members); };
  const createFromEmails = async () => {
    try {
      const members = parseRecipientEmails(input);
      if (!members.length) return toast.error('Enter at least one email');
      const name = window.prompt('Name for this list', '')?.trim(); if (!name) return;
      const group = { id: crypto.randomUUID(), name: name.slice(0, 60), members };
      await apply(members); await persist([...groups, group], `Saved “${group.name}”`);
      setActiveId(group.id); setImporting(false); setInput('');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/30 p-2" aria-busy={busy}>
      <Users className="w-4 h-4 text-primary shrink-0" />
      <select disabled={busy} aria-label="Saved recipient lists" value={activeId} onChange={e => pick(e.target.value)} className="h-8 min-w-0 flex-1 sm:flex-none sm:w-48 rounded-lg border bg-background px-2 text-xs">
        <option value="">{groups.length ? 'Load a saved list…' : 'No saved lists yet'}</option>
        {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.members.length})</option>)}
      </select>
      <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={saveNew}><Save className="w-3.5 h-3.5" /> Save as list</Button>
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setImporting(!importing)}><Users className="w-3.5 h-3.5" /> Create list from emails</Button>
      {importing && <div className="w-full space-y-2"><textarea aria-label="Recipient email addresses" rows={3} className="w-full rounded-md border bg-background p-2 text-sm" placeholder="one@example.com, two@example.com" value={input} onChange={e => setInput(e.target.value)} /><Button type="button" disabled={busy} onClick={createFromEmails}>{busy ? 'Adding students…' : usesIds ? 'Create students and save list' : 'Save email list'}</Button></div>}
      {active && <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={update}><RefreshCw className="w-3.5 h-3.5" /> Update list</Button>}
      {active && <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Delete list" onClick={remove}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>}
    </div>
  );
}

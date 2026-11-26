import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { fetchKey, saveKey } from '@/exam/lib/codexamSettings';
import { DEFAULT_PERSONAL_LOGIN_POLICY, PERSONAL_LOGIN_POLICY_KEY, personalLoginEnabled, type PersonalLoginPolicy } from '@/exam/lib/loginIdentity';
import { toast } from 'sonner';

export default function PersonalLoginSettings({ students }: { students: { id: string; name: string; email: string }[] }) {
  const [policy, setPolicy] = useState<PersonalLoginPolicy>(DEFAULT_PERSONAL_LOGIN_POLICY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  useEffect(() => { fetchKey(PERSONAL_LOGIN_POLICY_KEY, DEFAULT_PERSONAL_LOGIN_POLICY).then(value => { setPolicy({ ...DEFAULT_PERSONAL_LOGIN_POLICY, ...value }); setLoaded(true); }); }, []);
  async function save() {
    setSaving(true);
    try { await saveKey(PERSONAL_LOGIN_POLICY_KEY, policy); toast.success('Personal-email sign-in settings saved'); }
    catch { toast.error('Could not save sign-in settings'); }
    finally { setSaving(false); }
  }
  return <section className="mb-6 border-y py-5 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">Personal-email sign-in</h2>
      <Button onClick={save} disabled={!loaded || saving}>{saving ? 'Saving…' : 'Save sign-in settings'}</Button>
    </div>
    <label className="flex items-center justify-between gap-3 text-sm font-medium">
      Allow personal-email sign-in for everyone
      <Switch aria-label="Allow personal-email sign-in for everyone" disabled={!loaded} checked={policy.everyone} onCheckedChange={everyone => setPolicy(p => ({ ...p, everyone }))} />
    </label>
    <input aria-label="Find student sign-in settings" placeholder="Find a student" value={query} onChange={e => setQuery(e.target.value)} className="h-10 w-full max-w-md rounded-md border bg-background px-3 text-sm" />
    <div className="max-h-64 overflow-y-auto divide-y">
      {students.filter(s => `${s.name} ${s.email}`.toLowerCase().includes(query.toLowerCase())).map(s => <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <span className="min-w-0 break-words text-sm">{s.name}</span>
        <div className="flex items-center gap-3">
          <select aria-label={`Personal-email sign-in for ${s.name}`} className="h-9 rounded-md border bg-background px-2 text-sm" value={policy.students[s.id] === undefined ? 'default' : policy.students[s.id] ? 'on' : 'off'} onChange={e => setPolicy(p => { const overrides = { ...p.students }; if (e.target.value === 'default') delete overrides[s.id]; else overrides[s.id] = e.target.value === 'on'; return { ...p, students: overrides }; })}>
            <option value="default">Everyone setting</option><option value="on">Allow</option><option value="off">Do not allow</option>
          </select>
          <span className="w-16 text-xs text-muted-foreground">{personalLoginEnabled(policy, s.id) ? 'Allowed' : 'Disabled'}</span>
        </div>
      </div>)}
    </div>
  </section>;
}
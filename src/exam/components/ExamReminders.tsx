// @ts-nocheck
import { useEffect, useState } from 'react';
import { fetchKey, saveKey } from '@/exam/lib/codexamSettings';
import MailTemplateEditor from '@/exam/components/MailTemplateEditor';
import RecipientGroups from '@/exam/components/RecipientGroups';
import { Button } from '@/components/ui/button';
import { BellRing, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT = {
  enabled: true, offsets: [10], every5: false, mailTarget: 'personal', recipients: 'all', studentIds: [], groupIds: [],
  senderName: 'CodeXam', subject: '{{examTitle}} closes in {{minutesLeft}} minutes',
  body: 'Hi {{name}},\n\n**Your exam {{examTitle}} will close in {{minutesLeft}} minutes** (at {{deadline}}).\n\n[highlight=info]Please start your exam now so you do not miss it.[/highlight]\n\nAll the best!',
};
const OFFSETS = [5, 10, 20, 30];

export default function ExamReminders({ students }) {
  const [cfg, setCfg] = useState(DEFAULT);
  const [saved, setSaved] = useState([]);
  const [tplName, setTplName] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [groups, setGroups] = useState([]);
  useEffect(() => { fetchKey('exam_reminder_groups', []).then(g => setGroups(Array.isArray(g) ? g : [])); }, [cfg.recipients]);
  useEffect(() => {
    Promise.all([fetchKey('exam_reminders', DEFAULT), fetchKey('exam_reminder_templates', [])]).then(([c, t]) => { setCfg({ ...DEFAULT, ...c }); setSaved(Array.isArray(t) ? t : []); setLoaded(true); });
  }, []);
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => saveKey('exam_reminders', { ...cfg, tzOffsetMinutes: -new Date().getTimezoneOffset() }).catch(() => toast.error('Could not save reminders')), 600);
    return () => clearTimeout(t);
  }, [cfg, loaded]);
  const toggleOff = (n) => setCfg({ ...cfg, offsets: cfg.offsets.includes(n) ? cfg.offsets.filter(x => x !== n) : [...cfg.offsets, n].sort((a, b) => b - a) });
  const saveTpl = async () => {
    const name = tplName.trim() || `Reminder ${saved.length + 1}`;
    const next = [...saved.filter(t => t.name !== name), { name, subject: cfg.subject, body: cfg.body, senderName: cfg.senderName }];
    setSaved(next); await saveKey('exam_reminder_templates', next); setTplName(''); toast.success('Template saved');
  };
  const delTpl = async (name) => { const next = saved.filter(t => t.name !== name); setSaved(next); await saveKey('exam_reminder_templates', next); };
  const studentToggle = (id) => setCfg({ ...cfg, studentIds: cfg.studentIds.includes(id) ? cfg.studentIds.filter(x => x !== id) : [...cfg.studentIds, id] });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2"><BellRing className="w-4 h-4 text-primary" /> Exam ending reminders</h2>
          <p className="text-xs text-muted-foreground">Emails students who haven't submitted before their start window closes (start time + buffer). Changes save automatically.</p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="w-5 h-5 accent-primary" checked={cfg.enabled} onChange={e => setCfg({ ...cfg, enabled: e.target.checked })} /> {cfg.enabled ? 'ON' : 'OFF'}</label>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Send before the window closes</p>
        <div className="flex flex-wrap gap-2">
          {OFFSETS.map(n => <button key={n} type="button" onClick={() => toggleOff(n)} className={`h-9 px-4 rounded-full border text-sm ${cfg.offsets.includes(n) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}>{n} min</button>)}
          <button type="button" onClick={() => setCfg({ ...cfg, every5: !cfg.every5 })} className={`h-9 px-4 rounded-full border text-sm ${cfg.every5 ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}>Every 5 min</button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm">Sender name<input value={cfg.senderName} onChange={e => setCfg({ ...cfg, senderName: e.target.value.slice(0, 60) })} className="mt-1 w-full h-10 px-3 rounded-lg border bg-background" /></label>
        <label className="text-sm">Send to<select value={cfg.mailTarget} onChange={e => setCfg({ ...cfg, mailTarget: e.target.value })} className="mt-1 w-full h-10 px-2 rounded-lg border bg-background"><option value="personal">Personal email</option><option value="login">Login email</option></select></label>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Students</p>
        <div className="flex flex-wrap gap-4 text-sm mb-2">
          <label className="flex items-center gap-2"><input type="radio" checked={cfg.recipients === 'all'} onChange={() => setCfg({ ...cfg, recipients: 'all' })} /> Everyone with a test</label>
          <label className="flex items-center gap-2"><input type="radio" checked={cfg.recipients === 'selected'} onChange={() => setCfg({ ...cfg, recipients: 'selected' })} /> Selected</label>
          <label className="flex items-center gap-2"><input type="radio" checked={cfg.recipients === 'group'} onChange={() => setCfg({ ...cfg, recipients: 'group' })} /> Saved groups</label>
        </div>
        {cfg.recipients === 'group' && (groups.length ? <div className="flex flex-wrap gap-2">
          {groups.map(g => { const on = (cfg.groupIds || []).includes(g.id); return <button key={g.id} type="button" onClick={() => setCfg({ ...cfg, groupIds: on ? cfg.groupIds.filter(x => x !== g.id) : [...(cfg.groupIds || []), g.id] })} className={`h-9 px-4 rounded-full border text-sm ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}>{g.name} · {g.members?.length || 0}</button>; })}
        </div> : <p className="text-xs text-muted-foreground">No saved groups yet. Choose "Selected", tick students and save them as a list.</p>)}
        {cfg.recipients === 'selected' && <>
          <RecipientGroups storageKey="exam_reminder_groups" current={cfg.studentIds} onApply={ids => setCfg({ ...cfg, studentIds: ids })} unit="students" />
          <div className="mt-2 max-h-48 overflow-auto border rounded-xl p-2 grid sm:grid-cols-2 gap-1">
            {students.map(st => <label key={st.id} className="flex items-center gap-2 text-sm p-1"><input type="checkbox" checked={cfg.studentIds.includes(st.id)} onChange={() => studentToggle(st.id)} /> {st.name}</label>)}
          </div>
        </>}
      </div>
      <div>
        <div className="flex flex-wrap gap-2 mb-2">
          {saved.map(t => <span key={t.name} className="inline-flex items-center rounded-full border text-sm overflow-hidden"><button type="button" className="px-3 h-8" onClick={() => setCfg({ ...cfg, subject: t.subject, body: t.body, senderName: t.senderName || cfg.senderName })}>{t.name}</button><button type="button" aria-label="Delete template" className="px-2 h-8 text-destructive" onClick={() => delTpl(t.name)}><Trash2 className="w-3 h-3" /></button></span>)}
        </div>
        <input value={cfg.subject} onChange={e => setCfg({ ...cfg, subject: e.target.value })} placeholder="Subject" className="w-full h-10 px-3 rounded-lg border bg-background text-sm mb-3" />
        <MailTemplateEditor body={cfg.body} onChange={body => setCfg(c => ({ ...c, body }))} subject={cfg.subject} onSubjectChange={subject => setCfg(c => ({ ...c, subject }))} purpose="exam reminder" variables="{{name}} {{examTitle}} {{minutesLeft}} {{deadline}}" />
        <p className="text-xs text-muted-foreground mt-2">Placeholders: {'{{name}} {{examTitle}} {{minutesLeft}} {{deadline}}'}</p>
        <div className="flex gap-2 mt-3">
          <input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="Template name" className="flex-1 min-w-0 h-10 px-3 rounded-lg border bg-background text-sm" />
          <Button variant="outline" onClick={saveTpl}><Save className="w-4 h-4" /> Save template</Button>
        </div>
      </div>
    </div>
  );
}

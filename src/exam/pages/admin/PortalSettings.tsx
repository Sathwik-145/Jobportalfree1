// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from '@/lib/router-compat';
import AdminLayout from '@/exam/components/AdminLayout';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { supabase } from '@/lib/db-client';
import { fetchSettings, saveSettings, fillTemplate, DEFAULT_SETTINGS, fetchKey, saveKey, fetchContacts, setContact, DEFAULT_MAILER, DEFAULT_SCHEDULE, DEFAULT_TEMPLATES, TEMPLATE_VARS, fetchScheduleState } from '@/exam/lib/codexamSettings';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { Settings2, Send, Eye, Save, Mail, Plus, Trash2, BarChart3, X, CheckCircle2, XCircle, SlidersHorizontal, AtSign, CalendarClock, BellRing, Hourglass, FileText, Palette, Camera, UserPlus } from 'lucide-react';
import LogoSpinner from '@/components/LogoSpinner';
import DailyPlanner from '@/exam/components/DailyPlanner';
import MailTemplateEditor, { MailPreview, AiTemplateButton } from '@/exam/components/MailTemplateEditor';
import { scheduledExamVars } from '@/exam/lib/mailContent';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import RecipientGroups from '@/exam/components/RecipientGroups';
import SlotExtensions from '@/exam/components/SlotExtensions';
import ExamReminders from '@/exam/components/ExamReminders';
import PresentationSettings from '@/components/PresentationSettings';
import MailAttachments from '@/exam/components/MailAttachments';
import { mailRequestHeaders } from '@/exam/lib/mailRequest';
import { ADMIN_EVENTS } from '@/lib/admin-events';
import { Switch } from '@/components/ui/switch';
import RandomMcqAllot from '@/exam/components/RandomMcqAllot';
import SystemTemplatesEditor from '@/exam/components/SystemTemplatesEditor';
import ResultTemplateEditor from '@/exam/components/ResultTemplateEditor';
import ProctoringSwitches from '@/exam/components/ProctoringSwitches';
import { plannedExamIds } from '@/exam/lib/examAvailability';

const card = 'bg-card border border-border rounded-3xl p-5 sm:p-7 shadow-sm scroll-mt-28';
const SECTIONS = [
  ['general','General','Results, support & home',SlidersHorizontal,'Portal'],
  ['branding','Branding','Browser title & icon',Palette,'Portal'],
  ['monitoring','Monitoring','Camera, mic & screen',Camera,'Portal'],
  ['signups','Sign-ups','Turn accounts into students',UserPlus,'Students'],
  ['windows','Instant access','Grant access & extend windows',Hourglass,'Students'],
  ['sender','Sender','From name & address',AtSign,'Email'],
  ['templates','Templates','Saved email designs',FileText,'Email'],
  ['send','Send mails','Credentials & results',Send,'Email'],
  ['schedules','Schedules','Automatic credential mails',CalendarClock,'Email'],
  ['reminders','Reminders','Closing-soon emails',BellRing,'Email'],
];
const SECTION_GROUPS = ['Portal', 'Students', 'Email'];

export default function PortalSettings() {
  const { students, setStudents, exams } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = SECTIONS.some(([id]) => id === searchParams.get('tab')) ? searchParams.get('tab') : 'general';
  const selectTab = (tab) => setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('tab', tab); return next; }, { replace: true });
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [mailer, setMailer] = useState(DEFAULT_MAILER);
  const [scheduleId, setScheduleId] = useState('main');
  const [scheduleMap, setScheduleMap] = useState({ main: { ...DEFAULT_SCHEDULE, scheduleName: 'Schedule 1' } });
  const sch = scheduleMap[scheduleId] || DEFAULT_SCHEDULE;
  const setSch = value => setScheduleMap(prev => ({ ...prev, [scheduleId]: typeof value === 'function' ? value(prev[scheduleId]) : value }));
  const stateKey = scheduleId === 'main' ? 'mail_schedule_state' : `mail_schedule_state_${scheduleId}`;
  const [attachments, setAttachments] = useState([]);
  const persistSchedules = async () => {
    const offset = -new Date().getTimezoneOffset();
    await saveKey('mail_schedule', { ...scheduleMap.main, tzOffsetMinutes: offset });
    await saveKey('mail_schedules_more', Object.entries(scheduleMap).filter(([id]) => id !== 'main').map(([id, value]) => ({ ...value, id, tzOffsetMinutes: offset })));
  };
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'personal' | 'portal'>('all');
  const [templateId, setTemplateId] = useState('credentials');
  const [editTplId, setEditTplId] = useState('credentials');
  const [sendExamId, setSendExamId] = useState('');
  const [assignExam, setAssignExam] = useState(false);
  const [schQuery, setSchQuery] = useState('');
  const [showLog, setShowLog] = useState(false);
  const [mailLog, setMailLog] = useState<any[]>([]);
  const [schLoaded, setSchLoaded] = useState(false);
  const [schState, setSchState] = useState({ lastRunDate: null, sentIds: [] });
  const [sendStart, setSendStart] = useState('');
  const [sendStartMode, setSendStartMode] = useState('custom');
  const [includeExamSchedule, setIncludeExamSchedule] = useState(true);
  const [editSendTemplate, setEditSendTemplate] = useState(false);
  const [sendBuffer, setSendBuffer] = useState(10);
  const [requireVerify, setRequireVerify] = useState(false);
  const [signups, setSignups] = useState<any[]>([]);
  const [s, setS] = useState(DEFAULT_SETTINGS);
  const [notifyPrefs, setNotifyPrefs] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [previewId, setPreviewId] = useState('');
  const [approved, setApproved] = useState(false);
  const [sending, setSending] = useState(false);
  const loginUrl = `${window.location.origin}/exam-login`;

  useEffect(() => {
    fetchSettings().then(v => { setS(v); setLoaded(true); });
    fetchKey('admin_notify', {}).then(setNotifyPrefs);
    fetchContacts().then(setContacts);
    fetchScheduleState().then(setSchState);
    fetchKey('mailer', DEFAULT_MAILER).then(m => setMailer({ ...DEFAULT_MAILER, ...m }));
    Promise.all([fetchKey('mail_schedule', DEFAULT_SCHEDULE), fetchKey('mail_schedules_more', [])]).then(([main, more]) => { setScheduleMap({ main: { ...DEFAULT_SCHEDULE, scheduleName: 'Schedule 1', ...main }, ...Object.fromEntries((Array.isArray(more) ? more : []).filter(x => x.id).map(x => [x.id, { ...DEFAULT_SCHEDULE, ...x }])) }); setSchLoaded(true); });
    supabase.from('site_settings').select('value').eq('key', 'auth').maybeSingle().then(({ data }) => setRequireVerify(!!data?.value?.requireEmailVerification));
    supabase.from('profiles').select('user_id,full_name,email,email_verified,created_at').order('created_at', { ascending: false }).then(({ data }) => setSignups(data || []));
    supabase.from('students').select('id,show_results').then(({ data }) => {
      const m = {}; (data || []).forEach(r => { m[r.id] = r.show_results || 'default'; }); setOverrides(m);
    });
  }, []);

  useEffect(() => { fetchKey(stateKey, { sentIds: [] }).then(setSchState); }, [stateKey]);

  const [logFilter, setLogFilter] = useState('all');

  const isGenerated = st => /@student\.codexam\.com$/i.test(st.email || '');
  const hasPersonal = st => !!contacts[st.id] || !isGenerated(st);
  const list = useMemo(() => students.filter(st =>
    `${st.name} ${st.email} ${contacts[st.id] || ''}`.toLowerCase().includes(query.toLowerCase()) &&
    (filter === 'all' || (filter === 'personal' ? hasPersonal(st) : isGenerated(st) && !contacts[st.id]))
  ), [students, query, filter, contacts]);
  const savedTemplates = s.templates?.length ? s.templates : DEFAULT_TEMPLATES;
  const templates = useMemo(() => savedTemplates.some(t => t.id === 'general-notice') ? savedTemplates : [...savedTemplates, DEFAULT_TEMPLATES.find(t => t.id === 'general-notice')], [savedTemplates]);
  // Keep the auto-send template copy in sync so the scheduler sends exactly the chosen template
  useEffect(() => {
    if (!schLoaded || !loaded) return;
    const t = templates.find(x => x.id === (sch.templateId || 'credentials'));
    if (t && (sch.templateSubject !== t.subject || sch.templateBody !== t.body || sch.templateName !== t.name))
      setSch(v => ({ ...v, templateName: t.name, templateSubject: t.subject, templateBody: t.body }));
  }, [schLoaded, loaded, templates, sch.templateId]);
  const activeTpl = templates.find(t => t.id === templateId) || templates[0];
  const editTpl = templates.find(t => t.id === editTplId) || templates[0];
  const updateTpl = (id, patch) => { setApproved(false); setS(prev => { const list = prev.templates?.length ? prev.templates : templates; return { ...prev, templates: list.map(t => t.id === id ? { ...t, ...patch } : t) }; }); };
  const addTpl = () => { const id = `t_${Date.now()}`; setS({ ...s, templates: [...templates, { id, name: 'New template', subject: 'Subject', body: 'Hi {{name}},\n\n' }] }); setEditTplId(id); };
  const delTpl = id => { if (templates.length <= 1) return; setS({ ...s, templates: templates.filter(t => t.id !== id) }); setEditTplId(templates[0].id); };
  const saveTemplates = async () => { try { await saveSettings(s); toast.success('Templates saved — you can use them everywhere now'); } catch (e) { toast.error(e.message || 'Could not save'); } };
  const addAiTpl = (tpl) => { const id = `t_${Date.now()}`; setS({ ...s, templates: [...templates, { id, ...tpl }] }); setEditTplId(id); };
  const examVarsFor = (examId) => {
    const e = exams.find(x => x.id === examId);
    const start = includeExamSchedule ? (sendStartMode === 'custom' ? sendStart : e?.scheduledAt) : null;
    return { examTitle: e?.title || 'CodeXam', ...scheduledExamVars(start, -new Date().getTimezoneOffset(), Number(sendBuffer) || e?.startBufferMinutes || e?.examDurationMinutes || 0), examDuration: e?.examDurationMinutes ? `${e.examDurationMinutes} minutes` : 'as mentioned in the exam' };
  };
  const autoPreviewStudent = students.find(st => sch.studentIds?.includes(st.id)) || students[0];
  const autoPreviewTpl = templates.find(t => t.id === sch.templateId) || templates[0];
  const autoPreviewVars = useMemo(() => {
    const st = autoPreviewStudent;
    const today = format(new Date(), 'yyyy-MM-dd');
    const plannedIds = plannedExamIds(sch, st?.id || '', today);
    const examId = plannedIds[0];
    const e = exams.find(x => x.id === examId);
    const raw = (sch.assignMode === 'different' && sch.perStudentStart?.[st?.id]) || sch.defaultStart;
    const dailyStart = `${today}T${raw?.includes('T') ? raw.split('T')[1] : sch.time}`;
    const start = sch.includeExamSchedule === false ? null : sch.examStartMode === 'daily-time' && sch.dailyStartTime ? `${today}T${sch.dailyStartTime}` : sch.examStartMode === 'custom' ? (sch.assignMode === 'daily' && raw ? `${today}T${raw.split('T')[1] || raw}` : raw) : e?.scheduledAt;
    const win = Number(sch.bufferMinutes ?? 10);
    return { name: st?.name || 'Student', email: sch.usePersonalLogin ? contacts[st?.id] || st?.email || '' : st?.email || '', password: st?.password || '', loginUrl, examTitle: plannedIds.map(id => exams.find(ex => ex.id === id)?.title).filter(Boolean).join(', ') || 'No test planned', examDuration: e?.examDurationMinutes ? `${e.examDurationMinutes} minutes` : 'as mentioned in the exam', ...scheduledExamVars(start, -new Date().getTimezoneOffset(), win > 0 ? win : (e?.startBufferMinutes || 0) + (e?.examDurationMinutes || 0)) };
  }, [autoPreviewStudent, sch.usePersonalLogin, contacts, sch.assignMode, sch.dailyPlan, sch.perStudentExam, sch.perStudentStart, sch.defaultStart, sch.defaultExamId, sch.time, sch.includeExamSchedule, sch.examStartMode, sch.dailyStartTime, sch.bufferMinutes, exams, loginUrl]);
  const schList = students.filter(st => `${st.name} ${st.email} ${contacts[st.id] || ''}`.toLowerCase().includes(schQuery.toLowerCase()));
  // Upcoming dates the automatic mail will go out on (admin's local time)
  const nowD = new Date();
  const todayStr = format(nowD, 'yyyy-MM-dd');
  const nowHM = format(nowD, 'HH:mm');
  const tomorrowStr = format(new Date(nowD.getTime() + 86400000), 'yyyy-MM-dd');
  const schSendDates = useMemo(() => {
    if (!sch.enabled) return [] as string[];
    if (sch.frequency === 'daily') return Array.from({ length: 7 }, (_, i) => format(new Date(nowD.getTime() + i * 86400000), 'yyyy-MM-dd'));
    if (sch.frequency === 'dates') return [...(sch.dates || [])].sort();
    if (sch.frequency === 'range' && sch.rangeFrom) {
      const out: string[] = [];
      const from = parseISO(sch.rangeFrom);
      const to = sch.rangeTo ? parseISO(sch.rangeTo) : from;
      for (let d = from; d <= to; d = new Date(d.getTime() + 86400000)) { out.push(format(d, 'yyyy-MM-dd')); if (out.length >= 60) break; }
      return out;
    }
    return [];
  }, [sch.enabled, sch.frequency, sch.time, sch.dates, sch.rangeFrom, sch.rangeTo]);
  const rangeExtra = sch.enabled && sch.frequency === 'range' && sch.rangeFrom
    ? Math.max(0, Math.round((parseISO(sch.rangeTo || sch.rangeFrom).getTime() - parseISO(sch.rangeFrom).getTime()) / 86400000) + 1 - schSendDates.length)
    : 0;
  const dayLabelFor = d => d === todayStr ? 'Today' : d === tomorrowStr ? 'Tomorrow' : new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const openLog = async () => { setShowLog(true); fetchKey(stateKey, { sentIds: [] }).then(setSchState); setMailLog(await fetchKey('mail_log', [])); };

  // Auto-save the schedule so turning it ON works without pressing Save
  useEffect(() => {
    if (!schLoaded) return;
    const t = setTimeout(() => { persistSchedules().catch(e => toast.error(e.message || 'Schedule could not be saved')); }, 500);
    return () => clearTimeout(t);
  }, [scheduleMap, schLoaded]);
  const preview = students.find(x => x.id === previewId) || students.find(x => selected.has(x.id));
  const sendTo = st => (s.mailTarget === 'personal' ? contacts[st.id] || st.email : st.email);

  const saveVerify = async (v) => {
    setRequireVerify(v);
    const { error } = await supabase.from('site_settings').upsert({ key: 'auth', value: { requireEmailVerification: v }, updated_at: new Date().toISOString() });
    if (error) toast.error('Sign in to the main admin panel as admin to change this'); else toast.success(v ? 'Email verification ON for new sign-ups' : 'Email verification OFF — students log in directly');
  };
  const addAsStudent = (p) => {
    if (students.some(x => (x.email || '').toLowerCase() === (p.email || '').toLowerCase())) { toast.info('Already an exam student'); return; }
    const st = { id: `s_${Date.now()}`, name: p.full_name || p.email, email: p.email, password: Math.random().toString(36).slice(-8), isBlocked: false, tabSwitchCount: 0, maxTabSwitches: 3, examStatus: 'not_started', assignedQuestions: [], submissions: [], retakeExamIds: [] };
    setStudents(prev => [...prev, st]);
    if (p.email) setContact(st.id, p.email).then(setContacts).catch(() => {});
    toast.success(`${p.email} added — now select and send credentials below`);
  };
  const save = async () => {
    try {
      await saveSettings(s);
      await saveKey('admin_notify', notifyPrefs);
      await saveKey('mailer', mailer);
      await persistSchedules();
      toast.success('Settings saved');
    } catch (e) { toast.error(e.message || 'Could not save'); }
  };
  const setOverride = async (id, v) => {
    setOverrides(o => ({ ...o, [id]: v }));
    const { error } = await supabase.from('students').update({ show_results: v }).eq('id', id);
    if (error) toast.error(error.message);
  };
  const saveContact = async (id, email) => {
    try { setContacts(await setContact(id, email)); toast.success('Personal email saved'); } catch (e) { toast.error(e.message || 'Could not save'); }
  };
  const setCompleted = (id, v) => {
    const m = { ...(s.completedOverrides || {}) }; if (v === 'default') delete m[id]; else m[id] = v;
    setS({ ...s, completedOverrides: m });
  };
  const [lastSent, setLastSent] = useState<{ ok: any[]; bad: any[]; info: string; error?: string } | null>(null);
  useEffect(() => { if (!lastSent) return; const t = setTimeout(() => setLastSent(null), 60000); return () => clearTimeout(t); }, [lastSent]);
  const runNow = async () => {
    if (sch.autoExam && !sch.defaultExamId && sch.assignMode !== 'daily') { toast.error('Choose the test to assign first'); return; }
    setRunning(true);
    const startedAt = Date.now() - 5000;
    try {
      await persistSchedules();
      const r = await fetch('/api/public/run-mail-schedule', { method: 'POST', headers: await mailRequestHeaders(), body: JSON.stringify({ force: true, scheduleId }) });
      const j = await r.json().catch(() => ({ error: `The mail service did not answer (status ${r.status}).` }));
      if (!r.ok || j.error) throw new Error(j.error || 'Failed');
      const log = await fetchKey('mail_log', []);
      const fresh = (log || []).filter(x => new Date(x.at).getTime() >= startedAt).flatMap(x => x.results || []);
      setLastSent({ ok: fresh.filter(x => x.ok), bad: fresh.filter(x => !x.ok), info: j.info || 'Done' });
      toast.success(j.info || 'Done');
      fetchKey(stateKey, { sentIds: [] }).then(setSchState);
    } catch (e) {
      const msg = /brevo|api key|BREVO_API_KEY/i.test(e.message) ? `Emails could not be sent: the Brevo email key is missing or wrong. (${e.message})` : e.message;
      setLastSent({ ok: [], bad: [], info: '', error: msg });
      toast.error(msg);
    }
    setRunning(false);
  };
  const toggleSchStudent = id => setSch(p => ({ ...p, studentIds: p.studentIds.includes(id) ? p.studentIds.filter(x => x !== id) : [...p.studentIds, id] }));
  const toggle = id => { setApproved(false); setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); };

  const send = async () => {
    if (!approved) { toast.error('Please review and approve first'); return; }
    setSending(true);
    try {
      await saveSettings(s);
      await saveKey('mailer', mailer);
      const r = await fetch('/api/public/send-credentials', {
        method: 'POST', headers: await mailRequestHeaders(),
        body: JSON.stringify({ attachments, studentIds: [...selected], loginUrl, target: s.mailTarget, templateId, examId: sendExamId, assignExam, startAt: sendStartMode === 'custom' ? sendStart : '', includeExamSchedule, useExamSchedule: sendStartMode === 'exam', bufferMinutes: sendBuffer, tzOffsetMinutes: -new Date().getTimezoneOffset() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Sending failed');
      toast.success(`Sent ${j.sent} of ${j.total} emails${assignExam && sendExamId ? ` · ${j.assigned || 0} test(s) assigned` : ''}`);
      if (j.failed?.length) toast.error(`Failed: ${j.failed.map(f => f.email).join(', ')}`);
      setApproved(false);
    } catch (e) { toast.error(e.message); }
    setSending(false);
  };

  if (!loaded) return <AdminLayout><div className="p-10 flex justify-center"><LogoSpinner size="md" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <header className="page-hero flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3"><Settings2 className="h-3.5 w-3.5" /> Exam portal</p>
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Exam settings</h1>
            <p className="mt-1 max-w-xl text-sm muted-on-ink">How tests behave, what students see, and every email the exam portal sends.</p>
          </div>
          <button type="button" onClick={save} className="btn-pill btn-pill-accent h-10"><Save className="h-4 w-4" /> Save changes</button>
        </header>
        <div className="flex min-w-0 flex-col gap-5 md:flex-row md:gap-6">
          <nav aria-label="Settings sections" className="md:w-60 md:shrink-0">
            <label className="block md:hidden">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">Section</span>
              <select aria-label="Choose a settings section" value={activeTab} onChange={e => selectTab(e.target.value)} className="h-11 w-full rounded-xl border px-3 text-sm font-medium">
                {SECTION_GROUPS.map(group => <optgroup key={group} label={group}>{SECTIONS.filter(x => x[4] === group).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</optgroup>)}
              </select>
            </label>
            <div role="tablist" aria-label="Settings sections" aria-orientation="vertical" className="hidden md:sticky md:top-4 md:block md:space-y-4 md:rounded-3xl md:border md:bg-card/70 md:p-3 md:backdrop-blur">
              {SECTION_GROUPS.map(group => (
                <div key={group}>
                  <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{group}</p>
                  <div className="space-y-1">
                    {SECTIONS.filter(x => x[4] === group).map(([id, label, hint, Icon]) => (
                      <button key={id} id={`tab-${id}`} role="tab" aria-selected={activeTab === id} aria-controls={`panel-${id}`} type="button" onClick={() => selectTab(id)} className="cx-settings-tab">
                        <span className="cx-settings-tab-icon"><Icon className="h-4 w-4" /></span>
                        <span className="min-w-0"><span className="block font-semibold">{label}</span><span className="block truncate text-xs text-muted-foreground">{hint}</span></span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>
          <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="min-w-0 flex-1 space-y-5">
            {(() => { const [, label, hint, Icon] = SECTIONS.find(([id]) => id === activeTab) || SECTIONS[0]; return (
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                <div><h2 className="font-display text-lg font-bold leading-tight">{label}</h2><p className="text-xs text-muted-foreground">{hint}</p></div>
              </div>
            ); })()}
            {activeTab === 'branding' && <PresentationSettings exam />}
            {activeTab === 'monitoring' && <div className={card}><h2 className="font-semibold mb-1">Monitoring for every test</h2><p className="text-xs text-muted-foreground mb-4">Choose what students must turn on while writing a test.</p><ProctoringSwitches /></div>}
        {activeTab === 'general' && <>
        <div id="ps-general" className="grid md:grid-cols-2 gap-6 scroll-mt-28">
          <div className={card}>
            <h2 className="font-semibold mb-1">Results after submission</h2>
            <p className="text-xs text-muted-foreground mb-4">When hidden, students see “Thank you for your submission. You will receive your results soon.”</p>
            {[['show', 'Show results to students'], ['hide', 'Hide results (thank-you message only)']].map(([v, l]) => (
              <label key={v} className="cx-choice mb-2"><input type="radio" checked={s.resultsMode === v} onChange={() => setS({ ...s, resultsMode: v })} /> {l}</label>
            ))}
          </div>
          <div className={card}>
            <h2 className="font-semibold mb-1">Support email on the exam login page</h2>
            <p className="text-xs text-muted-foreground mb-4">Shown after a failed sign-in attempt.</p>
            <label className="flex items-center gap-2 text-sm mb-3"><input type="checkbox" checked={s.showSupportEmail} onChange={e => setS({ ...s, showSupportEmail: e.target.checked })} /> Show “Facing a problem?” with email</label>
            <input value={s.supportEmail} onChange={e => setS({ ...s, supportEmail: e.target.value })} className="w-full h-10 px-3 rounded-lg border bg-background text-sm" />
          </div>
        </div>


        <div className="grid md:grid-cols-2 gap-6">
          <div className={card}>
            <h2 className="font-semibold mb-1">"Back to Home" button for students</h2>
            <p className="text-xs text-muted-foreground mb-4">Where students go after finishing a test.</p>
            {[['exam', 'Exam dashboard (default)'], ['landing', 'Job portal landing page']].map(([v, l]) => (
              <label key={v} className="cx-choice mb-2"><input type="radio" checked={s.homeLinkTarget === v} onChange={() => setS({ ...s, homeLinkTarget: v })} /> {l}</label>
            ))}
          </div>
          <div className={card}>
            <h2 className="font-semibold mb-1">Completed tests on student dashboard</h2>
            <p className="text-xs text-muted-foreground mb-4">Default for everyone. You can override per student in the table below.</p>
            {[[true, 'Show completed tests'], [false, 'Hide completed tests']].map(([v, l]) => (
              <label key={String(v)} className="cx-choice mb-2"><input type="radio" checked={s.showCompletedTests === v} onChange={() => setS({ ...s, showCompletedTests: v })} /> {l}</label>
            ))}
          </div>
        </div>

        <section className={`${card} space-y-4`}>
          <h2 className="font-semibold">Student dashboard visibility</h2>
          {[
            ['showExpiredTests', 'Expired tests'],
            ['showUnassignedTests', 'Unassigned tests'],
            ['showUpcomingTests', 'Upcoming assigned tests'],
          ].map(([key, label]) => <label key={key} className="flex items-center justify-between gap-3 text-sm">
            <span>{label}</span><Switch aria-label={label} checked={s[key] === true} onCheckedChange={value => setS(prev => ({ ...prev, [key]: value }))} />
          </label>)}
        </section>
        <section className={`${card} space-y-4`}>
          <h2 className="font-semibold">Admin email alerts</h2>
          <p className="text-sm text-muted-foreground">jobportalfreeofficial@gmail.com</p>
          <label className="flex items-center justify-between gap-3 text-sm"><span>All admin alerts</span><Switch aria-label="All admin alerts" checked={notifyPrefs.all !== false} onCheckedChange={value => setNotifyPrefs(prev => ({ ...prev, all: value }))} /></label>
          {Object.entries(ADMIN_EVENTS).map(([event, config]) => <label key={event} className="flex items-center justify-between gap-3 text-sm">
            <span>{config.title.charAt(0).toUpperCase() + config.title.slice(1)}</span>
            <Switch aria-label={config.title} disabled={notifyPrefs.all === false} checked={notifyPrefs[event] !== false} onCheckedChange={value => setNotifyPrefs(prev => ({ ...prev, [event]: value }))} />
          </label>)}
        </section>
        </>}

        {activeTab === 'sender' && <>
        <div id="ps-sender" className={card}>
          <h2 className="font-semibold mb-1 flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> Sender email</h2>
          <p className="text-xs text-muted-foreground mb-4">Use an approved Brevo sender address. The Brevo API key is stored securely on the server.</p>
          <div className="grid md:grid-cols-2 gap-3">
            <input placeholder="Sender name (e.g. CodeXam)" value={mailer.senderName} onChange={e => setMailer({ ...mailer, senderName: e.target.value })} className="h-10 px-3 rounded-lg border bg-background text-sm" />
            <input type="email" placeholder="sender@gmail.com" value={mailer.senderEmail} onChange={e => setMailer({ ...mailer, senderEmail: e.target.value })} className="h-10 px-3 rounded-lg border bg-background text-sm" />
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Send credentials to</p>
            {[['personal', "Student's personal email (entered by admin or at sign-up)"], ['login', 'Login email']].map(([v, l]) => (
              <label key={v} className="cx-choice mb-2"><input type="radio" checked={s.mailTarget === v} onChange={() => setS({ ...s, mailTarget: v })} /> {l}</label>
            ))}
          </div>
        </div>

        </>}

        {activeTab === 'schedules' && <>
        <RandomMcqAllot />
        <div id="ps-schedules" className={card}>
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(scheduleMap).map(([id, value]) => <Button key={id} size="sm" variant={scheduleId === id ? 'default' : 'outline'} onClick={() => setScheduleId(id)}>{value.scheduleName || id}</Button>)}
            <Button size="sm" variant="outline" onClick={() => { const id = `sch_${Date.now()}`; setScheduleMap(prev => ({ ...prev, [id]: { ...DEFAULT_SCHEDULE, scheduleName: `Schedule ${Object.keys(prev).length + 1}` } })); setScheduleId(id); }}><Plus className="w-4 h-4" /> Add schedule</Button>
          </div>
          <div className="flex gap-2 mb-4">
            <input aria-label="Schedule name" value={sch.scheduleName || ''} onChange={e => setSch({ ...sch, scheduleName: e.target.value })} className="min-w-0 flex-1 h-10 px-3 rounded-lg border bg-background text-sm" />
            {scheduleId !== 'main' && <Button variant="outline" size="icon" aria-label="Delete schedule" onClick={() => { if (!confirm('Delete this schedule?')) return; setScheduleMap(prev => Object.fromEntries(Object.entries(prev).filter(([id]) => id !== scheduleId))); setScheduleId('main'); }}><Trash2 className="w-4 h-4" /></Button>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
            <h2 className="font-semibold">Automatic credential emails</h2>
            <label className="inline-flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="w-5 h-5 accent-primary" checked={sch.enabled} onChange={e => setSch({ ...sch, enabled: e.target.checked })} /> {sch.enabled ? 'ON' : 'OFF'}</label>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Sends automatically at the chosen time. Changes here save automatically. {sch.enabled && <span className="text-primary font-medium">Next check: {sch.frequency === 'daily' ? `every day at ${sch.time}` : sch.frequency === 'dates' ? `${sch.dates.length} selected date(s) at ${sch.time}` : `${sch.rangeFrom || '?'} → ${sch.rangeTo || '?'} at ${sch.time}`}</span>}</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">When</p>
                {[['daily', 'Every day'], ['dates', 'Only on selected dates'], ['range', 'Every day within a date range']].map(([v, l]) => (
                  <label key={v} className="cx-choice mb-2"><input type="radio" checked={sch.frequency === v} onChange={() => setSch({ ...sch, frequency: v })} /> {l}</label>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Time</p>
                <input type="time" value={sch.time} onChange={e => setSch({ ...sch, time: e.target.value })} className="h-10 px-3 rounded-lg border bg-background text-sm" />
              </div>
              <div>
                <RecipientGroups storageKey="codexam_mail_groups" current={sch.recipients === 'all' ? students.map(x => x.id) : sch.studentIds} onApply={ids => setSch({ ...sch, recipients: 'selected', studentIds: ids.filter(id => students.some(x => x.id === id)) })} unit="students" />
                <p className="text-sm font-medium mb-2 mt-3">Who</p>
                <label className="flex items-center gap-2 text-sm mb-1"><input type="radio" checked={sch.recipients === 'all'} onChange={() => setSch({ ...sch, recipients: 'all' })} /> All students</label>
                <label className="flex items-center gap-2 text-sm mb-1"><input type="radio" checked={sch.recipients === 'selected'} onChange={() => setSch({ ...sch, recipients: 'selected' })} /> Selected students ({sch.studentIds.length})</label>
                {sch.recipients === 'selected' && (
                  <div className="mt-2 rounded-xl border p-3">
                    <div className="flex gap-2 mb-2">
                      <input placeholder="Search students…" value={schQuery} onChange={e => setSchQuery(e.target.value)} className="flex-1 h-8 px-2 rounded-lg border bg-background text-xs" />
                      <button onClick={() => setSch({ ...sch, studentIds: Array.from(new Set([...sch.studentIds, ...schList.map(x => x.id)])) })} className="h-8 px-2 rounded-lg border text-xs">All</button>
                      <button onClick={() => setSch({ ...sch, studentIds: students.filter(hasPersonal).map(x => x.id) })} className="h-8 px-2 rounded-lg border text-xs">With personal email</button>
                      <button onClick={() => setSch({ ...sch, studentIds: [] })} className="h-8 px-2 rounded-lg border text-xs">None</button>
                    </div>
                    <div className="max-h-44 overflow-auto space-y-1">
                      {schList.map(st => (
                        <label key={st.id} className="flex items-center gap-2 text-xs py-1">
                          <input type="checkbox" checked={sch.studentIds.includes(st.id)} onChange={() => toggleSchStudent(st.id)} />
                          <span className="font-medium">{st.name}</span>
                          <span className="text-muted-foreground truncate">{contacts[st.id] || st.email}</span>
                          {sch.autoExam && sch.assignMode === 'different' && sch.studentIds.includes(st.id) && (
                            <span className="ml-auto flex gap-1">
                              <select value={sch.perStudentExam[st.id] || ''} onChange={e => setSch({ ...sch, perStudentExam: { ...sch.perStudentExam, [st.id]: e.target.value } })} className="h-7 w-28 rounded border bg-background px-1 text-[11px]">
                                <option value="">Default test</option>
                                {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                              </select>
                              {sch.examStartMode === 'custom' && <input type="datetime-local" value={sch.perStudentStart?.[st.id] || ''} onChange={e => setSch({ ...sch, perStudentStart: { ...(sch.perStudentStart || {}), [st.id]: e.target.value } })} className="h-7 rounded border bg-background px-1 text-[11px]" />}
                            </span>
                          )}
                        </label>
                      ))}
                      {!schList.length && <p className="text-xs text-muted-foreground">No students.</p>}
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm mt-2"><input type="checkbox" checked={!!sch.onceEver} onChange={e => setSch({ ...sch, onceEver: e.target.checked })} /> Send only once per student (skip anyone who already got it on an earlier day)</label>
                <select value={sch.mailTarget} onChange={e => setSch({ ...sch, mailTarget: e.target.value })} className="mt-2 h-9 rounded-lg border bg-background px-2 text-sm">
                  <option value="personal">Send to personal email</option><option value="login">Send to login email</option>
                </select>
                <label className="mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm">
                  <input type="checkbox" className="mt-0.5" checked={!!sch.usePersonalLogin} onChange={e => setSch({ ...sch, usePersonalLogin: e.target.checked })} />
                  <span><span className="font-medium">Display personal email in credentials</span></span>
                </label>
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">Email template</p>
                  <select value={sch.templateId || 'credentials'} onChange={e => { const t = templates.find(x => x.id === e.target.value); setSch({ ...sch, templateId: e.target.value, templateName: t?.name, templateSubject: t?.subject, templateBody: t?.body }); }} className="h-9 rounded-lg border bg-background px-2 text-sm">
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-sm mt-3"><input type="checkbox" checked={sch.includeExamSchedule !== false} onChange={e => setSch({ ...sch, includeExamSchedule: e.target.checked })} /> Include exam date & start time in automatic emails</label>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setEditTplId(sch.templateId || 'credentials')}>Edit selected template</Button>
                  <div className="mt-3">
                    <p className="text-xs font-medium mb-2">Automatic email preview{autoPreviewStudent ? ` — ${autoPreviewStudent.name}` : ''}</p>
                    <p className="text-sm font-semibold mb-2">{fillTemplate(autoPreviewTpl.subject, autoPreviewVars)}</p>
                    <MailPreview body={autoPreviewTpl.body} vars={autoPreviewVars} />
                    <MailAttachments value={sch.attachments || []} onChange={attachments => setSch({ ...sch, attachments })} />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={sch.autoExam} onChange={e => setSch({ ...sch, autoExam: e.target.checked })} /> Also assign a test automatically</label>
                <p className="text-xs text-muted-foreground mt-1">When a student's email is sent, the test is assigned to that student at the same moment.</p>
                {sch.autoExam && (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <label className="flex items-center gap-2"><input type="radio" checked={sch.assignMode === 'same' || !sch.assignMode} onChange={() => setSch({ ...sch, assignMode: 'same' })} /> Same test for everyone</label>
                      <label className="flex items-center gap-2"><input type="radio" checked={sch.assignMode === 'different'} onChange={() => setSch({ ...sch, assignMode: 'different' })} /> Different per student</label>
                      <label className="flex items-center gap-2"><input type="radio" checked={sch.assignMode === 'daily'} onChange={() => setSch({ ...sch, assignMode: 'daily' })} /> Different test every day</label>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1">{sch.assignMode === 'different' || sch.assignMode === 'daily' ? 'Default test (optional fallback)' : 'Test'}</p>
                      <select value={sch.defaultExamId} onChange={e => setSch({ ...sch, defaultExamId: e.target.value })} className={`w-full h-9 rounded-lg border bg-background px-2 text-sm ${!sch.defaultExamId && sch.assignMode !== 'daily' ? 'border-destructive' : ''}`}>
                        <option value="">— Choose test —</option>
                        {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                      </select>
                      {!sch.defaultExamId && sch.assignMode !== 'daily' && <p className="text-xs text-destructive mt-1">Choose a test — otherwise nothing gets assigned.</p>}
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1">Test start time</p>
                      <label className="flex items-center gap-2 text-sm"><input type="radio" checked={sch.examStartMode === 'exam'} onChange={() => setSch({ ...sch, examStartMode: 'exam' })} /> Use the test's own schedule (available right away if none)</label>
                      <label className="flex items-center gap-2 text-sm"><input type="radio" checked={sch.examStartMode === 'custom'} onChange={() => setSch({ ...sch, examStartMode: 'custom' })} /> Set a start time here</label>
                      <label className="flex items-center gap-2 text-sm"><input type="radio" checked={sch.examStartMode === 'daily-time'} onChange={() => setSch({ ...sch, examStartMode: 'daily-time', dailyStartTime: sch.dailyStartTime || '18:30' })} /> Same start time every day (uses that day's date)</label>
                      {sch.examStartMode === 'daily-time' && (
                        <input type="time" aria-label="Daily test start time" value={sch.dailyStartTime || ''} onChange={e => setSch({ ...sch, dailyStartTime: e.target.value })} className="mt-2 h-9 px-2 rounded-lg border bg-background text-sm" />
                      )}
                      {sch.examStartMode === 'custom' && (
                        <input type="datetime-local" aria-label="Automatic test start date and time" value={sch.defaultStart || ''} onChange={e => setSch({ ...sch, defaultStart: e.target.value })} className="mt-2 h-9 px-2 rounded-lg border bg-background text-sm" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>Students can start within</span>
                      <input type="number" min={1} value={sch.bufferMinutes ?? 10} onChange={e => setSch({ ...sch, bufferMinutes: Number(e.target.value) })} className="w-20 h-9 px-2 rounded-lg border bg-background text-sm" />
                      <span>min after start</span>
                      <span className="text-xs text-muted-foreground">(email end time = start + this window)</span>
                    </div>
                    {sch.assignMode === 'daily' && <DailyPlanner sch={sch} setSch={setSch} students={students} exams={exams} contacts={contacts} />}
                    {sch.assignMode === 'daily' && sch.examStartMode !== 'custom' && <p className="text-xs text-muted-foreground">Each day's test opens at the email time ({sch.time}) unless you set a start time above.</p>}
                    {sch.assignMode === 'different' && <p className="text-xs text-muted-foreground">Pick each student's test{sch.examStartMode === 'custom' ? ' and start time' : ''} in the student list (“Selected students”) or the table below.</p>}
                  </div>
                )}
              </div>
            </div>
            <div>
              {sch.frequency === 'dates' && (
                <Calendar mode="multiple" selected={sch.dates.map(d => parseISO(d))} onSelect={ds => setSch({ ...sch, dates: (ds || []).map(d => format(d, 'yyyy-MM-dd')) })} className="p-3 rounded-xl border pointer-events-auto" />
              )}
              {sch.frequency === 'range' && (
                <Calendar mode="range" selected={{ from: sch.rangeFrom ? parseISO(sch.rangeFrom) : undefined, to: sch.rangeTo ? parseISO(sch.rangeTo) : undefined }} onSelect={r => setSch({ ...sch, rangeFrom: r?.from ? format(r.from, 'yyyy-MM-dd') : null, rangeTo: r?.to ? format(r.to, 'yyyy-MM-dd') : null })} className="p-3 rounded-xl border pointer-events-auto" />
              )}
              {sch.frequency === 'dates' && <p className="text-xs text-muted-foreground mt-2">{sch.dates.length ? [...sch.dates].sort().join(', ') : 'Pick one or more dates'}</p>}
              {sch.frequency === 'range' && <p className="text-xs text-muted-foreground mt-2">{sch.rangeFrom ? `${sch.rangeFrom} → ${sch.rangeTo || '…'}` : 'Pick a start and end date'}</p>}
              {sch.frequency === 'daily' && <p className="text-sm text-muted-foreground">Runs every day at {sch.time}.</p>}
              <div className={`mt-4 rounded-xl border-l-4 p-3 bg-muted/60 ${schState.lastRunInfo ? (schState.lastRunOk === false || /Error/.test(schState.lastRunInfo) ? 'border-destructive' : 'border-primary') : 'border-border'}`}>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Last run</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{schState.lastRunInfo || 'Not run yet'}</p>
                <p className="text-xs text-foreground/80 mt-1"><span className="inline-flex items-center rounded-full bg-primary/15 text-primary px-2 py-0.5 font-semibold mr-1">{(schState.sentIds || []).length}</span> student(s) already received it</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={runNow} disabled={running} className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40">{running ? 'Running…' : 'Run now'}</button>
                <button onClick={openLog} className="h-9 px-3 rounded-lg border text-sm inline-flex items-center gap-1"><BarChart3 className="w-4 h-4" /> Delivery report</button>
                <button onClick={async () => { const ns = { ...schState, sentIds: [] }; setSchState(ns); await saveKey(stateKey, ns); toast.success('Everyone can receive it again'); }} className="h-9 px-3 rounded-lg border text-sm">Reset "already sent" list</button>
              </div>
              {lastSent && <div role="status" className={`mt-3 rounded-xl border-2 p-4 ${lastSent.error ? 'border-destructive bg-destructive/10' : 'border-primary bg-primary/10'}`}>
                {lastSent.error ? <p className="text-sm font-semibold text-destructive flex items-start gap-2"><XCircle className="w-5 h-5 shrink-0" /> Not working: {lastSent.error}</p> : <>
                  <p className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> {lastSent.ok.length} email(s) sent just now</p>
                  {lastSent.ok.map(x => <p key={x.id + x.email} className="text-sm flex items-center gap-2 mt-1"><CheckCircle2 className="w-4 h-4 text-primary" /> {x.name} — {x.email}</p>)}
                  {lastSent.bad.map(x => <p key={x.id + x.email} className="text-sm flex items-center gap-2 mt-1 text-destructive"><XCircle className="w-4 h-4" /> {x.name} {x.email} — {x.error}</p>)}
                  {!lastSent.ok.length && !lastSent.bad.length && <p className="text-sm text-muted-foreground mt-1">{lastSent.info} — nobody was due to receive an email.</p>}
                </>}
                <p className="text-[11px] text-muted-foreground mt-2">This message hides after 1 minute.</p>
              </div>}
            </div>
          </div>
        </div>

        </>}

        {activeTab === 'reminders' && <>
        <div id="ps-reminders" className={card}><ExamReminders students={students} /></div>

        </>}

        {activeTab === 'windows' && <>
        <div id="ps-windows" className={card}><h2 className="font-semibold mb-4">Missed exam windows</h2><SlotExtensions students={students} exams={exams} /></div>

        </>}

        {activeTab === 'signups' && <>
        <div className={card}>
          <h2 className="font-semibold mb-1">Signed-up users ({signups.length})</h2>
          <p className="text-xs text-muted-foreground mb-3">Everyone who created a JobPortal account. Add them as exam students to send credentials.</p>
          <div className="max-h-72 overflow-auto border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs sticky top-0"><tr className="text-left"><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Joined</th><th className="p-3"></th></tr></thead>
              <tbody>
                {signups.map(p => (
                  <tr key={p.user_id} className="border-t">
                    <td className="p-3">{p.full_name || '—'}</td>
                    <td className="p-3">{p.email}</td>
                    
                    <td className="p-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right"><button onClick={() => addAsStudent(p)} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Add as exam student</button></td>
                  </tr>
                ))}
                {!signups.length && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No sign-ups visible. Sign in to the main admin panel as admin to see them.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        </>}

        {activeTab === 'templates' && <>
        <div className={card}><h2 className="font-semibold mb-1">Result email</h2><p className="text-xs text-muted-foreground mb-4">Wording of the result email. Admin alert and verify-email wording live in Job Portal admin → Admin Controls.</p><ResultTemplateEditor /></div>
        <div id="ps-templates" className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
            <h2 className="font-semibold">Email templates</h2>
            <div className="flex flex-wrap gap-2">
              <AiTemplateButton purpose="exam credentials / invitation" variables={TEMPLATE_VARS} onCreate={addAiTpl} />
              <Button onClick={addTpl} variant="outline" size="sm"><Plus className="w-4 h-4" /> New template</Button>
              <Button onClick={saveTemplates} size="sm"><Save className="w-4 h-4" /> Save templates</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Placeholders: {TEMPLATE_VARS}. Exam times come from the test you pick when sending. Click <b>Save templates</b> after editing so your changes are kept and can be used in the exam portal and schedules.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {templates.map(t => (
              <button key={t.id} onClick={() => setEditTplId(t.id)} className={`h-9 px-3 rounded-full text-sm border ${t.id === editTpl.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}>{t.name}</button>
            ))}
          </div>
          <div className="flex gap-2 mb-3">
            <input value={editTpl.name} onChange={e => updateTpl(editTpl.id, { name: e.target.value })} placeholder="Template name" className="flex-1 h-10 px-3 rounded-lg border bg-background text-sm" />
            <button onClick={() => delTpl(editTpl.id)} disabled={templates.length <= 1} className="h-10 px-3 rounded-lg border text-sm text-destructive disabled:opacity-40"><Trash2 className="w-4 h-4" /></button>
          </div>
          <input value={editTpl.subject} onChange={e => updateTpl(editTpl.id, { subject: e.target.value })} placeholder="Subject" className="w-full h-10 px-3 rounded-lg border bg-background text-sm mb-3" />
          <MailTemplateEditor body={editTpl.body} onChange={body => updateTpl(editTpl.id, { body })} subject={editTpl.subject} onSubjectChange={subject => updateTpl(editTpl.id, { subject })} purpose={`exam credentials / invitation: ${editTpl.name}`} variables="{{name}} {{email}} {{password}} {{loginUrl}} {{examTitle}} {{examDuration}}" />
        </div>

        </>}

        {activeTab === 'send' && <>
        <div id="ps-send" className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> Send credentials & per-student results</h2>
            <div className="flex flex-wrap gap-2">
              <select value={filter} onChange={e => { setFilter(e.target.value); setApproved(false); }} className="h-9 rounded-lg border bg-background px-2 text-sm">
                <option value="all">All students ({students.length})</option>
                <option value="personal">With personal email ({students.filter(hasPersonal).length})</option>
                <option value="portal">Portal credentials only ({students.filter(x => isGenerated(x) && !contacts[x.id]).length})</option>
              </select>
              <input placeholder="Search…" value={query} onChange={e => setQuery(e.target.value)} className="h-9 px-3 rounded-lg border bg-background text-sm" />
              <button onClick={() => { setApproved(false); setSelected(new Set(list.map(x => x.id))); }} className="h-9 px-3 rounded-lg border text-sm">Select all</button>
              <button onClick={() => { setApproved(false); setSelected(new Set()); }} className="h-9 px-3 rounded-lg border text-sm">Clear</button>
            </div>
          </div>
          <RecipientGroups storageKey="codexam_manual_mail_groups" current={[...selected]} onApply={ids => { setSelected(new Set(ids.filter(id => students.some(x => x.id === id)))); setApproved(false); }} unit="students" />
          <div className="mt-3 max-h-80 overflow-auto border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs sticky top-0"><tr className="text-left"><th className="p-3 w-8"></th><th className="p-3">Student</th><th className="p-3">Personal email</th><th className="p-3">Password</th><th className="p-3">Results</th><th className="p-3">Completed tests</th><th className="p-3">Auto-mail</th><th className="p-3"></th></tr></thead>
              <tbody>
                {list.map(st => (
                  <tr key={st.id} className="border-t">
                    <td className="p-3"><input type="checkbox" checked={selected.has(st.id)} onChange={() => toggle(st.id)} /></td>
                    <td className="p-3"><div className="font-medium">{st.name}</div><div className="text-xs text-muted-foreground">{st.email}</div><div className="text-[11px] text-primary">→ {sendTo(st)}</div></td>
                    <td className="p-3"><input type="email" key={contacts[st.id] || ''} defaultValue={contacts[st.id] || ''} placeholder="add email" onBlur={e => { if ((e.target.value || '') !== (contacts[st.id] || '')) saveContact(st.id, e.target.value); }} className="h-8 w-44 rounded-lg border bg-background px-2 text-xs" /></td>
                    <td className="p-3 font-mono text-xs">{st.password}</td>
                    <td className="p-3">
                      <select value={overrides[st.id] || 'default'} onChange={e => setOverride(st.id, e.target.value)} className="h-8 rounded-lg border bg-background px-2 text-xs">
                        <option value="default">Portal default</option><option value="show">Always show</option><option value="hide">Always hide</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <select value={s.completedOverrides?.[st.id] || 'default'} onChange={e => setCompleted(st.id, e.target.value)} className="h-8 rounded-lg border bg-background px-2 text-xs">
                        <option value="default">Portal default</option><option value="show">Show</option><option value="hide">Hide</option>
                      </select>
                    </td>
                    <td className="p-3 space-y-1">
                      {sch.recipients === 'selected' && <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={sch.studentIds.includes(st.id)} onChange={() => toggleSchStudent(st.id)} /> Include</label>}
                      {sch.autoExam && sch.assignMode === 'different' && (
                        <select value={sch.perStudentExam[st.id] || ''} onChange={e => setSch({ ...sch, perStudentExam: { ...sch.perStudentExam, [st.id]: e.target.value } })} className="h-8 w-36 rounded-lg border bg-background px-2 text-xs">
                          <option value="">Default test</option>
                          {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                        </select>
                      )}
                      {sch.autoExam && sch.assignMode === 'different' && sch.examStartMode === 'custom' && <input type="datetime-local" value={sch.perStudentStart?.[st.id] || ''} onChange={e => setSch({ ...sch, perStudentStart: { ...(sch.perStudentStart || {}), [st.id]: e.target.value } })} className="h-8 w-44 rounded-lg border bg-background px-2 text-xs" />}
                      {sch.recipients !== 'selected' && !(sch.autoExam && sch.assignMode === 'different') && <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3"><button onClick={() => setPreviewId(st.id)} className="text-xs text-primary inline-flex items-center gap-1"><Eye className="w-3 h-3" /> Preview</button></td>
                  </tr>
                ))}
                {!list.length && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No students yet.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid md:grid-cols-3 gap-3">
            <div>
              <p className="text-xs font-medium mb-1">Email template</p>
              <select value={templateId} onChange={e => { setTemplateId(e.target.value); setApproved(false); }} className="w-full h-9 rounded-lg border bg-background px-2 text-sm">
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs font-medium mb-1">Test (for exam name & time in the email)</p>
              <select value={sendExamId} onChange={e => { setSendExamId(e.target.value); setApproved(false); }} className="w-full h-9 rounded-lg border bg-background px-2 text-sm">
                <option value="">— None —</option>
                {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
              </select>
            </div>
            <label className="flex items-end gap-2 text-sm pb-2"><input type="checkbox" checked={assignExam} disabled={!sendExamId} onChange={e => setAssignExam(e.target.checked)} /> Also assign this test to the selected students</label>
          </div>
          <div className="mt-3 space-y-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeExamSchedule} onChange={e => { setIncludeExamSchedule(e.target.checked); setApproved(false); }} /> Include exam date & start time in this email</label>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2"><input type="radio" name="manual-start-mode" checked={sendStartMode === 'custom'} onChange={() => { setSendStartMode('custom'); setApproved(false); }} /> Set date & start time</label>
              <label className="flex items-center gap-2"><input type="radio" name="manual-start-mode" checked={sendStartMode === 'exam'} onChange={() => { setSendStartMode('exam'); setApproved(false); }} /> Use selected test's schedule</label>
              {sendStartMode === 'custom' && <input type="datetime-local" aria-label="Email exam date and start time" value={sendStart} onChange={e => { setSendStart(e.target.value); setApproved(false); }} className="h-9 px-2 rounded-lg border bg-background text-sm" />}
              {sendStartMode === 'custom' && sendStart && <Button variant="outline" size="sm" onClick={() => { setSendStart(''); setApproved(false); }}><X className="w-4 h-4" /> Clear date</Button>}
              {sendExamId && <><span className="text-xs self-center">Start window</span><input type="number" min={1} value={sendBuffer} onChange={e => { setSendBuffer(Number(e.target.value)); setApproved(false); }} className="w-20 h-9 px-2 rounded-lg border bg-background text-sm" /><span className="text-xs self-center">min</span></>}
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditSendTemplate(v => !v)}>{editSendTemplate ? 'Close template editor' : 'Edit email before sending'}</Button>
            {editSendTemplate && <div className="space-y-3"><input aria-label="Sending email subject" value={activeTpl.subject} onChange={e => updateTpl(activeTpl.id, { subject: e.target.value })} className="w-full h-10 px-3 rounded-lg border bg-background text-sm" /><MailTemplateEditor body={activeTpl.body} onChange={body => updateTpl(activeTpl.id, { body })} subject={activeTpl.subject} onSubjectChange={subject => updateTpl(activeTpl.id, { subject })} purpose="exam credentials / invitation" variables="{{name}} {{email}} {{password}} {{loginUrl}} {{examTitle}} {{examDuration}}" /></div>}
          </div>

          <div className="mt-4"><MailAttachments value={attachments} onChange={value => { setAttachments(value); setApproved(false); }} /></div>

          {preview && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="text-xs font-semibold text-primary mb-2">Preview — will be sent to {sendTo(preview)}</p>
              <p className="font-semibold mb-2">{fillTemplate(activeTpl.subject, { name: preview.name, email: preview.email, password: preview.password, loginUrl, ...examVarsFor(sendExamId) })}</p>
              <MailPreview body={activeTpl.body} vars={{ name: preview.name, email: preview.email, password: preview.password || '', loginUrl, ...examVarsFor(sendExamId) }} />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} disabled={!selected.size} /> I checked the template, names and credentials for {selected.size} student(s)</label>
            <button onClick={send} disabled={!approved || sending || !selected.size} className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40">
              <Send className="w-4 h-4" /> {sending ? 'Sending…' : `Approve & send (${selected.size})`}
            </button>
            <button onClick={openLog} className="h-10 px-4 inline-flex items-center gap-2 rounded-xl border text-sm"><BarChart3 className="w-4 h-4" /> Delivery report</button>
          </div>
        </div>
        </>}
          </div>
        </div>
      </div>

      {showLog && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowLog(false)}>
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Delivery report</h2>
              <button onClick={() => setShowLog(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            {(() => {
              const all = mailLog.flatMap(r => r.results || []);
              const ok = all.filter(r => r.ok).length;
              return (
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Total emails</p><p className="text-2xl font-bold">{all.length}</p></div>
                  <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Received (sent OK)</p><p className="text-2xl font-bold text-primary">{ok}</p></div>
                  <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Not received</p><p className="text-2xl font-bold text-destructive">{all.length - ok}</p></div>
                </div>
              );
            })()}
            <div className="rounded-xl border bg-primary/5 p-4 mb-4 text-sm">
              <p className="font-semibold mb-1">Scheduled automatic emails</p>
              {sch.enabled ? (
                <>
                  <p className="text-muted-foreground">{sch.frequency === 'daily' ? 'Every day' : sch.frequency === 'dates' ? `On ${sch.dates.join(', ') || 'no dates'}` : `Every day from ${sch.rangeFrom || '?'} to ${sch.rangeTo || sch.rangeFrom || '?'} (both days included)`} at {sch.time} · template: <b>{templates.find(t => t.id === sch.templateId)?.name || 'Login credentials'}</b></p>
                  {schSendDates.length ? (
                    <div className="mt-2 max-h-52 overflow-auto rounded-lg border bg-card">
                      {schSendDates.map(d => {
                        const passed = d < todayStr || (d === todayStr && sch.time <= nowHM);
                        return (
                          <div key={d} className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs border-b last:border-b-0">
                            <span className="font-medium">{dayLabelFor(d)}</span>
                            <span className={passed ? 'text-muted-foreground' : 'text-primary font-medium'}>{passed ? 'Already passed' : `Will be sent at ${sch.time}`}</span>
                          </div>
                        );
                      })}
                      {rangeExtra > 0 && <div className="px-3 py-1.5 text-xs text-muted-foreground">+ {rangeExtra} more day(s) in the range</div>}
                    </div>
                  ) : <p className="text-xs text-muted-foreground mt-2">No dates selected yet — pick dates or a range above.</p>}
                  <p className="text-xs text-muted-foreground mt-2">Recipients: {sch.recipients === 'all' ? `All students (${students.length})` : `${sch.studentIds.length} selected student(s)`} · Goes to {sch.mailTarget === 'personal' ? 'personal email' : 'login email'}</p>
                </>
              ) : <p className="text-muted-foreground">Automatic sending is off.</p>}
              {schState.lastRunInfo && <p className="text-xs mt-1">Last run: {schState.lastRunInfo}</p>}
            </div>
            <div className="flex gap-2 mb-4 text-xs">
              {[['all', 'All'], ['scheduled', 'Automatic'], ['manual', 'Manual'], ['results', 'Results']].map(([k, l]) => <button key={k} onClick={() => setLogFilter(k)} className={`px-3 py-1 rounded-full border ${logFilter === k ? 'bg-primary text-primary-foreground' : ''}`}>{l}</button>)}
            </div>
            {!mailLog.length && <p className="text-sm text-muted-foreground">No emails sent yet.</p>}
            <div className="space-y-4">
              {mailLog.filter(r => logFilter === 'all' || (logFilter === 'scheduled' ? ['scheduled', 'run-now'].includes(r.source) : logFilter === 'manual' ? !['scheduled', 'run-now', 'results'].includes(r.source) : r.source === 'results')).map((run, i) => {
                const ok = (run.results || []).filter(r => r.ok); const bad = (run.results || []).filter(r => !r.ok);
                return (
                  <div key={i} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold">{new Date(run.at).toLocaleString()} · {run.template}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{run.source === 'scheduled' ? 'Automatic' : run.source === 'run-now' ? 'Run now' : 'Manual'} · {ok.length}/{(run.results || []).length} sent</span>
                    </div>
                    {ok.length > 0 && <div className="mb-2"><p className="text-xs font-medium text-primary mb-1">Received</p>{ok.map(r => <p key={r.id + r.email} className="text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-primary" /> {r.name} — {r.email}</p>)}</div>}
                    {bad.length > 0 && <div><p className="text-xs font-medium text-destructive mb-1">Not received</p>{bad.map(r => <p key={r.id + r.email} className="text-xs flex items-center gap-1"><XCircle className="w-3 h-3 text-destructive" /> {r.name} — {r.email} <span className="text-muted-foreground">({r.error})</span></p>)}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

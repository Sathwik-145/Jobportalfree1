import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/db-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Loader2, CalendarClock, Trash2, Save, BadgeCheck, Pencil } from "lucide-react";
import MailAttachments from "@/exam/components/MailAttachments";
import RecipientGroups from "@/exam/components/RecipientGroups";
import type { MailAttachment } from "@/exam/lib/mailAttachments";
import MailTemplateEditor, { AiTemplateButton } from "@/exam/components/MailTemplateEditor";
import { fetchKey, saveKey } from "@/exam/lib/codexamSettings";

const BUILTIN = [
  { id: "welcome-image", name: "Welcome (with picture)", subject: "Welcome to JobPortalFree, {{name}}!", body: "[image={{siteUrl}}/email/logo.png]Logo[/image]\n\n[image={{siteUrl}}/email/welcome.jpg]Welcome[/image]\n\nHi {{name}},\n\n**Welcome to JobPortalFree!**\n\n- Browse fresh jobs every day\n- Take free assessments and earn certificates\n\n[button={{siteUrl}}/jobs]Explore jobs[/button]\n\nThanks,\nThe Job Portal team" },
  { id: "assessment-image", name: "Sample assessment (with picture)", subject: "New assessment available", body: "[image={{siteUrl}}/email/logo.png]Logo[/image]\n\n[image={{siteUrl}}/email/assessment.jpg]Assessment[/image]\n\nHi {{name}},\n\n**A new assessment is waiting for you.**\n\n[highlight=info]Finish it to boost your profile and get noticed by recruiters.[/highlight]\n\n[button={{siteUrl}}/assessments]Take the assessment[/button]\n\nAll the best,\nThe Job Portal team" },
  { id: "new-job", name: "New job posted", subject: "New job opening: {{jobTitle}}", body: "Hi {{name}},\n\nA new job has just been posted that may interest you.\n\n- **Role:** {{jobTitle}}\n- **Company:** {{company}}\n\n[highlight=info]Apply early — openings fill up fast.[/highlight]\n\n[button={{siteUrl}}/jobs]View the job[/button]\n\nBest of luck!" },
  { id: "announcement", name: "General announcement", subject: "Important update", body: "Hi {{name}},\n\n**We have an important update for you.**\n\nWrite your message here.\n\nThanks,\nThe Job Portal team" },
  { id: "drive", name: "Hiring drive / event", subject: "Upcoming hiring drive", body: "Hi {{name}},\n\nWe're hosting a hiring drive.\n\n- **Date:** \n- **Time:** \n- **Where:** \n\n[color=success]Register early to reserve your spot.[/color]\n\nSee you there!" },
  { id: "reminder", name: "Deadline reminder", subject: "Reminder: deadline approaching", body: "Hi {{name}},\n\n[highlight=highlight]**Applications close soon.**[/highlight]\n\nDon't miss out — complete your application today.\n\nThanks!" },
];

type Person = { name: string; email: string };
type Sched = { id: string; enabled: boolean; frequency: "once" | "daily" | "range"; date?: string; rangeFrom?: string; rangeTo?: string; time: string; subject: string; body: string; recipients: Person[]; tzOffsetMinutes: number; lastRunInfo?: string; label: string; senderName?: string; attachments?: MailAttachment[] };
type Tpl = { id: string; name: string; subject: string; body: string; custom?: boolean };

export default function AdminMail() {
  const { toast } = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [target, setTarget] = useState<"all" | "selected" | "custom">("all");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState("");
  const [q, setQ] = useState("");
  const [customTpls, setCustomTpls] = useState<Tpl[]>([]);
  const TEMPLATES: Tpl[] = [...BUILTIN, ...customTpls];
  const [tplId, setTplId] = useState(BUILTIN[0].id);
  const [subject, setSubject] = useState(BUILTIN[0].subject);
  const [body, setBody] = useState(BUILTIN[0].body);
  const [senderName, setSenderName] = useState("JobPortalFree");
  const [attachments, setAttachments] = useState<MailAttachment[]>([]);
  const [mode, setMode] = useState<"now" | "once" | "daily" | "range">("now");
  const [date, setDate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [time, setTime] = useState("09:00");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Sched[]>([]);

  useEffect(() => {
    supabase.from("profiles").select("full_name,email").then(({ data }) =>
      setPeople((data || []).filter((p: any) => p.email).map((p: any) => ({ name: p.full_name || "", email: p.email }))));
    fetchKey<Sched[]>("portal_mail_schedules", []).then(setSchedules);
    fetchKey<Tpl[]>("portal_mail_templates", []).then((t) => setCustomTpls(Array.isArray(t) ? t : []));
    fetchKey<string>("portal_sender_name", "").then((n) => n && setSenderName(n));
  }, []);

  const shown = useMemo(() => people.filter((p) => `${p.name} ${p.email}`.toLowerCase().includes(q.toLowerCase())), [people, q]);
  const recipients = (): Person[] => {
    if (target === "all") return people;
    if (target === "selected") return people.filter((p) => picked.has(p.email));
    return Array.from(new Set(custom.split(/[\s,;]+/).filter(Boolean).map(e => e.trim().toLowerCase()))).map((email) => ({ name: people.find(p => p.email.toLowerCase() === email)?.name || "", email }));
  };
  const pickTpl = (id: string) => { const t = TEMPLATES.find((x) => x.id === id); if (!t) return; setTplId(id); setSubject(t.subject); setBody(t.body); };
  const saveTemplate = async () => {
    const name = window.prompt("Template name", TEMPLATES.find((t) => t.id === tplId)?.custom ? TEMPLATES.find((t) => t.id === tplId)?.name : "");
    if (!name?.trim()) return;
    const existing = customTpls.find((t) => t.name.toLowerCase() === name.trim().toLowerCase());
    const tpl: Tpl = { id: existing?.id || `t_${Date.now()}`, name: name.trim().slice(0, 60), subject, body, custom: true };
    const next = existing ? customTpls.map((t) => t.id === tpl.id ? tpl : t) : [...customTpls, tpl];
    setCustomTpls(next); setTplId(tpl.id); await saveKey("portal_mail_templates", next);
    toast({ title: existing ? "Template updated" : "Template saved" });
  };
  const deleteTemplate = async (id: string) => {
    if (!window.confirm("Delete this template?")) return;
    const next = customTpls.filter((t) => t.id !== id); setCustomTpls(next); await saveKey("portal_mail_templates", next);
    if (tplId === id) pickTpl(BUILTIN[0].id);
  };
  const saveSender = async () => { await saveKey("portal_sender_name", senderName.trim()); toast({ title: "Sender name saved", description: `Emails will show “${senderName.trim()}”` }); };

  const submit = async () => {
    const list = recipients();
    if (!list.length) return toast({ title: "Choose at least one recipient", variant: "destructive" });
    if (list.some(p => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))) return toast({ title: "Check the email addresses", variant: "destructive" });
    if (!subject.trim() || !body.trim()) return toast({ title: "Add a subject and message", variant: "destructive" });
    setBusy(true);
    try {
      if (mode === "now") {
        const { data: s } = await supabase.auth.getSession();
        const r = await fetch("/api/public/portal-mail", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session?.access_token || ""}` }, body: JSON.stringify({ recipients: list, subject, body, senderName, attachments }) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Failed");
        toast({ title: `Sent ${j.sent} of ${j.total}`, description: j.failed?.length ? `${j.failed.length} failed` : undefined });
      } else {
        if (mode === "once" && !date) throw new Error("Pick a date");
        if (mode === "range" && (!from || !to)) throw new Error("Pick the start and end dates");
        if (mode === "range" && from > to) throw new Error("End date must follow the start date");
        const schedule: Sched = { id: editingId || `p_${Date.now()}`, enabled: true, frequency: mode, date, rangeFrom: from, rangeTo: to, time, subject, body, recipients: list, tzOffsetMinutes: -new Date().getTimezoneOffset(), label: TEMPLATES.find((t) => t.id === tplId)?.name || "Custom", senderName, attachments };
        const next = editingId ? schedules.map(s => s.id === editingId ? schedule : s) : [...schedules, schedule];
        await saveKey("portal_mail_schedules", next);
        setSchedules(next); setEditingId(null);
        toast({ title: "Mail scheduled", description: `${list.length} recipient(s) at ${time}` });
      }
    } catch (e: any) { toast({ title: "Could not send", description: e.message, variant: "destructive" }); }
    setBusy(false);
  };
  const updateSchedules = async (next: Sched[]) => { setSchedules(next); await saveKey("portal_mail_schedules", next); };
  const when = (s: Sched) => s.frequency === "once" ? `On ${s.date} at ${s.time}` : s.frequency === "daily" ? `Every day at ${s.time}` : `Every day ${s.rangeFrom} → ${s.rangeTo} at ${s.time}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2"><Mail className="w-6 h-6 text-primary" /> Send Mail</h1>
        <p className="text-sm text-muted-foreground">Email your users right away or on a schedule — new jobs, announcements and more.</p>
      </div>

      <Card className="rounded-2xl"><CardContent className="p-4 md:p-6 space-y-5">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <div><Label className="flex items-center gap-1"><BadgeCheck className="w-4 h-4 text-primary" /> Sender name (what people see in their inbox)</Label><Input value={senderName} maxLength={60} onChange={(e) => setSenderName(e.target.value)} placeholder="JobPortalFree" /></div>
          <Button variant="outline" onClick={saveSender}>Save as default</Button>
        </div>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2"><Label>Template</Label><div className="flex flex-wrap gap-2"><AiTemplateButton purpose="job portal announcement" variables="{{name}}" onCreate={(tpl) => { const t: Tpl = { id: `t_${Date.now()}`, name: tpl.name.slice(0, 60), subject: tpl.subject, body: tpl.body, custom: true }; const next = [...customTpls, t]; setCustomTpls(next); setTplId(t.id); setSubject(t.subject); setBody(t.body); void saveKey("portal_mail_templates", next); }} /><Button size="sm" variant="outline" className="gap-1" onClick={saveTemplate}><Save className="w-4 h-4" /> Save as template</Button></div></div>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => <span key={t.id} className="inline-flex items-center"><Button size="sm" variant={tplId === t.id ? "default" : "outline"} onClick={() => pickTpl(t.id)}>{t.name}</Button>{t.custom && <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Delete ${t.name}`} onClick={() => deleteTemplate(t.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>}</span>)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Use {"{{name}}"} for the person's name. Fill in placeholders like {"{{jobTitle}}"} directly in the text.</p>
        </div>
        <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
        <div><Label className="mb-2 block">Message</Label><MailTemplateEditor body={body} onChange={setBody} subject={subject} onSubjectChange={setSubject} purpose="job portal announcement" variables="{{name}}" /></div>
        <div><Label className="mb-2 block">Images (optional)</Label><MailAttachments value={attachments} onChange={setAttachments} /></div>

        <div>
          <Label className="mb-2 block">Send to</Label>
          <RecipientGroups storageKey="portal_mail_groups" current={recipients().map(p => p.email)} onApply={emails => { setTarget('custom'); setCustom(emails.join(', ')); }} />
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="radio" checked={target === "all"} onChange={() => setTarget("all")} /> Everyone ({people.length})</label>
            <label className="flex items-center gap-2"><input type="radio" checked={target === "selected"} onChange={() => setTarget("selected")} /> Selected people ({picked.size})</label>
            <label className="flex items-center gap-2"><input type="radio" checked={target === "custom"} onChange={() => setTarget("custom")} /> Type email addresses</label>
          </div>
          {target === "selected" && (
            <div className="mt-3 space-y-2">
              <Input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
              <div className="border rounded-lg max-h-60 overflow-y-auto divide-y">
                {shown.map((p) => (
                  <label key={p.email} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50">
                    <input type="checkbox" checked={picked.has(p.email)} onChange={() => setPicked((s) => { const n = new Set(s); n.has(p.email) ? n.delete(p.email) : n.add(p.email); return n; })} />
                    <span className="flex-1 min-w-0 truncate">{p.name || "—"}</span><span className="text-xs text-muted-foreground truncate max-w-[50%]">{p.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {target === "custom" && <textarea className="mt-3 w-full rounded-lg border bg-background p-2 text-sm" rows={3} placeholder="one@example.com, two@example.com" value={custom} onChange={(e) => setCustom(e.target.value)} />}
        </div>

        <div>
          <Label className="mb-2 block">When</Label>
          <div className="flex flex-wrap gap-4 text-sm">
            {(["now", "once", "daily", "range"] as const).map((m) => (
              <label key={m} className="flex items-center gap-2"><input type="radio" checked={mode === m} onChange={() => setMode(m)} /> {m === "now" ? "Send now" : m === "once" ? "On a date" : m === "daily" ? "Every day" : "Every day in a date range"}</label>
            ))}
          </div>
          {mode !== "now" && (
            <div className="flex flex-wrap gap-3 mt-3 items-end">
              {mode === "once" && <div><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>}
              {mode === "range" && <><div><Label className="text-xs">From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div><div><Label className="text-xs">To (included)</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div></>}
              <div><Label className="text-xs">Time</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
            </div>
          )}
        </div>

        <Button onClick={submit} disabled={busy} className="gap-2 w-full sm:w-auto">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "now" ? <Send className="w-4 h-4" /> : <CalendarClock className="w-4 h-4" />}
          {mode === "now" ? `Send to ${recipients().length}` : editingId ? "Save schedule changes" : "Schedule mail"}
        </Button>
        {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setMode("now"); }}>Cancel editing</Button>}
      </CardContent></Card>

      <Card className="rounded-2xl"><CardContent className="p-4 md:p-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><CalendarClock className="w-5 h-5 text-primary" /> Scheduled mails</h2>
        {!schedules.length ? <p className="text-sm text-muted-foreground">Nothing scheduled.</p> : (
          <div className="divide-y">
            {schedules.map((s) => (
              <div key={s.id} className="py-3 flex flex-wrap items-center gap-3 text-sm">
                <div className="flex-1 min-w-0 basis-full sm:basis-auto">
                  <p className="font-medium">{s.subject} <span className="text-xs text-muted-foreground">· {s.label}</span></p>
                  <p className="text-xs text-muted-foreground">{when(s)} · {s.recipients.length} recipient(s){s.lastRunInfo ? ` · Last: ${s.lastRunInfo}` : ""}</p>
                </div>
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={s.enabled} onChange={(e) => updateSchedules(schedules.map((x) => x.id === s.id ? { ...x, enabled: e.target.checked } : x))} /> On</label>
                <Button size="icon" variant="ghost" aria-label="Delete schedule" onClick={() => updateSchedules(schedules.filter((x) => x.id !== s.id))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, PartyPopper, Save, Send, Loader2, Eye, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/db-client";
import { fetchKey, saveKey } from "@/exam/lib/codexamSettings";
import { renderMail } from "@/exam/lib/mailContent";
import { FESTIVALS, festivalAppearance, festivalRange, loadFestivalSettings, DEFAULT_FESTIVAL_SETTINGS, type Festival, type FestivalSettings } from "@/lib/festivals";
import {
  DEFAULT_FESTIVAL_MAILS,
  FESTIVAL_MAILS_KEY,
  FESTIVAL_MAIL_VARS,
  festivalMailContent,
  festivalMailSampleVars,
  type FestivalMailSettings,
} from "@/lib/festivalMails";

const TZ_OPTIONS = [
  { label: "India (UTC+5:30)", value: 330 },
  { label: "UTC", value: 0 },
  { label: "US Eastern (UTC-5)", value: -300 },
  { label: "UK (UTC+0)", value: 0 },
  { label: "Gulf (UTC+4)", value: 240 },
];

export default function FestivalMails() {
  const [s, setS] = useState<FestivalMailSettings>(DEFAULT_FESTIVAL_MAILS);
  const [fs, setFs] = useState<FestivalSettings>(DEFAULT_FESTIVAL_SETTINGS);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewId, setPreviewId] = useState<string>(FESTIVALS[0].id);
  const year = new Date().getFullYear();

  useEffect(() => {
    fetchKey<Partial<FestivalMailSettings>>(FESTIVAL_MAILS_KEY, {}).then((v) => setS({ ...DEFAULT_FESTIVAL_MAILS, ...v }));
    loadFestivalSettings().then(setFs).catch(() => {});
  }, []);

  const save = async (next: FestivalMailSettings) => {
    setBusy(true);
    try {
      await saveKey(FESTIVAL_MAILS_KEY, next);
      setS(next);
      toast.success("Festival mail settings saved");
    } catch (e: any) {
      toast.error(e?.message || "Could not save — sign in as admin");
    } finally {
      setBusy(false);
    }
  };

  const previewFestival = FESTIVALS.find((f) => f.id === previewId) || FESTIVALS[0];
  const preview = useMemo(() => {
    const shown = festivalAppearance(previewFestival, fs);
    const { subject, body } = festivalMailContent(s, previewFestival);
    const vars = festivalMailSampleVars(shown, shown.greeting);
    const rendered = renderMail(body, vars, false);
    const filledSubject = subject.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] || "");
    return { subject: filledSubject, html: rendered.html };
  }, [s, fs, previewFestival]);

  const sendNow = async () => {
    setSending(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch("/api/public/run-mail-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ festivals: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Send failed (${res.status})`);
      if (data.ran) {
        const line = (data.results || []).map((r: any) => r.error ? `${r.festival}: ${r.error}` : `${r.festival}: sent ${r.sent} of ${r.total}`).join(" · ");
        toast.success(line || "Festival greetings sent");
      } else {
        toast.info(data.reason === "no festival due today" ? "No festival falls today — nothing to send" : data.reason || "Nothing sent");
      }
    } catch (e: any) {
      toast.error(e?.message || "Could not send");
    } finally {
      setSending(false);
    }
  };

  const editOverride = (id: string, patch: { off?: boolean; subject?: string; body?: string }) =>
    setS((p) => ({ ...p, perFestival: { ...p.perFestival, [id]: { ...p.perFestival?.[id], ...patch } } }));

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return FESTIVALS.map((f) => ({ f, r: festivalRange(f, year, fs) }))
      .filter((x) => x.r && x.r.end >= today && !s.perFestival?.[x.f.id]?.off && !fs.disabled.includes(x.f.id))
      .sort((a, b) => (a.r!.start < b.r!.start ? -1 : 1))
      .slice(0, 4);
  }, [fs, s, year]);

  return (
    <div className="space-y-5">
      <div className="fest-hero-card rounded-2xl p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><PartyPopper className="w-6 h-6" /> Festival greeting mails</h1>
        <p className="text-sm opacity-90 mt-1">
          Automatically wishes everyone on each festival day, following the same calendar as the Festivals page.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="secondary" disabled={busy} onClick={() => save({ ...s, enabled: !s.enabled })}>
            {s.enabled ? "Turn automatic mails off" : "Turn automatic mails on"}
          </Button>
          <Button variant="secondary" disabled={sending} onClick={sendNow}>
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send today's greeting now
          </Button>
        </div>
        <p className="text-xs opacity-80 mt-3">
          {s.enabled
            ? upcoming.length
              ? `Next up: ${upcoming.map((x) => `${x.f.emoji} ${festivalAppearance(x.f, fs).name} (${x.r!.start})`).join(" · ")}`
              : `No more festivals left in ${year}.`
            : "Automatic festival mails are currently off."}
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Mail className="w-4 h-4" /> Delivery</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1 text-sm font-medium">Send at (local time)
              <Input type="time" value={s.time} onChange={(e) => setS({ ...s, time: e.target.value })} />
            </label>
            <label className="space-y-1 text-sm font-medium">Timezone
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={s.tzOffsetMinutes} onChange={(e) => setS({ ...s, tzOffsetMinutes: Number(e.target.value) })}>
                {TZ_OPTIONS.map((t, i) => <option key={`${t.label}-${i}`} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium">Sender name
              <Input value={s.senderName} maxLength={60} onChange={(e) => setS({ ...s, senderName: e.target.value })} />
            </label>
          </div>
          <div className="space-y-2 text-sm font-medium">
            <span>Who receives the greetings</span>
            <div className="flex flex-wrap gap-4 font-normal">
              {([["users", "Registered users"], ["students", "Exam students"], ["both", "Both"], ["custom", "Custom list"]] as const).map(([v, label]) => (
                <label key={v} className="flex items-center gap-2">
                  <input type="radio" checked={s.target === v} onChange={() => setS({ ...s, target: v })} /> {label}
                </label>
              ))}
            </div>
            {s.target === "custom" && (
              <Textarea rows={3} placeholder="one@example.com, two@example.com" value={s.customEmails} onChange={(e) => setS({ ...s, customEmails: e.target.value })} />
            )}
          </div>
          <Button disabled={busy} onClick={() => save(s)}><Save className="w-4 h-4 mr-2" />Save delivery settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">Default greeting template</h2>
          <p className="text-xs text-muted-foreground">
            Placeholders: {FESTIVAL_MAIL_VARS.map((v) => `{{${v}}}`).join(" ")}. Formatting: **bold**, [underline]..[/underline],
            [color=teal]..[/color], [highlight=mint]..[/highlight], [button=https://…]Label[/button], [image=https://…]Alt[/image].
          </p>
          <label className="block space-y-1 text-sm font-medium">Subject
            <Input value={s.subject} onChange={(e) => setS({ ...s, subject: e.target.value })} />
          </label>
          <label className="block space-y-1 text-sm font-medium">Body
            <Textarea rows={9} value={s.body} onChange={(e) => setS({ ...s, body: e.target.value })} />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => save(s)}><Save className="w-4 h-4 mr-2" />Save template</Button>
            <Button variant="outline" disabled={busy} onClick={() => save({ ...s, subject: DEFAULT_FESTIVAL_MAILS.subject, body: DEFAULT_FESTIVAL_MAILS.body })}>
              <RotateCcw className="w-4 h-4 mr-2" />Restore default
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium"><Eye className="w-4 h-4" /> Live preview for
              <select className="h-9 rounded-md border bg-background px-2 text-sm" value={previewId} onChange={(e) => setPreviewId(e.target.value)}>
                {FESTIVALS.map((f) => <option key={f.id} value={f.id}>{f.emoji} {festivalAppearance(f, fs).name}</option>)}
              </select>
            </div>
            <p className="text-sm"><span className="text-muted-foreground">Subject:</span> <b>{preview.subject}</b></p>
            <iframe title="Festival mail preview" sandbox="" className="w-full h-96 rounded-xl border bg-white" srcDoc={preview.html} />
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="font-semibold">Per-festival control</h2>
        <p className="text-xs text-muted-foreground">Turn a festival off to skip its mail, or give it its own subject and message. Empty fields use the default template above. Remember to save each card you change.</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {FESTIVALS.map((f: Festival) => {
            const o = s.perFestival?.[f.id] || {};
            const r = festivalRange(f, year, fs);
            const off = !!o.off || fs.disabled.includes(f.id);
            return (
              <Card key={f.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm">{f.emoji} {festivalAppearance(f, fs).name}</div>
                    <Switch aria-label={`Mail for ${f.name}`} disabled={busy || fs.disabled.includes(f.id)} checked={!o.off}
                      onCheckedChange={(v) => save({ ...s, perFestival: { ...s.perFestival, [f.id]: { ...o, off: !v } } })} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {fs.disabled.includes(f.id) ? "Disabled on the Festivals page" : r ? `Mails on ${r.start}${r.end !== r.start ? ` – ${r.end}` : ""} (${year})` : `Dates needed for ${year}`}
                  </p>
                  <label className="block space-y-1 text-xs">Custom subject (optional)
                    <Input disabled={busy || off} value={o.subject ?? ""} placeholder={s.subject} onChange={(e) => editOverride(f.id, { subject: e.target.value })} />
                  </label>
                  <label className="block space-y-1 text-xs">Custom message (optional)
                    <Textarea disabled={busy || off} rows={4} value={o.body ?? ""} placeholder="Uses the default template" onChange={(e) => editOverride(f.id, { body: e.target.value })} />
                  </label>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => save(s)}><Save className="w-3 h-3 mr-1" />Save</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchKey, saveKey } from "@/exam/lib/codexamSettings";
import { renderMail } from "@/exam/lib/mailContent";
import { SYSTEM_TEMPLATES, SYSTEM_TEMPLATES_KEY, resolveTemplate, type SystemTemplate } from "@/lib/system-mail-templates";

type Id = keyof typeof SYSTEM_TEMPLATES;

const SAMPLE_VARS: Record<string, string> = {
  email: "student@example.com",
  name: "Asha Verma",
  link: "https://example.com/verify?token=sample",
  brand: "CodeXam",
  who: "Asha Verma",
  action: "signed up",
  details: "Quick start registration",
  time: new Date().toLocaleString(),
  account: "admin@example.com",
  device: "Chrome on Windows",
  approvalUrl: "https://example.com/approve?token=sample",
};

const FORMAT_HELP: [string, string][] = [
  ["**bold text**", "Bold"],
  ["[button=https://…]Verify my email[/button]", "Button"],
  ["[link=https://…]Click here[/link]", "Link"],
  ["[underline]text[/underline]", "Underline"],
  ["[italic]text[/italic] · [strike]text[/strike]", "Italic / strike"],
  ["[color=success]text[/color] (primary, success, danger, warning, purple, teal, pink)", "Colored text"],
  ["[highlight=info]text[/highlight] (highlight, info, mint, peach, rose, lavender, sky)", "Highlighted box"],
  ["- item", "Bullet list"],
];

/** Edit the verify-email and admin-alert emails with a live preview. Empty fields fall back to the built-in text. */
export default function SystemTemplatesEditor({ only }: { only?: Id[] }) {
  const ids = (only || (Object.keys(SYSTEM_TEMPLATES) as Id[]));
  const [all, setAll] = useState<Record<string, SystemTemplate>>({});
  const [preview, setPreview] = useState<Record<string, boolean>>({});
  useEffect(() => { fetchKey(SYSTEM_TEMPLATES_KEY, {}).then((v: any) => setAll(Object.fromEntries((Object.keys(SYSTEM_TEMPLATES) as Id[]).map(id => [id, resolveTemplate(v, id)])))); }, []);
  const save = async () => { try { await saveKey(SYSTEM_TEMPLATES_KEY, all); toast.success("Email templates saved"); } catch { toast.error("Could not save"); } };
  const set = (id: Id, patch: Partial<SystemTemplate>) => setAll(a => ({ ...a, [id]: { ...a[id], ...patch } }));
  return (
    <div className="space-y-5">
      {ids.map(id => { const d = SYSTEM_TEMPLATES[id]; const t = all[id] || d; const rendered = renderMail(t.body, SAMPLE_VARS, false); return (
        <div key={id} className="space-y-2 rounded-2xl border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-2"><b className="text-sm">{d.label}</b>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setPreview(p => ({ ...p, [id]: !p[id] }))}>{preview[id] ? "Hide preview" : "Preview"}</Button>
              <Button size="sm" variant="ghost" onClick={() => set(id, { subject: d.subject, body: d.body })}>Restore default</Button>
            </div></div>
          <Input value={t.subject} onChange={e => set(id, { subject: e.target.value })} placeholder="Subject" />
          <Textarea rows={8} value={t.body} onChange={e => set(id, { body: e.target.value })} />
          <p className="text-xs text-muted-foreground">You can use: {d.vars.map(v => `{{${v}}}`).join("  ")}</p>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">Formatting codes</summary>
            <ul className="mt-1 space-y-1">{FORMAT_HELP.map(([code, label]) => <li key={label}><code className="rounded bg-muted px-1 py-0.5">{code}</code> — {label}</li>)}</ul>
          </details>
          {preview[id] && (
            <div className="rounded-xl border bg-card p-3">
              <p className="mb-2 text-xs text-muted-foreground">Subject: <b className="text-foreground">{t.subject.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => SAMPLE_VARS[k] || "")}</b></p>
              <iframe title={`${id} preview`} sandbox="" srcDoc={rendered.html} className="h-80 w-full rounded-lg border bg-white" />
            </div>
          )}
        </div>); })}
      <Button onClick={save}>Save email templates</Button>
    </div>
  );
}

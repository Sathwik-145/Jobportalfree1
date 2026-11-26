import { memo, useDeferredValue, useMemo, useRef, useState } from 'react';
import { Bold, Underline, Italic, Strikethrough, List, Highlighter, Palette, Link2, MousePointerClick, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/db-client';
import { Button } from '@/components/ui/button';
import { renderMail, scheduledExamVars, MAIL_TEXT_COLORS, MAIL_HIGHLIGHTS } from '@/exam/lib/mailContent';
import MailImagePicker from '@/exam/components/MailImagePicker';

const COLOR_LABELS: Record<string, string> = { primary: 'Blue', success: 'Green', danger: 'Red', warning: 'Orange', purple: 'Purple', teal: 'Teal', pink: 'Pink', highlight: 'Yellow', info: 'Light blue', neutral: 'Grey', mint: 'Mint green', peach: 'Peach', rose: 'Rose', lavender: 'Lavender', sky: 'Sky blue' };

/** Calls the admin AI assistant to write an email; returns subject + body. */
export async function generateMailWithAi(prompt: string, purpose?: string, variables?: string, current?: { subject: string; body: string }) {
  const { data } = await supabase.auth.getSession();
  const r = await fetch('/api/admin-assistant', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` },
    body: JSON.stringify({ action: 'email', prompt, purpose, variables, current: current?.body.trim() ? current : undefined }) });
  if (!r.ok) throw new Error(await r.text());
  return await r.json() as { subject?: string; body?: string };
}

/** "New template with AI" button: describe the email, AI writes it, onCreate saves it. */
export function AiTemplateButton({ purpose, variables, onCreate }: { purpose: string; variables?: string; onCreate: (tpl: { name: string; subject: string; body: string }) => void }) {
  const [open, setOpen] = useState(false), [name, setName] = useState(''), [prompt, setPrompt] = useState(''), [busy, setBusy] = useState(false);
  const run = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    try {
      const j = await generateMailWithAi(prompt.trim(), purpose, variables);
      if (!j.body) throw new Error('AI returned an empty email');
      onCreate({ name: name.trim() || prompt.trim().slice(0, 40), subject: j.subject || 'Update', body: j.body });
      toast.success('Template created — review it, then save.');
      setOpen(false); setName(''); setPrompt('');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'AI could not write the email'); }
    setBusy(false);
  };
  return !open ? <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}><Sparkles /> New template with AI</Button> : (
    <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-2">
      <input value={name} onChange={e => setName(e.target.value)} maxLength={60} placeholder="Template name (optional)" className="h-9 w-44 rounded-lg border bg-background px-2 text-sm" />
      <input value={prompt} onChange={e => setPrompt(e.target.value)} maxLength={2000} placeholder="Describe the email, e.g. friendly exam reminder for tomorrow" className="h-9 min-w-52 flex-1 rounded-lg border bg-background px-2 text-sm" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void run(); } }} />
      <Button type="button" size="sm" disabled={busy || !prompt.trim()} onClick={() => void run()} className="gap-1.5">{busy ? <Loader2 className="animate-spin" /> : <Sparkles />} {busy ? 'Writing…' : 'Create'}</Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  );
}

export const MailPreview = memo(function MailPreview({ body, vars }: { body: string; vars: Record<string, string> }) {
  // Deferred so typing stays fast; html only rebuilds when the content actually changes.
  const b = useDeferredValue(body);
  const key = JSON.stringify(vars);
  const v = useDeferredValue(key);
  const html = useMemo(() => renderMail(b, JSON.parse(v)).html, [b, v]);
  return <iframe title="Email content preview" sandbox="" srcDoc={html} className="w-full h-80 rounded-lg border bg-card" />;
});

const QUICK = ['Exam invitation with login details', 'Exam reminder 30 minutes before start', 'Result announcement with score and tips', 'Thank you for taking the test', 'Registration confirmation'];

/** Writes subject + body from a short prompt using the admin AI assistant. */
export function AiMailWriter({ subject, body, onSubject, onBody, purpose, variables }: { subject?: string; body: string; onSubject?: (v: string) => void; onBody: (v: string) => void; purpose?: string; variables?: string }) {
  const [open, setOpen] = useState(false), [prompt, setPrompt] = useState(''), [busy, setBusy] = useState(false);
  const run = async (text = prompt) => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const j = await generateMailWithAi(text.trim(), purpose, variables, { subject: subject || '', body });
      if (j.subject && onSubject) onSubject(j.subject);
      if (j.body) onBody(j.body);
      toast.success('Email written — review it, then send.');
      setOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'AI could not write the email'); }
    setBusy(false);
  };
  return <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
    {!open ? <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}><Sparkles /> Write with AI</Button> : <div className="space-y-2">
      <p className="text-xs font-medium text-foreground">Describe the email — AI fills the subject and message{body.trim() ? ' (it improves your current draft)' : ''}.</p>
      <div className="flex flex-wrap gap-1.5">{QUICK.map(q => <button key={q} type="button" disabled={busy} onClick={() => { setPrompt(q); run(q); }} className="rounded-full border bg-background px-2.5 py-1 text-xs text-foreground hover:bg-muted">{q}</button>)}</div>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={2} maxLength={2000} placeholder="e.g. Friendly reminder that the Java test starts tomorrow at 10 AM, ask them to keep the webcam on" className="w-full rounded-lg border bg-background p-2 text-sm text-foreground" />
      <div className="flex gap-2"><Button type="button" size="sm" disabled={busy || !prompt.trim()} onClick={() => run()} className="gap-1.5">{busy ? <Loader2 className="animate-spin" /> : <Sparkles />} {busy ? 'Writing…' : 'Generate & fill'}</Button><Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Close</Button></div>
    </div>}
  </div>;
}

export default function MailTemplateEditor({ body, onChange, preview = true, subject, onSubjectChange, purpose, variables }: { body: string; onChange: (value: string) => void; preview?: boolean; subject?: string; onSubjectChange?: (value: string) => void; purpose?: string; variables?: string }) {
  const input = useRef<HTMLTextAreaElement>(null);
  const [tone, setTone] = useState('primary');
  const [highlight, setHighlight] = useState('highlight');
  const wrap = (before: string, after = '') => {
    const el = input.current;
    if (!el) return;
    const from = el.selectionStart, to = el.selectionEnd;
    const selected = body.slice(from, to) || 'Text';
    onChange(body.slice(0, from) + before + selected + after + body.slice(to));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(from + before.length, from + before.length + selected.length); });
  };
  const insertImage = (url: string, alt: string) => {
    const el = input.current; const at = el ? el.selectionStart : body.length;
    const end = el ? el.selectionEnd : at;
    onChange(body.slice(0, at) + `${at && body[at - 1] !== '\n' ? '\n' : ''}[image=${url}]${alt}[/image]\n` + body.slice(end));
  };
  const insertLink = (kind: 'link' | 'button') => {
    const url = window.prompt(kind === 'link' ? 'Link address (https://… or {{loginUrl}})' : 'Button link (https://… or {{loginUrl}})', 'https://');
    if (!url || url === 'https://') return;
    const clean = url.trim();
    if (!/^(https?:\/\/|mailto:|\{\{\s*\w+\s*\}\})/.test(clean)) { window.alert('Links must start with https://, http://, mailto: or a {{placeholder}}'); return; }
    wrap(`[${kind}=${clean.replace(/\s+/g, '')}]`, `[/${kind}]`);
  };
  const vars = { name: 'Student', email: 'student@example.com', password: '••••••••', loginUrl: `${typeof window === 'undefined' ? '' : window.location.origin}/exam-login`, examTitle: 'Assessment', examDuration: '60 minutes', ...scheduledExamVars(null) };
  return <div className="space-y-3">
    <AiMailWriter subject={subject} body={body} onSubject={onSubjectChange} onBody={onChange} purpose={purpose} variables={variables} />
    <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Email formatting">
      <Button variant="outline" size="icon" title="Bold" aria-label="Bold" onClick={() => wrap('**', '**')}><Bold /></Button>
      <Button type="button" variant="outline" size="icon" title="Underline" aria-label="Underline" onClick={() => wrap('[underline]', '[/underline]')}><Underline /></Button>
      <Button type="button" variant="outline" size="icon" title="Italic" aria-label="Italic" onClick={() => wrap('[italic]', '[/italic]')}><Italic /></Button>
      <Button type="button" variant="outline" size="icon" title="Strikethrough" aria-label="Strikethrough" onClick={() => wrap('[strike]', '[/strike]')}><Strikethrough /></Button>
      <Button variant="outline" size="icon" title="Bullet points" aria-label="Bullet points" onClick={() => { const el = input.current; if (!el) return; const from = el.selectionStart, to = el.selectionEnd; onChange(body.slice(0, from) + (from && body[from - 1] !== '\n' ? '\n' : '') + (body.slice(from, to) || 'Point').split('\n').map(line => `- ${line}`).join('\n') + body.slice(to)); }}><List /></Button>
      <select aria-label="Text color" value={tone} onChange={e => setTone(e.target.value)} className="h-10 rounded-md border bg-background px-2 text-sm">{MAIL_TEXT_COLORS.map(c => <option key={c} value={c}>{COLOR_LABELS[c] || c}</option>)}</select>
      <Button variant="outline" size="icon" title="Apply text color" aria-label="Apply text color" onClick={() => wrap(`[color=${tone}]`, '[/color]')}><Palette /></Button>
      <select aria-label="Sentence background" value={highlight} onChange={e => setHighlight(e.target.value)} className="h-10 rounded-md border bg-background px-2 text-sm">{MAIL_HIGHLIGHTS.map(h => <option key={h} value={h}>{COLOR_LABELS[h] || h} highlight</option>)}</select>
      <Button variant="outline" size="icon" title="Highlight sentence" aria-label="Highlight sentence" onClick={() => wrap(`[highlight=${highlight}]`, '[/highlight]')}><Highlighter /></Button>
      <Button variant="outline" size="sm" title="Insert link on text" aria-label="Insert link" onClick={() => insertLink('link')} className="gap-1"><Link2 /> Link</Button>
       <MailImagePicker onInsert={insertImage} />
      <Button variant="outline" size="sm" title="Insert button link" aria-label="Insert button" onClick={() => insertLink('button')} className="gap-1"><MousePointerClick /> Button</Button>
    </div>
    <p className="text-xs text-muted-foreground">Select text, then choose a format. Links: select the words, tap Link and paste the address.</p>
    <textarea ref={input} aria-label="Email template body" rows={10} value={body} onChange={e => onChange(e.target.value)} className="w-full p-3 rounded-lg border bg-background text-sm font-mono" />
    {preview && <MailPreview body={body} vars={vars} />}
  </div>;
}
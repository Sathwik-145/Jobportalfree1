// @ts-nocheck
import "@/exam/exam-student.css";
import ExamBrandName from '@/components/ExamBrandName';
import { useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from '@/lib/router-compat';
import { Terminal, CheckCircle2, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { listLinks, decodeLink, listLinkRegs, saveLinkRegs } from '@/exam/lib/regLinks';

export const GlassShell = ({ children }) => (
  <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary/15 via-background to-accent/20 flex items-center justify-center p-4 sm:p-8">
    <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/25 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/30 blur-3xl" />
    <div className="relative w-full max-w-lg">
      <div className="surface-ink portal-banner flex items-center justify-center gap-3 mb-6 rounded-[1.5rem] bg-primary bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
        <div className="w-11 h-11 rounded-[1.5rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
          <Terminal className="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight"><ExamBrandName /></h1>
      </div>
      {children}
    </div>
  </div>
);
export const glassCard = 'bg-card border rounded-2xl shadow-xl shadow-primary/5 p-6 sm:p-8';
export const glassInput = 'w-full h-12 px-4 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/60';

export const RegSuccess = ({ email }: { email: string }) => (
  <div className={`${glassCard} text-center`}>
    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/15 flex items-center justify-center">
      <CheckCircle2 className="w-9 h-9 text-primary" />
    </div>
    <h2 className="font-display text-xl font-bold mb-2">Registration successful!</h2>
    <p className="text-sm text-muted-foreground mb-4">
      The admin will review your details and mail your login credentials to <strong className="text-foreground">{email}</strong>.
    </p>
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-6">
      <MailCheck className="w-4 h-4" /> Then sign in at the exam login page.
    </div>
    <Link to="/exam-login" className="inline-flex h-12 px-5 items-center rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">Go to exam login</Link>
  </div>
);

export default function ApplyLink() {
  const { linkId } = useParams();
  const [sp] = useSearchParams();
  const link = useMemo(() => {
    const c = sp.get('c');
    return (c && decodeLink(c)) || listLinks().find(l => l.id === linkId) || null;
  }, [sp, linkId]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ans, setAns] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  if (!link) return <GlassShell><div className={`${glassCard} text-center`}>This registration link is invalid.</div></GlassShell>;
  if (!link.active) return <GlassShell><div className={`${glassCard} text-center`}>Registrations for <b>{link.title}</b> are closed.</div></GlassShell>;
  if (done) return <GlassShell><RegSuccess email={email} /></GlassShell>;

  const submit = (e) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    const all = listLinkRegs();
    if (all.some(r => r.linkId === link.id && r.email === em)) { toast.error('You have already registered with this email.'); return; }
    all.unshift({ id: `lr_${Date.now()}`, linkId: link.id, linkTitle: link.title, name: name.trim(), email: em, answers: ans, status: 'pending', createdAt: new Date().toISOString() });
    saveLinkRegs(all);
    setDone(true);
  };

  return (
    <GlassShell>
      <div className={glassCard}>
        <h2 className="font-display text-2xl font-bold tracking-tight mb-3">{link.title}</h2>
        {link.description && <p className="text-sm text-muted-foreground mb-6 whitespace-pre-wrap">{link.description}</p>}
        <form onSubmit={submit} className="space-y-4">
          <div><label className="text-sm font-medium mb-1.5 block">Full name *</label>
            <input required maxLength={100} value={name} onChange={e => setName(e.target.value)} className={glassInput} /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Email *</label>
            <input required type="email" maxLength={255} value={email} onChange={e => setEmail(e.target.value)} className={glassInput} /></div>
          {link.fields.map(f => (
            <div key={f.key}>
              <label className="text-sm font-medium mb-1.5 block">{f.label}{f.required && ' *'}</label>
              {f.type === 'textarea'
                ? <textarea required={f.required} maxLength={1000} rows={3} value={ans[f.key] || ''} onChange={e => setAns({ ...ans, [f.key]: e.target.value })} className={`${glassInput} h-auto py-2`} />
                : <input required={f.required} type={f.type} step="any" maxLength={300} value={ans[f.key] || ''} onChange={e => setAns({ ...ans, [f.key]: e.target.value })} className={glassInput} />}
            </div>
          ))}
          <button type="submit" className="w-full h-12 rounded-xl bg-primary bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg">
            Submit registration
          </button>
        </form>
      </div>
    </GlassShell>
  );
}

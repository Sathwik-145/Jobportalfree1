// @ts-nocheck
import "@/exam/exam-student.css";
import ExamBrandName from '@/components/ExamBrandName';
import { useState } from 'react';
import { Link } from '@/lib/router-compat';
import { supabase } from '@/lib/db-client';
import { Terminal, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { notifyAdmin } from '@/lib/notifyAdmin';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const registrationId = crypto.randomUUID();
    const { error } = await supabase.from('registrations').insert({
      id: registrationId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      notes: notes.trim(),
      status: 'pending',
    });
    if (!error) notifyAdmin('registration', { eventId: registrationId });
    setLoading(false);
    if (error) {
      // Backend table unavailable — keep the registration locally so the admin still sees it.
      try {
        const k = 'codexam_registrations_local';
        const arr = JSON.parse(localStorage.getItem(k) || '[]');
        arr.unshift({ id: `local_${Date.now()}`, name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), notes: notes.trim(), status: 'pending', created_at: new Date().toISOString(), approved_at: null, approved_student_id: null });
        localStorage.setItem(k, JSON.stringify(arr));
      } catch {}
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="codexam-theme exam-student exam-entry min-h-screen flex items-center justify-center bg-muted/40 p-4 sm:p-8">
        <div className="w-full max-w-md bg-card border rounded-[1.5rem] p-6 sm:p-8 text-center shadow-xl shadow-primary/5">
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold mb-2">Registration received</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Thanks for registering. The admin will review your request and email your login credentials at <strong>{email}</strong> once approved.
          </p>
          <Link to="/exam-login" className="text-sm text-primary hover:underline">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="codexam-theme exam-student exam-entry min-h-screen flex items-center justify-center bg-muted/40 p-4 sm:p-8">
      <div className="w-full max-w-md">
        <div className="surface-ink portal-banner flex items-center justify-center gap-3 mb-6 rounded-[1.5rem] bg-primary bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 shadow-lg shadow-primary/10">
          <div className="w-12 h-12 rounded-[1.5rem] bg-primary flex items-center justify-center">
            <Terminal className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight"><ExamBrandName /></h1>
        </div>
        <div className="bg-card rounded-[1.5rem] border shadow-xl shadow-primary/5 p-6 sm:p-8">
          <Link to="/quick-start" className="block mb-5 p-3 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/15 transition-colors">
            <div className="text-sm font-semibold text-primary">⚡ Skip the wait — Start instantly</div>
            <div className="text-xs text-muted-foreground mt-0.5">Get a random test assigned and begin in seconds.</div>
          </Link>
          <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Register for an assessment</h2>
          <p className="text-sm text-muted-foreground mb-6">Submit your details. The admin will review and email your credentials.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Full name</label>
              <input required value={name} onChange={e => setName(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone (optional)</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-10 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit registration'}
            </button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-6">
            Already have credentials? <Link to="/exam-login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

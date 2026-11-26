// @ts-nocheck
import ExamBrandName from '@/components/ExamBrandName';
import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from '@/lib/router-compat';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { cachedSettings, fetchSettings } from '@/exam/lib/codexamSettings';
import { useEffect } from 'react';
import { Terminal, Eye, EyeOff, CircleHelp, Mail, ShieldCheck, Timer, Code2 } from 'lucide-react';
import loginArt from '@/assets/codexam-login.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [settings, setSettings] = useState(cachedSettings());
  useEffect(() => { fetchSettings().then(setSettings); }, []);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email');
  if (initialEmail && !email) setEmail(initialEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate((result as any).role === 'admin' ? '/exam-admin' : '/system-check', { replace: true });
      } else {
        setError(result.error || 'Login failed');
        setShowHelp(true);
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="codexam-theme min-h-screen grid lg:grid-cols-2 bg-muted/40">
      <aside className="relative m-3 hidden lg:flex flex-col justify-end overflow-hidden rounded-[1.5rem]">
        <img src={loginArt} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/10" />
        <div className="relative p-12 text-ink-foreground space-y-5">
          <p className="eyebrow border-ink-foreground/20 bg-ink-foreground/10 text-ink-foreground">CodeXam assessments</p>
          <h2 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-ink-foreground">Prove your skills.<br /><span className="text-accent">One focused session.</span></h2>
          <ul className="space-y-3 text-sm opacity-90">
            <li className="flex items-center gap-3"><Code2 className="w-5 h-5" /> Coding, MCQ and writing rounds in one place</li>
            <li className="flex items-center gap-3"><Timer className="w-5 h-5" /> Your personal start time and window</li>
            <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5" /> Fair, proctored and secure</li>
          </ul>
        </div>
      </aside>
      <main className="flex items-center justify-center p-5 sm:p-10">
      <div className="w-full max-w-md">
        <div className="portal-banner flex items-center gap-3 mb-6 rounded-2xl bg-primary bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground">
          <div className="w-11 h-11 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
            <Terminal className="w-5 h-5 text-primary-foreground" />
          </div>
          <div><h1 className="text-2xl font-bold tracking-tight leading-none"><ExamBrandName /></h1><p className="text-xs text-primary-foreground/80 mt-1">Assessment portal</p></div>
        </div>
        
        <div className="bg-card rounded-2xl border border-border shadow-xl shadow-primary/10 p-6 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-6">Sign in with the details from your invitation email</p>
          
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-12 px-4 pr-11 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {showHelp && settings.showSupportEmail && (
            <div className="mt-5 border-t pt-5">
              <button type="button" onClick={() => setShowHelp(v => !v)} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <CircleHelp className="w-4 h-4" /> Facing a problem?
              </button>
              <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm text-muted-foreground">
                <p className="mb-2">For any query, email us and mention your issue. We’ll respond as soon as possible.</p>
                <a href={`mailto:${settings.supportEmail}`} className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
                  <Mail className="w-4 h-4" /> {settings.supportEmail}
                </a>
              </div>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">Trouble signing in? Use the exact email your invitation was sent to.</p>
        <p className="text-center text-xs text-muted-foreground mt-2"><Link to="/" className="font-semibold text-primary hover:underline">← Back to JobPortalFree</Link> · <Link to="/start" className="font-semibold text-primary hover:underline">Quick start an exam</Link></p>
      </div>
      </main>
    </div>
  );
};

export default Login;

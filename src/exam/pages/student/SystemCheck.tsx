// @ts-nocheck
import "@/exam/exam-student.css";
import { useEffect, useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { X, Check, Airplay, Wifi, CheckCircle2, Eye, ArrowRight, Loader2 } from 'lucide-react';

type CheckState = 'pending' | 'running' | 'passed' | 'failed';

interface CheckItem {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  state: CheckState;
}

export default function SystemCheck() {
  const navigate = useNavigate();

  const [systemChecks, setSystemChecks] = useState<CheckItem[]>([
    { key: 'os', icon: <Airplay className="w-5 h-5" />, title: 'OS & Browser Support', description: "Your device's operating system and browser versions are being verified.", state: 'pending' },
    { key: 'net', icon: <Wifi className="w-5 h-5" />, title: 'Internet connectivity', description: 'Your internet connection is being verified.', state: 'pending' },
    { key: 'app', icon: <CheckCircle2 className="w-5 h-5" />, title: 'Application Version', description: 'The application version is being verified.', state: 'pending' },
    { key: 'proc', icon: <Eye className="w-5 h-5" />, title: 'Proctoring Support', description: 'Your device configurations are being verified to check for proctoring support.', state: 'pending' },
  ]);

  const osInfo = (() => {
    const ua = navigator.userAgent;
    if (/Mac/i.test(ua)) return 'macOS Desktop';
    if (/Windows/i.test(ua)) return 'Windows Desktop';
    if (/Linux/i.test(ua)) return 'Linux Desktop';
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad/i.test(ua)) return 'iOS';
    return 'Desktop';
  })();

  const browserInfo = (() => {
    const ua = navigator.userAgent;
    const m = ua.match(/(Chrome|Firefox|Safari|Edg)\/(\d+)/);
    if (m) return `${m[1].replace('Edg', 'Edge')} ${m[2]}`;
    return 'Modern Browser';
  })();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const keys = ['os', 'net', 'app', 'proc'];
      for (let i = 0; i < keys.length; i++) {
        if (cancelled) return;
        setSystemChecks(prev => prev.map(c => c.key === keys[i] ? { ...c, state: 'running' } : c));
        await new Promise(r => setTimeout(r, 600));
        if (cancelled) return;
        setSystemChecks(prev => prev.map(c => c.key === keys[i] ? { ...c, state: 'passed' } : c));
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const allSystemPassed = systemChecks.every(c => c.state === 'passed');
  const systemPassedCount = systemChecks.filter(c => c.state === 'passed').length;

  const handleClose = () => navigate('/exam-student');
  const handleProceed = () => { if (allSystemPassed) navigate('/exam-permissions'); };

  return (
    <div className="codexam-theme exam-student exam-preflight min-h-screen bg-muted/40 text-foreground p-4 sm:p-6 flex items-start md:items-center justify-center">
      <div className="relative w-full max-w-4xl mx-auto bg-card rounded-[1.5rem] shadow-sm border overflow-hidden">
        <nav aria-label="Exam preparation" className="exam-steps">
          <ol>
            <li aria-current="step"><span>1</span><small>System check</small></li>
            <li><span>2</span><small>Permissions</small></li>
            <li><span>3</span><small>Instructions</small></li>
            <li><span>4</span><small>Exam</small></li>
          </ol>
        </nav>
        <header className="flex h-14 items-center justify-between gap-2 border-b border-border px-4">
          <h1 className="font-display flex items-center gap-2 text-sm font-semibold"><Airplay className="h-4 w-4 text-primary" />System Check</h1>
          <div className="flex items-center gap-2">
            <span role="status" className={`text-xs ${allSystemPassed ? 'text-primary' : 'text-muted-foreground'}`}>{allSystemPassed ? 'Ready' : `Checking ${systemPassedCount} / ${systemChecks.length}`}</span>
            <button onClick={handleClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
        </header>
        <div className="grid md:grid-cols-[1fr_1.4fr]">
        <aside className="exam-device-panel surface-ink hidden md:flex flex-col items-center justify-center gap-4 border-r border-border bg-muted/30 p-6">
          <div className="w-full max-w-[240px]">
            <div className="rounded-xl border-4 border-foreground/80 bg-background aspect-[16/10] p-3 flex flex-col justify-center gap-2 shadow-sm">
              {systemChecks.map(c => (
                <div key={c.key} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${c.state === 'passed' ? 'bg-primary' : c.state === 'running' ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'}`} />
                  <span className="h-1.5 flex-1 rounded bg-muted"><span className={`block h-full rounded ${c.state === 'passed' ? 'w-full bg-primary' : c.state === 'running' ? 'w-1/2 bg-primary' : 'w-0'}`} /></span>
                </div>
              ))}
            </div>
            <div className="mx-auto h-6 w-10 bg-foreground/70" />
            <div className="mx-auto h-1.5 w-24 rounded-full bg-foreground/70" />
          </div>
          <p className="text-center text-xs text-muted-foreground">{osInfo}<br />{browserInfo}</p>
        </aside>
        <div className="p-4 sm:p-6">
          <p className="mb-4 text-xs text-muted-foreground md:hidden">{osInfo} · {browserInfo}. Use the latest browser version for the best experience.</p>
          <div className="flex flex-col">
            <div className="space-y-3 flex-1">
              {systemChecks.map(check => (
                <div
                  key={check.key}
                  className={`flex items-center gap-3 p-4 rounded-[1.5rem] border transition-colors ${
                    check.state === 'running' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    check.state === 'passed' ? 'bg-primary/10 text-primary' : 'bg-accent text-accent-foreground'
                  }`}>
                    {check.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{check.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">{check.description}</p>
                  </div>
                  <div className="shrink-0">
                    {check.state === 'passed' && (
                      <span className="text-primary text-xs font-semibold flex items-center gap-1">
                        <span className="hidden sm:inline">Verified</span>
                        <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </span>
                      </span>
                    )}
                    {check.state === 'running' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleProceed}
              disabled={!allSystemPassed}
              className="exam-primary-action btn-pill btn-pill-primary mt-6 w-full h-12 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue to Instructions
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

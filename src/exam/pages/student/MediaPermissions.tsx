// @ts-nocheck
import "@/exam/exam-student.css";
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { Camera, Mic, MonitorUp, ShieldCheck, Check, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchKey } from '@/exam/lib/codexamSettings';
import { DEFAULT_MEDIA, MEDIA_KEY } from '@/exam/components/MediaProctor';
import { grantedStreams, hasGranted, requestMedia } from '@/exam/lib/mediaSession';

/** Separate step before the instructions: the student must allow every monitoring device the admin switched on. */
export default function MediaPermissions() {
  const navigate = useNavigate();
  const [cfg, setCfg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [granted, setGranted] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchKey(MEDIA_KEY, DEFAULT_MEDIA).then(v => {
      const c = { ...DEFAULT_MEDIA, ...(v || {}) };
      if (!c.camera && !c.microphone && !c.screen) { navigate('/exam-instructions', { replace: true }); return; }
      setCfg(c); setGranted(hasGranted(c));
    });
  }, [navigate]);

  useEffect(() => {
    const s = grantedStreams().camMic;
    if (granted && cfg?.camera && video.current && s) { video.current.srcObject = s; video.current.play().catch(() => {}); }
  }, [granted, cfg]);

  if (!cfg) return <div className="codexam-theme exam-student exam-preflight min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const allow = async () => {
    setBusy(true); setError('');
    try { await requestMedia(cfg); setGranted(hasGranted(cfg)); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  const items = [
    cfg.camera && { icon: Camera, label: 'Camera', note: 'Stays on with a small live preview.' },
    cfg.microphone && { icon: Mic, label: 'Microphone', note: 'Stays on for the whole test.' },
    cfg.screen && { icon: MonitorUp, label: 'Entire screen', note: 'Choose "Entire screen" when asked.' },
  ].filter(Boolean);

  return (
    <div className="codexam-theme exam-student exam-preflight min-h-screen bg-muted/40 text-foreground p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-[1.5rem] border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <nav aria-label="Exam preparation" className="exam-steps">
          <ol>
            <li><span>1</span><small>System check</small></li>
            <li aria-current="step"><span>2</span><small>Permissions</small></li>
            <li><span>3</span><small>Instructions</small></li>
            <li><span>4</span><small>Exam</small></li>
          </ol>
        </nav>
        <div className="text-center space-y-2">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h1 className="font-display text-xl font-bold">Allow monitoring</h1>
          <p className="text-sm text-muted-foreground">This test is monitored. Allow the items below to continue to the instructions.</p>
        </div>
        <ul className="space-y-3">
          {items.map(({ icon: Icon, label, note }) => (
            <li key={label} className="flex items-center gap-3 rounded-xl border p-3">
              <Icon className="h-5 w-5 text-primary" />
              <div className="flex-1"><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{note}</p></div>
              {granted && <Check className="h-5 w-5 text-primary" />}
            </li>
          ))}
        </ul>
        {cfg.camera && <video ref={video} muted playsInline className={granted ? 'mx-auto w-48 rounded-xl border' : 'hidden'} />}
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        {granted
          ? <Button className="exam-primary-action btn-pill btn-pill-primary w-full" onClick={() => navigate('/exam-instructions')}>Continue to instructions <ArrowRight className="ml-1 h-4 w-4" /></Button>
          : <Button className="exam-primary-action btn-pill btn-pill-primary w-full" disabled={busy} onClick={allow}>{busy ? 'Waiting for permission…' : 'Allow access'}</Button>}
        <p className="text-xs text-center text-muted-foreground">If you turn any of these off during the test, the test locks until you allow it again.</p>
      </div>
    </div>
  );
}

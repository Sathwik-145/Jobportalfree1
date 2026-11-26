import { useEffect, useRef, useState } from "react";
import { Camera, Mic, MonitorUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchKey } from "@/exam/lib/codexamSettings";
import { grantedStreams, hasGranted, onMediaStopped, requestMedia, stopAll } from "@/exam/lib/mediaSession";
import { startRecording, stopRecording, type RecordingOwner } from "@/exam/lib/recordingSession";

export type MediaSettings = { camera: boolean; microphone: boolean; screen: boolean; record?: boolean };
export const DEFAULT_MEDIA: MediaSettings = { camera: false, microphone: false, screen: false, record: false };
export const MEDIA_KEY = "proctoring_media";

/** Asks for camera / microphone / screen share when the admin has switched them on for all tests. */
export default function MediaProctor({ owner }: { owner?: RecordingOwner | null } = {}) {
  const [cfg, setCfg] = useState<MediaSettings | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const streams = useRef<MediaStream[]>([]);

  useEffect(() => { fetchKey(MEDIA_KEY, DEFAULT_MEDIA).then((v: MediaSettings) => setCfg({ ...DEFAULT_MEDIA, ...(v || {}) })); }, []);
  useEffect(() => { const off = onMediaStopped(stopRecording); return () => { off(); stopRecording(); stopAll(); }; }, []);
  // Reuse the streams granted on the permissions page so the student is not asked twice.
  useEffect(() => { if (cfg && (cfg.camera || cfg.microphone || cfg.screen) && hasGranted(cfg)) adopt(cfg); }, [cfg]);

  const needed = cfg && (cfg.camera || cfg.microphone || cfg.screen);
  if (!cfg || !needed) return null;

  function adopt(c: MediaSettings) {
    const { camMic, screen } = grantedStreams();
    streams.current = [camMic, screen].filter(Boolean) as MediaStream[];
    camMic?.getTracks().forEach(t => t.addEventListener("ended", () =>
      lock(t.kind === "video" ? "Your camera was turned off. Turn it on again to continue." : "Your microphone was turned off. Turn it on again to continue.")));
    screen?.getVideoTracks()[0]?.addEventListener("ended", () => lock("Screen sharing stopped. Share your screen again to continue."));
    if (video.current && c.camera && camMic) { video.current.srcObject = camMic; video.current.play().catch(() => {}); }
    if (c.record && owner?.studentId) startRecording(owner, { camMic: c.camera || c.microphone ? camMic : null, screen: c.screen ? screen : null });
    setReady(true);
  }

  function lock(msg: string) {
    stopAll();
    streams.current = [];
    setReady(false); setError(msg);
  }

  const allow = async () => {
    setError("");
    try { await requestMedia(cfg); adopt(cfg); }
    catch (e: any) { stopAll(); streams.current = []; setError(e.message); }
  };

  return (
    <>
      {cfg.record && ready && <span className="fixed bottom-3 left-3 z-[60] flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium shadow"><span className="h-2 w-2 animate-pulse rounded-full bg-destructive" /> Recording</span>}
      <video ref={video} muted playsInline className={cfg.camera && ready ? "fixed bottom-3 right-3 z-[60] w-36 rounded-xl border-2 border-primary shadow-lg" : "hidden"} />
      {!ready && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 backdrop-blur p-4">
          <div className="max-w-md w-full rounded-2xl border bg-card p-6 shadow-xl space-y-4 text-center">
            <ShieldCheck className="w-10 h-10 mx-auto text-primary" />
            <h2 className="text-xl font-bold">This test is monitored</h2>
            <p className="text-sm text-muted-foreground">Please allow the following before you start:</p>
            <div className="flex justify-center gap-4 text-sm">
              {cfg.camera && <span className="flex items-center gap-1"><Camera className="w-4 h-4" /> Camera</span>}
              {cfg.microphone && <span className="flex items-center gap-1"><Mic className="w-4 h-4" /> Microphone</span>}
              {cfg.screen && <span className="flex items-center gap-1"><MonitorUp className="w-4 h-4" /> Screen</span>}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={allow}>Allow and continue</Button>
          </div>
        </div>
      )}
    </>
  );
}

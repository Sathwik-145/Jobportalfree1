import { useEffect, useState } from "react";
import { Camera, Mic, MonitorUp, Video } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { fetchKey, saveKey } from "@/exam/lib/codexamSettings";
import { DEFAULT_MEDIA, MEDIA_KEY, type MediaSettings } from "@/exam/components/MediaProctor";

const ITEMS = [
  ["camera", "Camera", "Students must keep their camera on. A small live preview stays on screen.", Camera],
  ["microphone", "Microphone", "Students must keep their microphone on for the whole test.", Mic],
  ["screen", "Screen sharing", "Students must share their entire screen before the test starts.", MonitorUp],
  ["record", "Save recordings", "Saves the camera and screen during the test. Watch or delete them in CodeXam admin → Monitor → Recordings.", Video],
] as const;

/** Exam-wide camera / microphone / screen-share switches, shared by the exam portal and admin controls. */
export default function ProctoringSwitches() {
  const [media, setMedia] = useState<MediaSettings>(DEFAULT_MEDIA);
  useEffect(() => { fetchKey(MEDIA_KEY, DEFAULT_MEDIA).then((m: MediaSettings) => setMedia({ ...DEFAULT_MEDIA, ...(m || {}) })); }, []);
  const save = async (m: MediaSettings) => {
    setMedia(m);
    try { await saveKey(MEDIA_KEY, m); toast.success("Saved for all tests"); } catch { toast.error("Could not save"); }
  };
  return (
    <div className="space-y-3">
      {ITEMS.map(([k, label, hint, Icon]) => (
        <label key={k} className="flex items-center justify-between gap-4 rounded-2xl border bg-muted/30 p-4 transition-colors hover:bg-muted/60">
          <span className="flex items-start gap-3">
            <span className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></span>
            <span><b className="block text-sm">{label}</b><span className="text-xs text-muted-foreground">{hint}</span></span>
          </span>
          <Switch checked={!!media[k]} onCheckedChange={v => save({ ...media, [k]: v })} />
        </label>
      ))}
      <p className="text-xs text-muted-foreground">When a switch is on, the test is locked until the student allows it, and locks again if it is turned off mid-test.</p>
    </div>
  );
}

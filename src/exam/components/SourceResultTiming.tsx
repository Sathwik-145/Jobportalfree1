import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { fetchKey, saveKey } from "@/exam/lib/codexamSettings";

import { sourceResultCfg, type SourceMode as Mode, type SourceResultCfg as Cfg } from "@/exam/lib/resultSourceDefaults";
const SOURCES = [["quick", "Quick Start students"], ["later", "\"Book your assessment for later\" students"]] as const;
const MODES: [Mode, string][] = [["default", "Use the test's own setting"], ["now", "Send right after submit"], ["later", "Send after a delay"], ["manual", "Don't send — I'll send from Reports"]];

/** Result email timing per sign-up path, saved to "result_auto_source" and read by the result mailer. */
export default function SourceResultTiming() {
  const [cfg, setCfg] = useState<Record<string, Cfg>>({});
  useEffect(() => { fetchKey("result_auto_source", {}).then((v: any) => setCfg(v || {})); }, []);
  const get = (k: string) => sourceResultCfg(cfg, k);
  const set = (k: string, p: Partial<Cfg>) => setCfg(c => { const n = { ...get(k), ...p }; n.enabled = n.mode === "now" || n.mode === "later"; if (n.mode === "now") n.delayMinutes = 0; if (n.mode === "later" && !n.delayMinutes) n.delayMinutes = 10; return { ...c, [k]: n }; });
  const save = async () => { try { await saveKey("result_auto_source", cfg); toast.success("Result timing saved"); } catch { toast.error("Could not save"); } };
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {SOURCES.map(([k, label]) => { const c = get(k); return (
          <div key={k} className="space-y-3 rounded-2xl border bg-muted/30 p-4">
            <b className="text-sm">{label}</b>
            {MODES.map(([m, l]) => (
              <label key={m} className="flex items-center gap-2 text-sm"><input type="radio" checked={c.mode === m} onChange={() => set(k, { mode: m })} /> {l}</label>
            ))}
            {c.mode === "later" && <label className="flex items-center gap-2 text-sm">Minutes after submit <Input type="number" min={1} max={10080} className="w-24" value={c.delayMinutes || 10} onChange={e => set(k, { delayMinutes: Math.max(1, +e.target.value || 1) })} /></label>}
            {c.enabled && <label className="flex items-center justify-between text-sm">Attach detailed PDF<Switch checked={c.attachPdf} onCheckedChange={v => set(k, { attachPdf: v })} /></label>}
          </div>); })}
      </div>
      <Button onClick={save}>Save result timing</Button>
    </div>
  );
}

import PresentationSettings from "@/components/PresentationSettings";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_SETTINGS, readSettings, writeSettings, SiteSettings } from "@/lib/siteSettings";
import { Save, RotateCcw } from "lucide-react";

const LandingSettings = () => {
  const { toast } = useToast();
  const [s, setS] = useState<SiteSettings>(readSettings());

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const save = async () => {
    try { await writeSettings(s); toast({ title: "Landing page updated", description: "Changes are live for visitors." }); }
    catch { toast({ title: "Could not save", variant: "destructive" }); }
  };

  const reset = async () => {
    try { await writeSettings(DEFAULT_SETTINGS); setS(DEFAULT_SETTINGS); toast({ title: "Reset to defaults" }); }
    catch { toast({ title: "Could not reset", variant: "destructive" }); }
  };

  return (
    <div className="space-y-4">
      <PresentationSettings />
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-2xl font-bold">Landing Page</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset} className="gap-1">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
          <Button size="sm" onClick={save} className="gap-1">
            <Save className="w-4 h-4" /> Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Hero</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Hero badge text</Label>
            <Input value={s.heroBadge} onChange={(e) => set("heroBadge", e.target.value)} />
          </div>
          <Label>Headline</Label><Input value={s.heroTitle} onChange={e => set('heroTitle', e.target.value)} />
          <Label>Description</Label><Input value={s.heroDescription} onChange={e => set('heroDescription', e.target.value)} />
        </CardContent>
      </Card>

      {([
        ["1", "Active Jobs"],
        ["2", "Candidates"],
        ["3", "Applications"],
      ] as const).map(([n, fallback]) => (
        <Card key={n}>
          <CardHeader><CardTitle className="text-base">Stat {n} — {fallback}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Label</Label>
              <Input value={(s as any)[`stat${n}Label`]} onChange={(e) => set(`stat${n}Label` as any, e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Subtitle</Label>
              <Input value={(s as any)[`stat${n}Sub`]} onChange={(e) => set(`stat${n}Sub` as any, e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Value override (blank = live count)</Label>
              <Input value={(s as any)[`stat${n}Override`]} onChange={(e) => set(`stat${n}Override` as any, e.target.value)} placeholder="e.g. 1200+" />
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader><CardTitle className="text-base">Stat 4 — Success Rate</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Label</Label>
            <Input value={s.stat4Label} onChange={(e) => set("stat4Label", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subtitle</Label>
            <Input value={s.stat4Sub} onChange={(e) => set("stat4Sub", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Value</Label>
            <Input value={s.stat4Value} onChange={(e) => set("stat4Value", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Saved changes are shared with visitors on every device.
      </p>
    </div>
  );
};

export default LandingSettings;
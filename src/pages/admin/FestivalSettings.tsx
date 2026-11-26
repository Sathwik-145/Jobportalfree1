import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FESTIVALS, activeFestival, shownFestival, everydayOn, festivalAppearance, startFestival, festivalRange, festivalOverride, setFestivalRange, resetFestivalRange, loadFestivalSettings, saveFestivalSettings, DEFAULT_FESTIVAL_SETTINGS, type FestivalSettings as FS } from "@/lib/festivals";
import { DAY_TEMPLATES } from "@/lib/festivals";
import FestivalArt from "@/components/FestivalArt";
import { ARTWORK_DURATIONS, validArtworkDuration } from "@/lib/festivalArtwork";
import { Play, Square, RotateCcw, Save } from "lucide-react";

export default function FestivalSettings() {
  const [s, setS] = useState<FS>(DEFAULT_FESTIVAL_SETTINGS);
  const [busy, setBusy] = useState(false);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  useEffect(() => { loadFestivalSettings().then(setS); }, []);

  const save = async (next: FS) => {
    setBusy(true);
    try { await saveFestivalSettings(next); setS(next); toast.success("Festival settings saved"); return true; }
    catch (e: any) { toast.error(e.message || "Could not save — sign in as admin"); return false; }
    finally { setBusy(false); }
  };
  const now = shownFestival(s);
  const dated = activeFestival(s);
  const chooseDay = (id: string) => {
    const on = id !== "default";
    const takeOver = on && !!dated && !s.force;
    save({ ...s, dayTemplate: id, dayThemes: on, dayOverFestival: takeOver ? true : on ? s.dayOverFestival : false })
      .then((ok) => { if (ok && takeOver && dated) toast.info(`${festivalAppearance(dated, s).name} is in its dates, so the everyday look now shows instead. Press "Use calendar" to bring the festival back.`); });
  };
  const edit = (id: string, patch: Partial<FS['custom'][string]>) => setS(p => ({ ...p, custom: { ...p.custom, [id]: { ...p.custom?.[id], ...patch } } }));

  return (
    <div className="space-y-5">
      <div className="fest-hero-card rounded-2xl p-6">
        <h1 className="text-2xl font-bold">Festivals & national days</h1>
        <p className="text-sm opacity-90 mt-1">Showing now: <b>{now ? `${now.emoji} ${festivalAppearance(now, s).name}` : everydayOn(s) ? `Everyday look · ${DAY_TEMPLATES.find(t => t.id === s.dayTemplate)?.name}` : "plain site (nothing today)"}</b></p>
        <div className="flex flex-wrap gap-2 mt-4"><Button variant="secondary" disabled={busy || !s.enabled} onClick={() => save({ ...s, enabled: false })}><Square className="w-4 h-4 mr-2" />Stop all celebrations</Button><Button variant="secondary" disabled={busy} onClick={() => save({ ...s, enabled: true, force: '', dayOverFestival: false })}>Use calendar</Button></div>
      </div>

      <Card><CardContent className="p-5 grid gap-4 sm:grid-cols-3">
        {([["enabled", "Festival looks ON"], ["showColors", "Website colours"], ["showImages", "Landing page artwork"], ["showBanner", "Top greeting bar"], ["showParticles", "Animations, moving backgrounds & hover effects"], ["dayThemes", "Everyday background animation"], ["examPages", "Show on student exam pages (sign-in, dashboard & tests)"], ["examAdminPages", "Show on exam admin pages"]] as const).map(([k, label]) => (
          <label key={k} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm font-medium">
            {label}<Switch checked={!!s[k]} disabled={busy} onCheckedChange={(v) => save({ ...s, [k]: v })} />
          </label>
        ))}
        <label className="sm:col-span-3 flex flex-wrap items-center gap-3 text-sm font-medium">Default artwork display time
          <select aria-label="Default artwork display time" disabled={busy} className="h-10 max-w-full rounded-md border bg-background px-3 text-foreground" value={s.artworkDuration ?? 5} onChange={e => save({ ...s, artworkDuration: validArtworkDuration(e.target.value === "permanent" ? "permanent" : Number(e.target.value)) })}>
            {ARTWORK_DURATIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <div className="sm:col-span-3 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div><p className="font-semibold">Everyday look</p><p className="text-xs text-muted-foreground">Shown on normal days. Pick one — it shows straight away on every page except exams.</p></div>
            <label className="flex items-center gap-2 text-xs font-medium">Show it even during festivals<Switch aria-label="Show everyday look during festivals" checked={!!s.dayOverFestival} disabled={busy || !everydayOn(s)} onCheckedChange={(v) => save({ ...s, dayOverFestival: v })} /></label>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DAY_TEMPLATES.map((t) => {
              const active = (s.dayTemplate || "stars") === t.id && (t.id === "default" || !!s.dayThemes);
              return (
                <button key={t.id} type="button" disabled={busy} aria-pressed={active} onClick={() => chooseDay(t.id)}
                  className={`group overflow-hidden rounded-xl border text-left text-xs font-semibold transition hover:-translate-y-0.5 ${active ? "border-primary ring-2 ring-primary/40" : "border-border"}`}>
                  <span className="block h-12" style={{ background: t.id === "default" ? "hsl(var(--muted))" : `linear-gradient(120deg, ${t.colors[0]}, ${t.colors[1]}, ${t.colors[2]})` }} />
                  <span className="flex items-center justify-between gap-1 px-2.5 py-2">{t.id === "default" ? "Plain (no animation)" : t.name}{active && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">On</span>}</span>
                </button>
              );
            })}
          </div>
          {dated && !now && <p className="rounded-lg bg-muted px-3 py-2 text-xs">{dated.emoji} {festivalAppearance(dated, s).name} is in its dates but paused — the everyday look is showing. Press <b>Use calendar</b> to bring it back.</p>}
          {dated && now && everydayOn(s) && <p className="rounded-lg bg-muted px-3 py-2 text-xs">{now.emoji} {festivalAppearance(now, s).name} is showing now, so the everyday look will appear after it ends — or switch on “Show it even during festivals”.</p>}
        </div>
        <div className="sm:col-span-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">Preview / always show:</span>
          <select disabled={busy} className="h-9 max-w-full rounded-md border bg-background px-2" value={s.force} onChange={(e) => save(e.target.value ? startFestival(s, e.target.value) : { ...s, force: '' })}>
            <option value="">Automatic (by date)</option>
            {FESTIVALS.map((f) => <option key={f.id} value={f.id}>{f.emoji} {festivalAppearance(f, s).name}</option>)}
          </select>
        </div>
      </CardContent></Card>

      <section className="flex flex-wrap items-end gap-3 border-b pb-4">
        <label className="space-y-1 text-sm font-medium">Calendar year
          <Input aria-label="Calendar year" className="w-28" type="number" min={1900} max={9998} value={year} onChange={e => { const value = Number(e.target.value); if (Number.isInteger(value) && value >= 1900 && value <= 9998) setYear(value); }} />
        </label>
        <Button variant="outline" disabled={busy} onClick={() => setYear(year + 1)} aria-label="Next calendar year">Next year</Button>
        <Button variant="outline" onClick={() => setYear(currentYear)}>Current year</Button>
        <Button disabled={busy} onClick={() => save(s)}><Save className="w-4 h-4 mr-2" />Save dates</Button>
        <p className="w-full text-sm text-muted-foreground">Current-year calendar: automatic. Lunar dates are available for 2026–2027; later years need confirmed dates. Eid dates depend on local moon sighting.</p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {FESTIVALS.map((f) => {
          const r = festivalRange(f, year, s);
          const on = !s.disabled.includes(f.id);
          const shown = festivalAppearance(f, s);
          const custom = s.custom?.[f.id];
          return (
            <Card key={f.id} className="overflow-hidden">
              <FestivalArt festival={shown} image={custom?.image} />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">{f.emoji} {shown.name}</div>
                  <Switch aria-label={`Enable ${shown.name}`} disabled={busy} checked={on} onCheckedChange={(v) => save({ ...s, force: !v && s.force === f.id ? '' : s.force, disabled: v ? s.disabled.filter((x) => x !== f.id) : [...s.disabled, f.id] })} />
                </div>
                <label className="block space-y-1 text-xs">Festival name<Input value={custom?.name ?? f.name} onChange={e => edit(f.id, { name: e.target.value })} /></label>
                <label className="block space-y-1 text-xs">Greeting<Input value={custom?.greeting ?? f.greeting} onChange={e => edit(f.id, { greeting: e.target.value })} /></label>
                <label className="block space-y-1 text-xs">Artwork display time
                  <select aria-label={`${shown.name} artwork display time`} disabled={busy} className="h-10 w-full rounded-md border bg-background px-2 text-foreground" value={custom?.artworkDuration ?? "default"} onChange={e => edit(f.id, { artworkDuration: e.target.value === "default" ? undefined : validArtworkDuration(e.target.value === "permanent" ? "permanent" : Number(e.target.value)) })}>
                    <option value="default">Use default display time</option>
                    {ARTWORK_DURATIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <div className="flex gap-3">{shown.colors.map((color, i) => <label key={i} className="text-xs space-y-1">Colour {i + 1}<input type="color" aria-label={`${shown.name} colour ${i + 1}`} className="block h-9 w-12 cursor-pointer rounded border" value={color.startsWith('#') ? color : ['#c44c28', '#efbe45', '#a62b67'][i]} onChange={e => { const colors: [string, string, string] = [...shown.colors]; colors[i] = e.target.value; edit(f.id, { colors }); }} /></label>)}</div>
                <label className="block space-y-1 text-xs">Artwork URL (HTTPS)<Input value={custom?.image ?? ''} placeholder="Use default festival artwork" onChange={e => edit(f.id, { image: e.target.value })} /></label>
                <label className="block space-y-1 text-xs">Upload artwork (image or GIF, up to 1 MB)<Input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (!file.type.startsWith('image/') || file.size > 1024 * 1024) { toast.error('Choose an image smaller than 1 MB'); return; } const reader = new FileReader(); reader.onload = () => edit(f.id, { image: String(reader.result) }); reader.readAsDataURL(file); }} /></label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs">From<Input disabled={busy} aria-label={`${shown.name} start date`} type="date" min={`${year}-01-01`} max={`${year}-12-31`} value={r?.start || ""} onChange={(e) => setS(setFestivalRange(s, f.id, year, { start: e.target.value, end: r?.end || e.target.value }))} /></label>
                  <label className="text-xs">Until<Input disabled={busy} aria-label={`${shown.name} end date`} type="date" min={r?.start || `${year}-01-01`} value={r?.end || ""} onChange={(e) => setS(setFestivalRange(s, f.id, year, { start: r?.start || e.target.value, end: e.target.value }))} /></label>
                </div>
                <p className="text-xs text-muted-foreground">{festivalOverride(f, year, s) ? `Manual dates · ${year}` : r ? `Calendar dates · ${year}` : `Dates needed · ${year}`}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => save(s)}><Save className="w-3 h-3 mr-1" />Save</Button>
                  {festivalOverride(f, year, s) && <Button size="sm" variant="ghost" disabled={busy} onClick={() => save(resetFestivalRange(s, f.id, year))}>Use calendar dates</Button>}
                  <Button size="sm" disabled={busy} onClick={() => save(startFestival(s, f.id))}><Play className="w-3 h-3 mr-1" />Start now</Button>
                  {now?.id === f.id && <Button size="sm" variant="outline" disabled={busy} onClick={() => save({ ...s, force: '', disabled: [...new Set([...s.disabled, f.id])] })}><Square className="w-3 h-3 mr-1" />Stop</Button>}
                  {custom && <Button size="icon" variant="ghost" aria-label={`Restore ${f.name} appearance`} title="Restore default appearance" disabled={busy} onClick={() => { const c = { ...s.custom }; delete c[f.id]; save({ ...s, custom: c }); }}><RotateCcw className="w-4 h-4" /></Button>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

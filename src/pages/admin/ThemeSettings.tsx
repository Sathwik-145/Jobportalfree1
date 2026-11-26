import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Palette, Upload, RotateCcw, Image as ImageIcon } from "lucide-react";
import {
  DEFAULT_THEME,
  hexToHslString,
  hslStringToHex,
  readTheme,
  readableOn,
  writeTheme,
  saveSharedTheme,
  type ThemeSettings as TS,
} from "@/lib/themeSettings";
import defaultLogo from "@/assets/logo.png";

const ThemeSettings = () => {
  const { toast } = useToast();
  const [theme, setTheme] = useState<TS>(() => readTheme());
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<TS>) => setTheme((t) => ({ ...t, ...patch }));

  const save = async () => {
    try {
      await saveSharedTheme(theme);
      toast({ title: "Theme saved for everyone", description: "Your brand colors and logo are live across the site." });
    } catch (e) {
      writeTheme(theme);
      toast({ title: "Could not save online", description: e instanceof Error ? e.message : "Saved on this device only.", variant: "destructive" });
    }
  };

  const reset = () => {
    setTheme(DEFAULT_THEME);
    saveSharedTheme(DEFAULT_THEME).catch(() => writeTheme(DEFAULT_THEME));
    toast({ title: "Reset to defaults" });
  };

  const handleLogoUpload = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please choose an image under 2MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = String(e.target?.result || "");
      update({ logoDataUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
    const hex = hslStringToHex(value);
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="color"
              value={hex}
              onChange={(e) => onChange(hexToHslString(e.target.value))}
              className="w-14 h-14 rounded-xl border-2 border-border cursor-pointer transition-transform hover:scale-105"
              style={{ background: hex }}
            />
          </div>
          <div className="flex-1 space-y-1">
            <div className="text-xs text-muted-foreground">Preview</div>
            <div className="h-10 rounded-lg shadow-inner border" style={{ background: `hsl(${value})` }} />
          </div>
          <div className="text-xs font-mono text-muted-foreground w-24 text-right">{hex.toUpperCase()}</div>
        </div>
      </div>
    );
  };

  const currentLogo = theme.logoDataUrl || defaultLogo;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <Palette className="w-6 h-6 text-primary" />
        <h2 className="font-display text-xl md:text-2xl font-bold">Theme &amp; Branding</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="text-base">Brand Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ColorField label="Primary" value={theme.primary} onChange={(v) => update({ primary: v })} />
            <ColorField label="Secondary" value={theme.secondary} onChange={(v) => update({ secondary: v })} />
            <ColorField label="Accent" value={theme.accent} onChange={(v) => update({ accent: v })} />
            <ColorField label="Feature panels (home card, page headers, admin menu)" value={theme.panel || DEFAULT_THEME.panel || theme.primary} onChange={(v) => update({ panel: v })} />
            <div className="surface-ink p-4" style={{ background: `hsl(${theme.panel || DEFAULT_THEME.panel || theme.primary})`, color: `hsl(${readableOn(theme.panel || DEFAULT_THEME.panel || theme.primary)})` }}>
              <p className="text-sm font-semibold">Panel preview — text colour adjusts automatically</p>
            </div>

            <div className="pt-2 rounded-xl border bg-muted/40 p-4">
              <div className="text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wider">Live preview</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-accent-foreground" style={{ background: `hsl(${theme.accent})` }}>
                  Accent badge
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Brand Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-2 border-dashed border-border">
              <div className="logo-ring w-28 h-28 mb-3">
                <img src={currentLogo} alt="Brand logo" className="w-full h-full rounded-full object-cover bg-card" />
              </div>
              <p className="text-xs text-muted-foreground">PNG/SVG/JPG • max 2MB • square works best</p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleLogoUpload(f);
              }}
            />

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => fileRef.current?.click()} className="gap-2">
                <Upload className="w-4 h-4" /> Upload new logo
              </Button>
              {theme.logoDataUrl && (
                <Button variant="outline" onClick={() => update({ logoDataUrl: "" })}>
                  Use default
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 mt-6">
        <Button onClick={save} size="lg" className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
          <Palette className="w-4 h-4" /> Save theme
        </Button>
        <Button onClick={reset} variant="outline" className="gap-2">
          <RotateCcw className="w-4 h-4" /> Reset to defaults
        </Button>
      </div>
    </div>
  );
};

export default ThemeSettings;

import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";

/**
 * Admin-editable brand theme: primary color, accent color, and a custom logo.
 * Stored in shared site settings, with a local display cache. Applied at runtime
 * by overriding CSS custom properties on :root, so every existing utility
 * (bg-primary, text-accent, etc.) instantly picks up the new colors.
 */

export interface ThemeSettings {
  primary: string;   // "H S% L%" (matches the format used in styles.css)
  accent: string;
  secondary: string;
  panel?: string;    // feature panels (One portal card, page headers); admin side menus use the site card colour
  logoDataUrl: string; // data: URL or "" for the bundled default
}

export const DEFAULT_THEME: ThemeSettings = {
  primary: "226 71% 42%",
  accent: "18 94% 56%",
  secondary: "162 63% 38%",
  panel: "0 0% 100%",
  logoDataUrl: "",
};

const KEY = "jpf:theme-settings:v1";
const EVENT = "jpf:theme-settings-changed";

/** Refresh former built-in dark panels; preserve other admin-selected colours. */
export function normalizeTheme(value: Partial<ThemeSettings>): ThemeSettings {
  return { ...DEFAULT_THEME, ...value, panel: !value.panel || ["198 62% 19%", "226 71% 42%", "212 75% 92%", "212 58% 72%"].includes(value.panel) ? DEFAULT_THEME.panel : value.panel };
}

export function readTheme(): ThemeSettings {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_THEME;
    return normalizeTheme(JSON.parse(raw));
  } catch {
    return DEFAULT_THEME;
  }
}

/** Loads the theme everyone sees from the shared site settings, then caches it locally. */
export async function loadSharedTheme(): Promise<ThemeSettings> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", "theme").maybeSingle();
  const local = readTheme();
  if (!data?.value) return local;
  const next = normalizeTheme(data.value as Partial<ThemeSettings>);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  applyTheme(next);
  window.dispatchEvent(new CustomEvent(EVENT));
  return next;
}

/** Saves for every visitor; throws if the online save fails. */
export async function saveSharedTheme(next: ThemeSettings) {
  const { error } = await supabase.from("site_settings").upsert({ key: "theme", value: next as any, updated_at: new Date().toISOString() });
  if (error) throw error;
  writeTheme(next);
}

export function writeTheme(next: ThemeSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  applyTheme(next);
  window.dispatchEvent(new CustomEvent(EVENT));
}

const THEMED_VARS = [
  "--primary", "--accent", "--secondary", "--ring", "--ink", "--sidebar-background", "--ink-foreground",
  "--sidebar-foreground", "--primary-foreground", "--accent-foreground", "--secondary-foreground",
  "--sidebar-primary", "--sidebar-primary-foreground", "--sidebar-accent", "--sidebar-accent-foreground", "--sidebar-border",
];

/** Brand colours brightened enough to read on the dark background. */
export function forDarkMode(hsl: string, minLightness = 60): string {
  const m = hsl.trim().match(/^(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!m) return hsl;
  const l = Math.max(Number(m[3]), minLightness);
  return `${m[1]} ${m[2]}% ${Math.min(l, 82)}%`;
}

/** The CSS variables for one mode. Light mode uses the admin's panel colour; dark mode keeps dark panels. */
export function themeVars(t: ThemeSettings, mode: "light" | "dark"): Record<string, string> {
  const primary = mode === "dark" ? forDarkMode(t.primary) : t.primary;
  const accent = mode === "dark" ? forDarkMode(t.accent, 58) : t.accent;
  const secondary = mode === "dark" ? forDarkMode(t.secondary, 46) : t.secondary;
  const vars: Record<string, string> = {
    "--primary": primary,
    "--accent": accent,
    "--secondary": secondary,
    "--ring": primary,
    // Text on each colour flips automatically between light and dark for readability.
    "--primary-foreground": readableOn(primary),
    "--accent-foreground": readableOn(accent),
    "--secondary-foreground": readableOn(secondary),
    "--sidebar-primary": primary,
    "--sidebar-primary-foreground": readableOn(primary),
  };
  if (mode === "light") {
    const panel = t.panel || DEFAULT_THEME.panel || t.primary;
    Object.assign(vars, {
      "--ink": panel,
      "--sidebar-background": panel,
      "--ink-foreground": readableOn(panel),
      "--sidebar-foreground": readableOn(panel),
      "--sidebar-accent": panel,
      "--sidebar-accent-foreground": readableOn(panel),
      "--sidebar-border": readableOn(panel),
    });
  }
  return vars;
}

const block = (sel: string, vars: Record<string, string>) =>
  `${sel}{${Object.entries(vars).map(([k, v]) => `${k}:${v};`).join("")}}`;

export function applyTheme(t: ThemeSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  // Older versions wrote these inline, which pinned light panels even in dark mode.
  THEMED_VARS.forEach((v) => root.style.removeProperty(v));
  let tag = document.getElementById("jpf-theme-vars") as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "jpf-theme-vars";
    document.head.appendChild(tag);
  }
  tag.textContent = block(":root:not(.dark)", themeVars(t, "light")) + block(":root.dark", themeVars(t, "dark"));
}

/** Returns a light or dark HSL triplet that contrasts with the given HSL colour. */
export function readableOn(hsl: string): string {
  const hex = hslStringToHex(hsl).slice(1);
  const ch = [0, 2, 4].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const lum = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  const luminance = (colour: string) => {
    const rgb = hslStringToHex(colour).slice(1);
    const values = [0, 2, 4].map(i => {
      const v = parseInt(rgb.slice(i, i + 2), 16) / 255;
      return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
    });
    return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
  };
  const dark = "228 42% 12%", light = "36 33% 97%";
  const contrast = (other: number) => (Math.max(lum, other) + .05) / (Math.min(lum, other) + .05);
  return contrast(luminance(dark)) >= contrast(luminance(light)) ? dark : light;
}

export function useThemeSettings(): [ThemeSettings, (n: ThemeSettings) => void] {
  const [t, setT] = useState<ThemeSettings>(DEFAULT_THEME);
  useEffect(() => {
    setT(readTheme());
    const h = () => setT(readTheme());
    window.addEventListener(EVENT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(EVENT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return [t, writeTheme];
}

export function useBrandLogo(fallback: string): string {
  const [src, setSrc] = useState(fallback);
  useEffect(() => {
    const sync = () => {
      const t = readTheme();
      setSrc(t.logoDataUrl || fallback);
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [fallback]);
  return src;
}

/* ---------- color helpers ---------- */

export function hexToHslString(hex: string): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let H = 0, S = 0;
  const L = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    S = L > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: H = (g - b) / d + (g < b ? 6 : 0); break;
      case g: H = (b - r) / d + 2; break;
      case b: H = (r - g) / d + 4; break;
    }
    H *= 60;
  }
  return `${Math.round(H)} ${Math.round(S * 100)}% ${Math.round(L * 100)}%`;
}

export function hslStringToHex(hsl: string): string {
  const m = hsl.match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  if (!m) return "#000000";
  const h = parseFloat(m[1]) / 360;
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

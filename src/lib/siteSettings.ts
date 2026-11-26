import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";

/**
 * Lightweight admin-editable site settings. Stored in localStorage so admins
 * can tweak the landing copy without needing a database round-trip. A future
 * pass can swap this for a `site_settings` table in Supabase — the API
 * stays identical so the call sites won't change.
 */

export interface SiteSettings {
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  stat1Label: string;
  stat1Sub: string;
  stat1Override: string; // "" means use live count
  stat2Label: string;
  stat2Sub: string;
  stat2Override: string;
  stat3Label: string;
  stat3Sub: string;
  stat3Override: string;
  stat4Label: string;
  stat4Sub: string;
  stat4Value: string; // success rate is static, fully editable
  landingTemplate: string; // id from LANDING_TEMPLATES
}

export const DEFAULT_SETTINGS: SiteSettings = {
  heroBadge: "India's free job discovery platform",
  heroTitle: "Find your dream job in minutes.",
  heroDescription: "Browse verified openings, apply with one click, and track every application — all in one dashboard.",
  stat1Label: "Active Jobs",
  stat1Sub: "Updated today",
  stat1Override: "",
  stat2Label: "Candidates",
  stat2Sub: "Verified",
  stat2Override: "",
  stat3Label: "Applications",
  stat3Sub: "Tracked live",
  stat3Override: "19",
  stat4Label: "Success Rate",
  stat4Sub: "Hire-to-apply",
  stat4Value: "92%",
  landingTemplate: "classic",
};

const KEY = "jpf:site-settings:v1";
const EVENT = "jpf:site-settings-changed";

export function readSettings(): SiteSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function writeSettings(next: SiteSettings) {
  const { error } = await supabase.from('site_settings').upsert({ key: 'landing', value: next as any, updated_at: new Date().toISOString() });
  if (error) throw error;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useSiteSettings(): SiteSettings {
  const [s, setS] = useState<SiteSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    setS(readSettings());
    supabase.from('site_settings').select('value').eq('key', 'landing').maybeSingle().then(({ data }) => { if (data?.value) { const next = { ...DEFAULT_SETTINGS, ...(data.value as any) }; setS(next); window.localStorage.setItem(KEY, JSON.stringify(next)); } });
    const handler = () => setS(readSettings());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return s;
}
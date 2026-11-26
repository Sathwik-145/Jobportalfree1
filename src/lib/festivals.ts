// Indian festivals + national days. Fixed-date days repeat every year (MM-DD);
// lunar festivals list their date per year. Admin can override dates & toggle each.
import { supabase } from "@/lib/db-client";
import { useEffect, useState } from "react";
import type { ArtworkDuration } from "./festivalArtwork";

export interface Festival {
  id: string;
  name: string;
  greeting: string;
  emoji: string;
  particles: string[];
  colors: [string, string, string]; // oklch gradient stops
  fixed?: string; // "MM-DD"
  dates?: Record<number, string>; // year -> "YYYY-MM-DD"
  before?: number; // days shown before
  after?: number; // days shown after
}

export const FESTIVALS: Festival[] = [
  { id: "newyear", name: "New Year", greeting: "Happy New Year!", emoji: "🎆", particles: ["🎉", "✨", "🎊"], colors: ["oklch(0.62 0.22 290)", "oklch(0.7 0.2 350)", "oklch(0.82 0.16 85)"], fixed: "01-01", before: 1, after: 1 },
  { id: "sankranti", name: "Sankranti / Pongal", greeting: "Happy Makar Sankranti & Pongal!", emoji: "🪁", particles: ["🪁", "🌾", "☀️"], colors: ["oklch(0.78 0.17 70)", "oklch(0.68 0.2 35)", "oklch(0.72 0.16 145)"], fixed: "01-14", before: 1, after: 2 },
  { id: "republic", name: "Republic Day", greeting: "Happy Republic Day! 🇮🇳", emoji: "🇮🇳", particles: ["🇮🇳", "🧡", "🤍", "💚"], colors: ["oklch(0.72 0.18 50)", "oklch(0.97 0 0)", "oklch(0.55 0.16 150)"], fixed: "01-26", before: 1, after: 0 },
  { id: "shivaratri", name: "Maha Shivaratri", greeting: "Har Har Mahadev! Happy Maha Shivaratri", emoji: "🔱", particles: ["🔱", "🌙", "✨"], colors: ["oklch(0.4 0.12 260)", "oklch(0.55 0.15 230)", "oklch(0.85 0.05 250)"], dates: { 2026: "2026-02-15", 2027: "2027-03-06" } },
  { id: "holi", name: "Holi", greeting: "Happy Holi! Play with colours 🎨", emoji: "🎨", particles: ["🟣", "🟡", "🟢", "🔴", "🔵"], colors: ["oklch(0.65 0.25 350)", "oklch(0.85 0.17 95)", "oklch(0.65 0.2 200)"], dates: { 2026: "2026-03-04", 2027: "2027-03-22" }, before: 1, after: 1 },
  { id: "ugadi", name: "Ugadi / Gudi Padwa", greeting: "Ugadi Subhakankshalu! Happy New Year", emoji: "🥭", particles: ["🥭", "🌿", "🌼"], colors: ["oklch(0.72 0.17 145)", "oklch(0.82 0.16 90)", "oklch(0.7 0.18 50)"], dates: { 2026: "2026-03-19", 2027: "2027-04-07" }, before: 1, after: 1 },
  { id: "eid", name: "Eid ul-Fitr", greeting: "Eid Mubarak! 🌙", emoji: "🌙", particles: ["🌙", "⭐", "✨"], colors: ["oklch(0.5 0.13 165)", "oklch(0.7 0.12 175)", "oklch(0.85 0.12 90)"], dates: { 2026: "2026-03-20", 2027: "2027-03-10" } },
  { id: "ramnavami", name: "Sri Rama Navami", greeting: "Happy Sri Rama Navami!", emoji: "🏹", particles: ["🏹", "🌼", "🪔"], colors: ["oklch(0.72 0.18 55)", "oklch(0.82 0.15 85)", "oklch(0.6 0.2 30)"], dates: { 2026: "2026-03-26", 2027: "2027-04-15" } },
  { id: "ambedkar", name: "Ambedkar Jayanti", greeting: "Remembering Dr. B.R. Ambedkar", emoji: "📘", particles: ["📘", "✨"], colors: ["oklch(0.5 0.17 260)", "oklch(0.65 0.14 240)", "oklch(0.9 0.04 250)"], fixed: "04-14", before: 0, after: 0 },
  { id: "bakrid", name: "Eid al-Adha", greeting: "Eid al-Adha Mubarak!", emoji: "🌙", particles: ["🌙", "⭐"], colors: ["oklch(0.5 0.13 165)", "oklch(0.7 0.12 175)", "oklch(0.85 0.12 90)"], dates: { 2026: "2026-05-27", 2027: "2027-05-17" } },
  { id: "independence", name: "Independence Day", greeting: "Happy Independence Day! Jai Hind 🇮🇳", emoji: "🇮🇳", particles: ["🇮🇳", "🧡", "🤍", "💚"], colors: ["oklch(0.72 0.18 50)", "oklch(0.97 0 0)", "oklch(0.55 0.16 150)"], fixed: "08-15", before: 2, after: 0 },
  { id: "onam", name: "Onam", greeting: "Happy Onam!", emoji: "🌸", particles: ["🌸", "🌼", "🍃"], colors: ["oklch(0.8 0.16 85)", "oklch(0.7 0.19 45)", "oklch(0.68 0.17 145)"], dates: { 2026: "2026-08-26", 2027: "2027-09-12" } },
  { id: "rakhi", name: "Raksha Bandhan", greeting: "Happy Raksha Bandhan!", emoji: "🧶", particles: ["🧶", "💛", "✨"], colors: ["oklch(0.7 0.2 20)", "oklch(0.82 0.16 80)", "oklch(0.7 0.18 330)"], dates: { 2026: "2026-08-28", 2027: "2027-08-17" } },
  { id: "janmashtami", name: "Krishna Janmashtami", greeting: "Happy Janmashtami!", emoji: "🪈", particles: ["🪈", "🦚", "🧈"], colors: ["oklch(0.5 0.15 250)", "oklch(0.65 0.15 190)", "oklch(0.82 0.15 90)"], dates: { 2026: "2026-09-04", 2027: "2027-08-25" } },
  { id: "teachers", name: "Teachers' Day", greeting: "Happy Teachers' Day! Thank you, gurus", emoji: "🍎", particles: ["📚", "🍎", "✏️"], colors: ["oklch(0.65 0.18 30)", "oklch(0.8 0.14 85)", "oklch(0.6 0.14 250)"], fixed: "09-05", before: 0, after: 0 },
  { id: "ganesh", name: "Ganesh Chaturthi", greeting: "Ganpati Bappa Morya! 🐘", emoji: "🐘", particles: ["🌺", "🪔", "🍬"], colors: ["oklch(0.7 0.2 40)", "oklch(0.82 0.16 85)", "oklch(0.6 0.22 15)"], dates: { 2026: "2026-09-14", 2027: "2027-09-04" }, before: 1, after: 2 },
  { id: "gandhi", name: "Gandhi Jayanti", greeting: "Remembering Bapu on Gandhi Jayanti", emoji: "🕊️", particles: ["🕊️", "🤍"], colors: ["oklch(0.72 0.18 50)", "oklch(0.97 0 0)", "oklch(0.55 0.16 150)"], fixed: "10-02", before: 0, after: 0 },
  { id: "bathukamma", name: "Bathukamma", greeting: "Happy Bathukamma! 🌼", emoji: "🌼", particles: ["🌼", "🌸", "🌺", "🌻"], colors: ["oklch(0.82 0.16 95)", "oklch(0.68 0.22 350)", "oklch(0.65 0.2 300)"], dates: { 2026: "2026-10-10", 2027: "2027-09-30" }, before: 0, after: 8 },
  { id: "dussehra", name: "Dussehra / Vijayadashami", greeting: "Happy Dussehra! Victory of good over evil", emoji: "🏹", particles: ["🏹", "🔥", "🌼", "✨"], colors: ["oklch(0.68 0.21 35)", "oklch(0.8 0.17 75)", "oklch(0.55 0.2 20)"], dates: { 2026: "2026-10-20", 2027: "2027-10-09" }, before: 2, after: 1 },
  { id: "diwali", name: "Diwali", greeting: "Happy Diwali! May lights fill your life 🪔", emoji: "🪔", particles: ["🪔", "✨", "🎆", "🌟"], colors: ["oklch(0.75 0.18 65)", "oklch(0.6 0.22 25)", "oklch(0.5 0.2 330)"], dates: { 2026: "2026-11-08", 2027: "2027-10-29" }, before: 3, after: 2 },
  { id: "childrens", name: "Children's Day", greeting: "Happy Children's Day!", emoji: "🎈", particles: ["🎈", "🌹", "⭐"], colors: ["oklch(0.72 0.18 20)", "oklch(0.8 0.15 90)", "oklch(0.68 0.16 230)"], fixed: "11-14", before: 0, after: 0 },
  { id: "gurunanak", name: "Guru Nanak Jayanti", greeting: "Happy Gurpurab!", emoji: "🪯", particles: ["🪔", "✨"], colors: ["oklch(0.72 0.18 60)", "oklch(0.55 0.15 250)", "oklch(0.85 0.12 85)"], dates: { 2026: "2026-11-24", 2027: "2027-11-14" } },
  { id: "christmas", name: "Christmas", greeting: "Merry Christmas! 🎄", emoji: "🎄", particles: ["❄️", "🎁", "⭐", "🎄"], colors: ["oklch(0.55 0.2 25)", "oklch(0.5 0.14 150)", "oklch(0.85 0.12 90)"], fixed: "12-25", before: 3, after: 1 },
];

export interface FestivalSettings {
  enabled: boolean;
  force: string; // "" = auto by date, otherwise festival id (preview / always show)
  disabled: string[];
  overrides: Record<string, { start: string; end: string }>; // custom date ranges
  yearlyOverrides?: Record<string, Record<string, { start: string; end: string }>>;
  showBanner: boolean;
  showParticles: boolean;
  showColors: boolean;
  showImages: boolean;
  artworkDuration?: ArtworkDuration;
  dayThemes?: boolean; // animated background on ordinary (non-festival) days
  dayTemplate?: string; // id from DAY_TEMPLATES
  dayOverFestival?: boolean; // show the everyday look even while a festival is in its dates
  examPages?: boolean; // festival/everyday look on student exam pages (sign-in, dashboard, tests); off by default
  examAdminPages?: boolean; // festival/everyday look on CodeXam admin pages; on by default
  custom: Record<string, { name?: string; greeting?: string; image?: string; colors?: [string, string, string]; artworkDuration?: ArtworkDuration }>;
}
export const DEFAULT_FESTIVAL_SETTINGS: FestivalSettings = { enabled: true, force: "", disabled: [], overrides: {}, showBanner: true, showParticles: true, showColors: true, showImages: true, artworkDuration: 5, dayThemes: false, dayTemplate: "stars", examPages: false, examAdminPages: true, custom: {} };

export function festivalAppearance(f: Festival, s: FestivalSettings): Festival {
  const custom = s.custom?.[f.id];
  return { ...f, name: custom?.name?.trim() || f.name, greeting: custom?.greeting?.trim() || f.greeting, colors: custom?.colors || f.colors };
}

export function startFestival(s: FestivalSettings, id: string): FestivalSettings {
  return { ...s, enabled: true, force: id, dayOverFestival: false, disabled: s.disabled.filter(x => x !== id) };
}

/** True when an animated everyday look is switched on (a real template, not "default"). */
export const everydayOn = (s: FestivalSettings) => !!s.dayThemes && dayTemplate(s.dayTemplate).id !== "default";

/** The festival the site actually shows: none while the admin keeps the everyday look in front. */
export function shownFestival(s: FestivalSettings, today = new Date()): Festival | null {
  if (!s.force && s.dayOverFestival && everydayOn(s)) return null;
  return activeFestival(s, today);
}

export function useFestival() {
  const [settings, setSettings] = useState(DEFAULT_FESTIVAL_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = () => loadFestivalSettings().then(s => { if (alive) { setSettings(s); setLoaded(true); } }).catch(() => {});
    load();
    const timer = window.setInterval(load, 60000);
    window.addEventListener("jpf:festivals-changed", load);
    return () => { alive = false; window.clearInterval(timer); window.removeEventListener("jpf:festivals-changed", load); };
  }, []);
  const selected = loaded ? shownFestival(settings) : null;
  return { settings, festival: selected ? festivalAppearance(selected, settings) : null };
}

const day = 86400000;
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function festivalOverride(f: Festival, year: number, s?: FestivalSettings) {
  const annual = s?.yearlyOverrides?.[String(year)]?.[f.id];
  if (annual) return annual;
  const legacy = s?.overrides?.[f.id];
  return legacy?.start.startsWith(`${year}-`) ? legacy : undefined;
}

export function setFestivalRange(s: FestivalSettings, id: string, year: number, range: { start: string; end: string }): FestivalSettings {
  return { ...s, yearlyOverrides: { ...s.yearlyOverrides, [year]: { ...s.yearlyOverrides?.[year], [id]: range } } };
}

export function resetFestivalRange(s: FestivalSettings, id: string, year: number): FestivalSettings {
  const annual = { ...s.yearlyOverrides?.[year] };
  delete annual[id];
  const legacy = { ...s.overrides };
  if (legacy[id]?.start.startsWith(`${year}-`)) delete legacy[id];
  return { ...s, overrides: legacy, yearlyOverrides: { ...s.yearlyOverrides, [year]: annual } };
}

export function validateFestivalDates(s: FestivalSettings) {
  const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  const check = (r: { start: string; end: string }) => {
    if (!valid(r.start) || !valid(r.end)) throw new Error('Choose both valid festival dates');
    if (r.start > r.end) throw new Error('The end date must be on or after the start date');
  };
  Object.values(s.overrides).forEach(check);
  for (const [year, ranges] of Object.entries(s.yearlyOverrides || {})) {
    for (const r of Object.values(ranges)) {
      check(r);
      if (!r.start.startsWith(`${year}-`)) throw new Error('The start date must belong to the selected year');
    }
  }
}

/** Date range [start, end] (YYYY-MM-DD) of a festival in the given year, or null if unknown. */
export function festivalRange(f: Festival, year: number, s?: FestivalSettings): { start: string; end: string } | null {
  const o = festivalOverride(f, year, s);
  if (o?.start && o?.end) return o;
  const main = f.fixed ? `${year}-${f.fixed}` : f.dates?.[year];
  if (!main) return null;
  const m = new Date(`${main}T00:00:00`);
  return { start: iso(new Date(m.getTime() - (f.before ?? 1) * day)), end: iso(new Date(m.getTime() + (f.after ?? 1) * day)) };
}

/** The festival active on `today`, respecting admin settings. */
export function activeFestival(s: FestivalSettings, today = new Date()): Festival | null {
  if (!s.enabled) return null;
  if (s.force) return FESTIVALS.find((f) => f.id === s.force) || null;
  const t = iso(today);
  for (const f of FESTIVALS) {
    if (s.disabled.includes(f.id)) continue;
    for (const year of [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]) {
      const r = festivalRange(f, year, s);
      if (r && t >= r.start && t <= r.end) return f;
    }
  }
  return null;
}

export async function loadFestivalSettings(): Promise<FestivalSettings> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", "festivals").maybeSingle();
  return { ...DEFAULT_FESTIVAL_SETTINGS, ...((data?.value as any) || {}) };
}
export async function saveFestivalSettings(v: FestivalSettings) {
  for (const item of Object.values(v.custom || {})) {
    if (item.image && !/^(https:\/\/|data:image\/(?:png|jpeg|webp|gif);base64,)/i.test(item.image)) throw new Error('Use an HTTPS artwork URL or upload an image');
  }
  validateFestivalDates(v);
  const { error } = await supabase.from("site_settings").upsert({ key: "festivals", value: v as any, updated_at: new Date().toISOString() });
  if (error) throw error;
  window.dispatchEvent(new CustomEvent("jpf:festivals-changed"));
}

/** Background animation style for each festival. */
export type FestivalEffect = "fireworks" | "embers" | "colours" | "kites" | "tricolour" | "night" | "petals" | "snow" | "balloons" | "sparkle";
const EFFECTS: Record<string, FestivalEffect> = {
  newyear: "fireworks", diwali: "fireworks", gurunanak: "fireworks", dussehra: "embers",
  holi: "colours", sankranti: "kites", childrens: "balloons",
  republic: "tricolour", independence: "tricolour", gandhi: "tricolour",
  eid: "night", bakrid: "night", shivaratri: "night", janmashtami: "night",
  onam: "petals", bathukamma: "petals", ugadi: "petals", ganesh: "petals", rakhi: "petals", ramnavami: "petals",
  christmas: "snow",
};
export const festivalEffect = (id: string): FestivalEffect => EFFECTS[id] || "sparkle";

/** Ordinary-day background templates (admin picks one and turns it on). "default" = no animation at all. */
export const DAY_TEMPLATES: { id: string; name: string; effect: FestivalEffect; aurora?: boolean; colors: [string, string, string] }[] = [
  { id: "default", name: "Default (plain, no animation)", effect: "sparkle", colors: ["oklch(0.7 0.12 220)", "oklch(0.75 0.1 180)", "oklch(0.72 0.12 260)"] },
  { id: "stars", name: "Twinkling stars", effect: "night", colors: ["oklch(0.6 0.12 250)", "oklch(0.75 0.1 220)", "oklch(0.85 0.06 260)"] },
  { id: "sparkle", name: "Soft sparkles", effect: "sparkle", colors: ["oklch(0.7 0.12 200)", "oklch(0.8 0.1 90)", "oklch(0.7 0.12 300)"] },
  { id: "bubbles", name: "Floating bubbles", effect: "balloons", colors: ["oklch(0.7 0.12 220)", "oklch(0.78 0.1 180)", "oklch(0.72 0.12 260)"] },
  { id: "leaves", name: "Falling leaves", effect: "petals", colors: ["oklch(0.65 0.14 140)", "oklch(0.75 0.13 110)", "oklch(0.7 0.12 160)"] },
  { id: "confetti", name: "Gentle confetti", effect: "tricolour", colors: ["oklch(0.7 0.15 30)", "oklch(0.8 0.13 90)", "oklch(0.65 0.14 230)"] },
  { id: "aurora", name: "Aurora glow", effect: "sparkle", aurora: true, colors: ["oklch(0.62 0.17 265)", "oklch(0.72 0.16 190)", "oklch(0.72 0.17 40)"] },
  { id: "sunset", name: "Sunset embers", effect: "embers", aurora: true, colors: ["oklch(0.72 0.18 45)", "oklch(0.66 0.2 15)", "oklch(0.8 0.15 85)"] },
]
export const dayTemplate = (id?: string) => DAY_TEMPLATES.find(t => t.id === id) || DAY_TEMPLATES[0];

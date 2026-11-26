// Automatic festival greeting mails: settings, defaults and due-date logic.
// Settings live in codexam_settings under "festival_mails"; send state under "festival_mails_state".
import { FESTIVALS, festivalRange, type Festival, type FestivalSettings } from "@/lib/festivals";

export interface FestivalMailOverride {
  off?: boolean; // never mail for this festival
  subject?: string;
  body?: string;
}

export type FestivalMailTarget = "users" | "students" | "both" | "custom";

export interface FestivalMailSettings {
  enabled: boolean;
  time: string; // "HH:MM" in the admin's timezone
  tzOffsetMinutes: number; // 330 = India
  senderName: string;
  target: FestivalMailTarget;
  customEmails: string; // comma/space separated, used when target === "custom"
  subject: string;
  body: string;
  perFestival: Record<string, FestivalMailOverride>;
}

export const FESTIVAL_MAILS_KEY = "festival_mails";
export const FESTIVAL_MAILS_STATE_KEY = "festival_mails_state";

export const DEFAULT_FESTIVAL_SUBJECT = "{{greeting}}";
export const DEFAULT_FESTIVAL_BODY = `Hi {{name}},

**{{greeting}}**

[highlight=mint]Wishing you and your family a joyful {{festival}}! May this season bring you new opportunities and success.[/highlight]

[button={{siteUrl}}]Visit JobPortalFree[/button]

Warm wishes,
The JobPortalFree team`;

export const DEFAULT_FESTIVAL_MAILS: FestivalMailSettings = {
  enabled: false,
  time: "09:00",
  tzOffsetMinutes: 330,
  senderName: "JobPortalFree",
  target: "users",
  customEmails: "",
  subject: DEFAULT_FESTIVAL_SUBJECT,
  body: DEFAULT_FESTIVAL_BODY,
  perFestival: {},
};

/** Placeholders admins can use in festival mail subject/body. */
export const FESTIVAL_MAIL_VARS = ["name", "festival", "greeting", "date", "siteUrl"];

/** The subject/body that will be mailed for one festival (per-festival override wins). */
export function festivalMailContent(s: FestivalMailSettings, f: Festival): { subject: string; body: string } {
  const o = s.perFestival?.[f.id];
  return { subject: o?.subject?.trim() || s.subject, body: o?.body?.trim() || s.body };
}

/** Sample variables for the editor preview. */
export function festivalMailSampleVars(f: Festival, greeting: string, today = new Date()): Record<string, string> {
  return { name: "Ananya", festival: f.name, greeting, date: today.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) };
}

/**
 * Festivals whose greeting mail is due on `today` ("YYYY-MM-DD") at local time `nowHM` ("HH:MM").
 * A festival is due on any day inside its date window; the send state (keyed by festival + year)
 * guarantees it is mailed only once per year. Festivals the admin disabled, either in the
 * festival calendar or per-festival here, are never mailed.
 */
export function dueFestivalMails(s: FestivalMailSettings, fs: FestivalSettings, today: string, nowHM: string): Festival[] {
  if (!s.enabled) return [];
  if (nowHM < (s.time || "09:00")) return [];
  const year = Number(today.slice(0, 4));
  return FESTIVALS.filter((f) => {
    if (s.perFestival?.[f.id]?.off) return false;
    if (fs.disabled?.includes(f.id)) return false;
    const r = festivalRange(f, year, fs);
    return !!r && today >= r.start && today <= r.end;
  });
}

/** Parse the admin-typed custom recipient list into valid unique addresses. */
export function parseCustomEmails(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(/[\s,;]+/)) {
    const email = part.trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) seen.add(email);
  }
  return [...seen];
}

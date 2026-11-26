import { describe, expect, it } from "vitest";
import {
  DEFAULT_FESTIVAL_MAILS,
  dueFestivalMails,
  festivalMailContent,
  parseCustomEmails,
  type FestivalMailSettings,
} from "@/lib/festivalMails";
import { DEFAULT_FESTIVAL_SETTINGS, FESTIVALS, type FestivalSettings } from "@/lib/festivals";

const on: FestivalMailSettings = { ...DEFAULT_FESTIVAL_MAILS, enabled: true, time: "09:00" };
const fs: FestivalSettings = { ...DEFAULT_FESTIVAL_SETTINGS };

// Christmas is a fixed-date festival: 25 Dec, shown 22–26 Dec (before: 3, after: 1).
describe("dueFestivalMails", () => {
  it("returns nothing when automatic mails are off", () => {
    expect(dueFestivalMails({ ...on, enabled: false }, fs, "2026-12-25", "10:00")).toEqual([]);
  });

  it("returns nothing before the configured send time", () => {
    expect(dueFestivalMails(on, fs, "2026-12-25", "08:59")).toEqual([]);
    expect(dueFestivalMails(on, fs, "2026-12-25", "09:00").map((f) => f.id)).toContain("christmas");
  });

  it("includes a festival on each day inside its date window", () => {
    for (const day of ["2026-12-22", "2026-12-25", "2026-12-26"]) {
      expect(dueFestivalMails(on, fs, day, "10:00").map((f) => f.id)).toContain("christmas");
    }
  });

  it("excludes days outside the window", () => {
    expect(dueFestivalMails(on, fs, "2026-12-21", "10:00").map((f) => f.id)).not.toContain("christmas");
    expect(dueFestivalMails(on, fs, "2026-12-27", "10:00").map((f) => f.id)).not.toContain("christmas");
  });

  it("never mails a festival the admin turned off", () => {
    const offPerFestival = { ...on, perFestival: { christmas: { off: true } } };
    expect(dueFestivalMails(offPerFestival, fs, "2026-12-25", "10:00").map((f) => f.id)).not.toContain("christmas");
    const offInCalendar: FestivalSettings = { ...fs, disabled: ["christmas"] };
    expect(dueFestivalMails(on, offInCalendar, "2026-12-25", "10:00").map((f) => f.id)).not.toContain("christmas");
  });

  it("skips festivals with no known date for the year", () => {
    // Lunar festivals only list 2026–2027; 2030 must not guess a date.
    const ids = dueFestivalMails(on, fs, "2030-03-04", "10:00").map((f) => f.id);
    expect(ids).not.toContain("holi");
  });
});

describe("festivalMailContent", () => {
  const christmas = FESTIVALS.find((f) => f.id === "christmas")!;
  it("uses the default template when there is no override", () => {
    const c = festivalMailContent(on, christmas);
    expect(c.subject).toBe(on.subject);
    expect(c.body).toBe(on.body);
  });
  it("prefers the per-festival override", () => {
    const c = festivalMailContent({ ...on, perFestival: { christmas: { subject: "Merry Christmas {{name}}!", body: "Custom body" } } }, christmas);
    expect(c.subject).toBe("Merry Christmas {{name}}!");
    expect(c.body).toBe("Custom body");
  });
  it("falls back to the default when the override is blank", () => {
    const c = festivalMailContent({ ...on, perFestival: { christmas: { subject: "   ", body: "" } } }, christmas);
    expect(c.subject).toBe(on.subject);
    expect(c.body).toBe(on.body);
  });
});

describe("parseCustomEmails", () => {
  it("keeps valid unique addresses and drops the rest", () => {
    expect(parseCustomEmails("a@b.com, bad, A@b.com; c@d.io\na@b.com")).toEqual(["a@b.com", "c@d.io"]);
  });
});

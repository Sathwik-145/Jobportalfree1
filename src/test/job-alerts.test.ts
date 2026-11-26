import { describe, expect, it } from "vitest";
import { alertsAllowed, jobMatchesPrefs } from "@/lib/jobAlerts";
import { themeVars, DEFAULT_THEME } from "@/lib/themeSettings";

describe("job alert switches", () => {
  it("sends when the person has alerts on and the admin has not switched them off", () =>
    expect(alertsAllowed({ is_active: true, admin_paused: false })).toBe(true));
  it("never sends when the admin switched alerts off for that person", () =>
    expect(alertsAllowed({ is_active: true, admin_paused: true })).toBe(false));
  it("never sends when the person turned their own alerts off", () =>
    expect(alertsAllowed({ is_active: false, admin_paused: false })).toBe(false));
});

describe("job alert matching", () => {
  const job = { title: "React Developer Intern", location: "Bengaluru", job_type: "internship", skills_required: ["React", "TypeScript"] };
  it("matches on a saved skill", () => expect(jobMatchesPrefs({ preferred_skills: ["react"] }, job)).toBe(true));
  it("matches on a saved location", () => expect(jobMatchesPrefs({ preferred_locations: ["bengaluru"] }, job)).toBe(true));
  it("does not match when nothing saved fits", () =>
    expect(jobMatchesPrefs({ preferred_locations: ["Pune"], preferred_skills: ["Java"], preferred_job_types: ["full-time"] }, job)).toBe(false));
  it("someone with no saved filters hears about every job", () => expect(jobMatchesPrefs({}, job)).toBe(true));
});

describe("dark mode keeps dark panels", () => {
  it("light mode uses the admin's panel colour", () => expect(themeVars(DEFAULT_THEME, "light")["--ink"]).toBe(DEFAULT_THEME.panel));
  it("dark mode does not force the light panel colour", () => expect(themeVars(DEFAULT_THEME, "dark")["--ink"]).toBeUndefined());
});

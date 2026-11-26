import { describe, it, expect } from "vitest";
import { REPORT_LAYOUTS, validReportLayout } from "@/exam/lib/reportLayouts";
import { readableOn, normalizeTheme } from "@/lib/themeSettings";
import { LANDING_TEMPLATES, validLandingTemplate } from "@/lib/landingTemplates";

describe("report designs", () => {
  it("offers 7 designs", () => expect(REPORT_LAYOUTS.length).toBe(7));
  it("unknown design falls back to classic", () => expect(validReportLayout("nope")).toBe("classic"));
});
describe("auto text colour", () => {
  it("light text on a dark panel", () => expect(readableOn("198 62% 19%")).toBe("36 33% 97%"));
  it("dark text on a light panel", () => expect(readableOn("50 90% 85%")).toBe("228 42% 12%"));
  it("uses dark text on the site's orange accent", () => expect(readableOn("18 94% 56%")).toBe("228 42% 12%"));
});
describe("home design options", () => {
  it("adds five designs while preserving the existing five", () => {
    expect(LANDING_TEMPLATES.map(t => t.id)).toEqual(["classic", "spotlight", "aurora", "midnight", "editorial", "studio", "horizon", "mosaic", "pulse", "atelier"]);
  });
  it("recognises every saved design", () => LANDING_TEMPLATES.forEach(t => expect(validLandingTemplate(t.id)).toBe(t.id)));
});
describe("panel theme refresh", () => {
  it("replaces the previous built-in teal", () => expect(normalizeTheme({ panel: "198 62% 19%" }).panel).toBe("0 0% 100%"));
  it("replaces the rejected dark blue", () => expect(normalizeTheme({ panel: "226 71% 42%" }).panel).toBe("0 0% 100%"));
  it("replaces the rejected pale blue", () => expect(normalizeTheme({ panel: "212 75% 92%" }).panel).toBe("0 0% 100%"));
  it("replaces the rejected mid blue", () => expect(normalizeTheme({ panel: "212 58% 72%" }).panel).toBe("0 0% 100%"));
  it("keeps an admin-chosen panel colour", () => expect(normalizeTheme({ panel: "162 63% 38%" }).panel).toBe("162 63% 38%"));
  it("keeps dark text readable on the white panel", () => expect(readableOn("0 0% 100%")).toBe("228 42% 12%"));
  it("preserves admin-selected panel colours", () => expect(normalizeTheme({ panel: "50 90% 85%" }).panel).toBe("50 90% 85%"));
});

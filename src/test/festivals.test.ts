import { describe, it, expect } from "vitest";
import { activeFestival, shownFestival, festivalAppearance, festivalRange, setFestivalRange, resetFestivalRange, validateFestivalDates, startFestival, FESTIVALS, DEFAULT_FESTIVAL_SETTINGS as D } from "@/lib/festivals";

const at = (s: string) => new Date(`${s}T12:00:00`);

describe("festival calendar", () => {
  it("shows Independence Day on Aug 15", () => expect(activeFestival(D, at("2026-08-15"))?.id).toBe("independence"));
  it("shows Republic Day on Jan 26", () => expect(activeFestival(D, at("2027-01-26"))?.id).toBe("republic"));
  it("shows Dussehra on Oct 20 2026", () => expect(activeFestival(D, at("2026-10-20"))?.id).toBe("dussehra"));
  it("shows nothing on an ordinary day", () => expect(activeFestival(D, at("2026-07-07"))).toBeNull());
  it("hides a festival the admin switched off", () => expect(activeFestival({ ...D, disabled: ["independence"] }, at("2026-08-15"))).toBeNull());
  it("hides everything when festivals are off", () => expect(activeFestival({ ...D, enabled: false }, at("2026-12-25"))).toBeNull());
  it("admin preview forces a festival on any day", () => expect(activeFestival({ ...D, force: "diwali" }, at("2026-07-07"))?.id).toBe("diwali"));
  it("starts immediately even when disabled", () => expect(activeFestival(startFestival({ ...D, enabled: false, disabled: ["diwali"] }, "diwali"), at("2026-07-07"))?.id).toBe("diwali"));
  it("stops a forced celebration when switched off", () => expect(activeFestival({ ...startFestival(D, "diwali"), enabled: false }, at("2026-07-07"))).toBeNull());
  it("uses the admin's festival name and greeting", () => {
    const f = FESTIVALS.find(f => f.id === "diwali");
    if (!f) throw new Error("Missing Diwali");
    expect(festivalAppearance(f, { ...D, custom: { diwali: { name: "Deepavali", greeting: "Celebrate the light" } } })).toMatchObject({ name: "Deepavali", greeting: "Celebrate the light" });
  });
  it("presentation switches do not change festival dates", () => expect(activeFestival({ ...D, showColors: false, showImages: true, showParticles: false, showBanner: false }, at("2026-10-20"))?.id).toBe("dussehra"));
  const dussehra = FESTIVALS.find(f => f.id === 'dussehra');
  if (!dussehra) throw new Error('Missing Dussehra');
  it('automatically uses Dussehra dates for 2027', () => {
    expect(activeFestival(D, at('2027-10-09'))?.id).toBe('dussehra');
    expect(festivalRange(dussehra, 2027, D)).toEqual({ start: '2027-10-07', end: '2027-10-10' });
  });
  it('keeps manual dates independently for each year', () => {
    let s = setFestivalRange(D, 'dussehra', 2027, { start: '2027-10-11', end: '2027-10-12' });
    s = setFestivalRange(s, 'dussehra', 2028, { start: '2028-10-01', end: '2028-10-02' });
    expect(festivalRange(dussehra, 2027, s)).toEqual({ start: '2027-10-11', end: '2027-10-12' });
    expect(activeFestival(s, at('2028-10-01'))?.id).toBe('dussehra');
  });
  it('resets only the selected year', () => {
    const s = setFestivalRange(setFestivalRange(D, 'dussehra', 2026, { start: '2026-10-21', end: '2026-10-22' }), 'dussehra', 2027, { start: '2027-10-11', end: '2027-10-12' });
    const reset = resetFestivalRange(s, 'dussehra', 2027);
    expect(festivalRange(dussehra, 2027, reset)?.start).toBe('2027-10-07');
    expect(festivalRange(dussehra, 2026, reset)?.start).toBe('2026-10-21');
  });
  it('preserves legacy manual dates', () => expect(festivalRange(dussehra, 2026, { ...D, overrides: { dussehra: { start: '2026-10-22', end: '2026-10-23' } } })?.start).toBe('2026-10-22'));
  it('does not invent lunar dates in an unknown year', () => expect(festivalRange(dussehra, 2028, D)).toBeNull());
  it('repeats fixed national dates in later years', () => expect(activeFestival(D, at('2030-08-15'))?.id).toBe('independence'));
  it('keeps New Year visible across December rollover', () => expect(activeFestival(D, at('2027-12-31'))?.id).toBe('newyear'));
  it('rejects a backwards date range', () => expect(() => validateFestivalDates(setFestivalRange(D, 'dussehra', 2027, { start: '2027-10-12', end: '2027-10-11' }))).toThrow('end date'));
  it('rejects dates saved under the wrong year', () => expect(() => validateFestivalDates(setFestivalRange(D, 'dussehra', 2027, { start: '2028-10-01', end: '2028-10-02' }))).toThrow('selected year'));
  it('rejects an impossible date', () => expect(() => validateFestivalDates(setFestivalRange(D, 'dussehra', 2027, { start: '2027-02-30', end: '2027-03-01' }))).toThrow('valid festival dates'));
});

describe("everyday look", () => {
  const diwaliDay = at("2026-11-09");
  it("a festival in its dates shows by default", () => expect(shownFestival({ ...D, dayThemes: true, dayTemplate: "stars" }, diwaliDay)?.id).toBe("diwali"));
  it("everyday look can take over during a festival", () => expect(shownFestival({ ...D, dayThemes: true, dayTemplate: "stars", dayOverFestival: true }, diwaliDay)).toBeNull());
  it("the plain template never hides a festival", () => expect(shownFestival({ ...D, dayThemes: true, dayTemplate: "default", dayOverFestival: true }, diwaliDay)?.id).toBe("diwali"));
  it("starting a festival brings it back in front", () => expect(shownFestival(startFestival({ ...D, dayThemes: true, dayTemplate: "stars", dayOverFestival: true }, "holi"), diwaliDay)?.id).toBe("holi"));
});

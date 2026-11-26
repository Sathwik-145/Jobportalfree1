import { describe, it, expect } from "vitest";
import { inRange } from "@/components/DateRangeFilter";
describe("inRange", () => {
  it("keeps rows inside the window", () => expect(inRange("2026-10-20T10:00:00", { from: "2026-10-20T09:00", to: "2026-10-20T11:00" })).toBe(true));
  it("drops rows before from", () => expect(inRange("2026-10-19T10:00:00", { from: "2026-10-20T00:00", to: "" })).toBe(false));
  it("drops rows after to", () => expect(inRange("2026-10-21T10:00:00", { from: "", to: "2026-10-20T23:59" })).toBe(false));
});

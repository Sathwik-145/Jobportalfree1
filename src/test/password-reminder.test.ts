import { describe, expect, it } from "vitest";
import { reminderDue, daysUntilRotation, PASSWORD_REMINDER_EMAIL } from "@/lib/passwordReminder";

const DAY = 86_400_000;
const now = Date.UTC(2026, 9, 20);

describe("admin password reminder", () => {
  it("goes to the official address", () => expect(PASSWORD_REMINDER_EMAIL).toBe("jobportalfreeofficial@gmail.com"));
  it("is not due 29 days after a change", () => expect(reminderDue({ changedAt: now - 29 * DAY }, now)).toBe(false));
  it("is due 30 days after a change", () => expect(reminderDue({ changedAt: now - 30 * DAY }, now)).toBe(true));
  it("waits another 30 days after a reminder was sent", () => expect(reminderDue({ changedAt: now - 40 * DAY, lastReminderAt: now - 10 * DAY }, now)).toBe(false));
  it("never sends when turned off", () => expect(reminderDue({ changedAt: now - 90 * DAY, enabled: false }, now)).toBe(false));
  it("counts down days left", () => expect(daysUntilRotation({ changedAt: now - 10 * DAY }, now)).toBe(20));
});

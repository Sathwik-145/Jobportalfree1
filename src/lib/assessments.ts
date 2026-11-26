// Local-first assessment registration store. Persists to localStorage so the
// admin can view registrations across sessions without a backend table.
// To wire to a real DB later, swap saveRegistration/listRegistrations to
// call supabase against an "assessment_registrations" table.

export interface AssessmentRegistration {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  college: string;
  branch: string;
  cgpa: string;
  slot_date?: string | null;
  slot_time?: string | null;
  resume_filename?: string | null;
  resume_data_url?: string | null; // tiny resumes only; clipped if too large
}

export const ASSESSMENT_TIME_SLOTS = [
  "09:00 AM", "10:30 AM", "12:00 PM",
  "02:00 PM", "03:30 PM", "05:00 PM",
];

export const getUpcomingSlotDates = (count = 7): string[] => {
  const out: string[] = [];
  const today = new Date();
  for (let i = 1; out.length < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    // skip Sundays
    if (d.getDay() === 0) continue;
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

const KEY = "assessment_registrations_v1";
const MAX_RESUME_BYTES = 1.5 * 1024 * 1024; // ~1.5MB cap to keep localStorage usable

export const listRegistrations = (): AssessmentRegistration[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AssessmentRegistration[]) : [];
  } catch {
    return [];
  }
};

export const saveRegistration = (
  reg: Omit<AssessmentRegistration, "id" | "created_at">,
): AssessmentRegistration => {
  const full: AssessmentRegistration = {
    ...reg,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  const all = [full, ...listRegistrations()];
  localStorage.setItem(KEY, JSON.stringify(all));
  return full;
};

export const deleteRegistration = (id: string) => {
  const next = listRegistrations().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
};

export const readFileAsDataUrl = (file: File): Promise<string | null> =>
  new Promise((resolve) => {
    if (file.size > MAX_RESUME_BYTES) {
      // Skip storing large files; keep filename only.
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

export const exportRegistrationsCsv = (rows: AssessmentRegistration[]): string => {
  const header = ["Date", "Name", "Email", "College", "Branch", "CGPA", "Slot", "Resume"];
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      new Date(r.created_at).toLocaleString(),
      r.full_name,
      r.email,
      r.college,
      r.branch,
      r.cgpa,
      [r.slot_date, r.slot_time].filter(Boolean).join(" "),
      r.resume_filename || "",
    ]
      .map(escape)
      .join(","),
  );
  return [header.map(escape).join(","), ...lines].join("\n");
};

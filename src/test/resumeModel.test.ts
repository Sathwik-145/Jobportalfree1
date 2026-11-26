import { describe, expect, it } from "vitest";
import { buildDocument, completeness, emptyResume, normalizeResume, splitSkills } from "@/lib/resumeModel";
import { buildResumePdf } from "@/lib/resumePdf";

describe("resumeModel", () => {
  it("normalizes unknown data safely", () => {
    expect(normalizeResume(null).education).toHaveLength(1);
    const r = normalizeResume({ fullName: "A", education: [{ school: "X" }], projects: "bad" });
    expect(r.education[0]).toMatchObject({ school: "X", degree: "" });
    expect(r.projects).toEqual([]);
  });

  it("skips empty sections and splits bullets", () => {
    const d = { ...emptyResume(), fullName: "Asha", email: "a@x.com", skills: "React, SQL; Git\nDocker",
      experience: [{ company: "Acme", role: "Intern", period: "2024", details: "• Built UI\n- Wrote tests" }] };
    const doc = buildDocument(d);
    expect(doc.contact).toEqual(["a@x.com"]);
    expect(doc.sections.map((s) => s.title)).toEqual(["Experience", "Skills"]);
    expect(doc.sections[0].lines.filter((l) => l.kind === "bullet")).toHaveLength(2);
    expect(splitSkills(d.skills)).toEqual(["React", "SQL", "Git", "Docker"]);
  });

  it("scores completeness", () => {
    expect(completeness(emptyResume()).score).toBe(0);
    const full = { ...emptyResume(), fullName: "A", email: "a@b.c", phone: "1", summary: "x".repeat(70),
      education: [{ school: "S", degree: "B", year: "", grade: "" }], skills: "a,b,c,d,e",
      projects: [{ name: "P", link: "", details: "d" }], certifications: "AWS", linkedin: "l" };
    expect(completeness(full).score).toBe(100);
  });

  it("renders a PDF for every template", async () => {
    const d = { ...emptyResume(), fullName: "Asha Rao", title: "Frontend Developer", email: "a@x.com", summary: "Builder. ".repeat(40),
      experience: [{ company: "Acme", role: "Intern", period: "2024", details: "Did things\n".repeat(60) }] };
    for (const id of ["classic", "modern", "compact"] as const) {
      const pdf = await buildResumePdf(d, id);
      expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    }
  });
});

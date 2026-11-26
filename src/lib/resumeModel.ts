/** Resume data model, document layout (shared by the live preview and the PDF) and completeness score. */

export interface Education { school: string; degree: string; year: string; grade: string }
export interface Experience { company: string; role: string; period: string; details: string }
export interface Project { name: string; link: string; details: string }

export interface ResumeData {
  fullName: string; title: string; email: string; phone: string; location: string;
  linkedin: string; github: string; website: string;
  summary: string;
  education: Education[]; experience: Experience[]; projects: Project[];
  skills: string;          // comma separated
  certifications: string;  // one per line
}

export const emptyEducation = (): Education => ({ school: "", degree: "", year: "", grade: "" });
export const emptyExperience = (): Experience => ({ company: "", role: "", period: "", details: "" });
export const emptyProject = (): Project => ({ name: "", link: "", details: "" });

export const emptyResume = (): ResumeData => ({
  fullName: "", title: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "",
  summary: "", education: [emptyEducation()], experience: [], projects: [], skills: "", certifications: "",
});

/** Fills missing/old fields so stored data from any version loads safely. */
export function normalizeResume(raw: unknown): ResumeData {
  const base = emptyResume();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<ResumeData>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const list = <T extends object>(v: unknown, make: () => T): T[] =>
    Array.isArray(v) ? v.filter((x) => x && typeof x === "object").map((x) => ({ ...make(), ...x })) : [];
  return {
    fullName: str(r.fullName), title: str(r.title), email: str(r.email), phone: str(r.phone), location: str(r.location),
    linkedin: str(r.linkedin), github: str(r.github), website: str(r.website), summary: str(r.summary),
    education: list(r.education, emptyEducation), experience: list(r.experience, emptyExperience),
    projects: list(r.projects, emptyProject), skills: str(r.skills), certifications: str(r.certifications),
  };
}

export type DocLine =
  | { kind: "row"; left: string; right?: string; sub?: string }
  | { kind: "text"; text: string }
  | { kind: "bullet"; text: string };

export interface DocSection { title: string; lines: DocLine[] }
export interface ResumeDoc { name: string; title: string; contact: string[]; sections: DocSection[] }

const t = (s: string) => s.trim();
const splitLines = (s: string) => s.split(/\r?\n/).map((x) => x.replace(/^[\s•\-*·]+/, "").trim()).filter(Boolean);
export const splitSkills = (s: string) => s.split(/[,\n;]/).map(t).filter(Boolean);

function detailLines(details: string): DocLine[] {
  return splitLines(details).map((text) => ({ kind: "bullet", text }) as DocLine);
}

export function buildDocument(d: ResumeData): ResumeDoc {
  const contact = [d.email, d.phone, d.location, d.linkedin, d.github, d.website].map(t).filter(Boolean);
  const sections: DocSection[] = [];

  if (t(d.summary)) sections.push({ title: "Summary", lines: [{ kind: "text", text: t(d.summary) }] });

  const exp = d.experience.filter((e) => t(e.company) || t(e.role));
  if (exp.length) sections.push({
    title: "Experience",
    lines: exp.flatMap((e): DocLine[] => [
      { kind: "row", left: t(e.role) || t(e.company), right: t(e.period), sub: t(e.role) ? t(e.company) : "" },
      ...detailLines(e.details),
    ]),
  });

  const proj = d.projects.filter((p) => t(p.name));
  if (proj.length) sections.push({
    title: "Projects",
    lines: proj.flatMap((p): DocLine[] => [
      { kind: "row", left: t(p.name), right: t(p.link) },
      ...detailLines(p.details),
    ]),
  });

  const edu = d.education.filter((e) => t(e.school) || t(e.degree));
  if (edu.length) sections.push({
    title: "Education",
    lines: edu.map((e): DocLine => ({
      kind: "row", left: t(e.degree) || t(e.school), right: t(e.year),
      sub: [t(e.degree) ? t(e.school) : "", t(e.grade)].filter(Boolean).join(" · "),
    })),
  });

  const skills = splitSkills(d.skills);
  if (skills.length) sections.push({ title: "Skills", lines: [{ kind: "text", text: skills.join(", ") }] });

  const certs = splitLines(d.certifications);
  if (certs.length) sections.push({ title: "Certifications", lines: certs.map((text) => ({ kind: "bullet", text }) as DocLine) });

  return { name: t(d.fullName), title: t(d.title), contact, sections };
}

/** 0-100 completeness plus the next things worth adding. */
export function completeness(d: ResumeData): { score: number; tips: string[] } {
  const checks: Array<[boolean, number, string]> = [
    [!!t(d.fullName), 10, "Add your full name"],
    [!!t(d.email) && !!t(d.phone), 10, "Add an email and phone number"],
    [t(d.summary).length >= 60, 15, "Write a 2-3 line summary (60+ characters)"],
    [d.education.some((e) => t(e.school) && t(e.degree)), 15, "Add your education"],
    [splitSkills(d.skills).length >= 5, 15, "List at least 5 skills"],
    [d.projects.some((p) => t(p.name) && t(p.details)), 15, "Add a project with details"],
    [d.experience.some((e) => t(e.company) && t(e.details)) || splitLines(d.certifications).length > 0, 10, "Add experience, an internship or a certification"],
    [!!t(d.linkedin) || !!t(d.github), 10, "Add a LinkedIn or GitHub link"],
  ];
  const score = checks.reduce((n, [ok, w]) => n + (ok ? w : 0), 0);
  return { score, tips: checks.filter(([ok]) => !ok).map(([, , tip]) => tip) };
}

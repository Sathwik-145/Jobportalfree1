export type TemplateId = "classic" | "modern" | "compact";

export interface ResumeTemplate {
  id: TemplateId;
  name: string;
  blurb: string;
  font: "times" | "helvetica";
  align: "center" | "left";
  accent: [number, number, number];
  nameSize: number;
  bodySize: number;
  sectionGap: number;
  ruleUnderSection: boolean;
}

export const TEMPLATES: ResumeTemplate[] = [
  { id: "classic", name: "Classic", blurb: "Centered header, serif type. Safe for any recruiter.", font: "times", align: "center", accent: [20, 20, 20], nameSize: 22, bodySize: 10.5, sectionGap: 12, ruleUnderSection: true },
  { id: "modern", name: "Modern", blurb: "Left-aligned with a colour accent.", font: "helvetica", align: "left", accent: [37, 99, 235], nameSize: 24, bodySize: 10, sectionGap: 12, ruleUnderSection: true },
  { id: "compact", name: "Compact", blurb: "Smaller type to fit more on one page.", font: "helvetica", align: "left", accent: [30, 41, 59], nameSize: 20, bodySize: 9, sectionGap: 8, ruleUnderSection: false },
];

export const templateById = (id: string): ResumeTemplate => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];

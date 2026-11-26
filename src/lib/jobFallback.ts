// Smart fallbacks for jobs missing descriptions or skills.
// Used so existing posted jobs that have empty fields still look complete.

const SKILL_MAP: Array<[RegExp, string[]]> = [
  [/front[- ]?end|react|next|vue/i, ["React", "TypeScript", "HTML/CSS", "Tailwind", "REST APIs", "Git"]],
  [/back[- ]?end|node|django|spring|java|python/i, ["Node.js", "REST APIs", "SQL", "Docker", "Git", "Testing"]],
  [/full[- ]?stack/i, ["React", "Node.js", "TypeScript", "PostgreSQL", "REST APIs", "Git"]],
  [/data scientist|ml|machine learning|ai/i, ["Python", "Pandas", "NumPy", "Scikit-learn", "SQL", "Statistics"]],
  [/data analyst|analytics/i, ["SQL", "Excel", "Power BI / Tableau", "Python", "Statistics"]],
  [/devops|sre|cloud/i, ["AWS", "Docker", "Kubernetes", "Linux", "CI/CD", "Terraform"]],
  [/mobile|ios|android|flutter/i, ["Flutter / React Native", "REST APIs", "Git", "Mobile UX"]],
  [/ui|ux|product designer|graphic/i, ["Figma", "Wireframing", "Prototyping", "Design Systems", "UX Research"]],
  [/qa|test|sdet/i, ["Selenium", "Jest", "API Testing", "Git", "Test Plans"]],
  [/product manager|pm/i, ["Roadmapping", "User Research", "Agile/Scrum", "Analytics", "Stakeholder Mgmt"]],
  [/business analyst/i, ["Excel", "SQL", "Requirements Gathering", "Process Mapping"]],
  [/marketing|seo|content/i, ["SEO", "Content Strategy", "Google Analytics", "Copywriting", "Social Media"]],
  [/sales|account/i, ["CRM (Salesforce / HubSpot)", "Communication", "Negotiation", "Pipeline Management"]],
  [/hr|recruit/i, ["Recruiting", "Communication", "ATS Tools", "Interviewing"]],
  [/finance|account|audit/i, ["Excel", "SAP / Tally", "Financial Analysis", "Reporting"]],
];

const DEFAULT_SKILLS = ["Communication", "Teamwork", "Problem Solving", "Time Management"];

export function getJobSkills(job: { title?: string | null; skills_required?: string[] | null }): string[] {
  if (job.skills_required && job.skills_required.length > 0) return job.skills_required;
  const title = job.title || "";
  for (const [re, skills] of SKILL_MAP) if (re.test(title)) return skills;
  return DEFAULT_SKILLS;
}

export function getJobDescription(job: {
  title?: string | null;
  company?: string | null;
  location?: string | null;
  description?: string | null;
  experience_level?: string | null;
}): string {
  if (job.description && job.description.trim().length > 0) return job.description;
  const title = job.title || "this role";
  const company = job.company || "our team";
  const loc = job.location ? ` based in ${job.location}` : "";
  const exp = job.experience_level ? ` (${job.experience_level} level)` : "";
  return `## About the role

We are hiring a **${title}**${exp} to join **${company}**${loc}. You will collaborate with cross-functional teams to ship high-impact work, own features end-to-end, and grow alongside an ambitious team.

## What you'll do

- Design, build and ship features that matter to real users
- Work closely with design, product and engineering peers
- Write clean, tested, maintainable code or documentation
- Continuously improve performance, quality and developer experience
- Participate in code reviews, planning and retrospectives

## What we look for

- Strong fundamentals in your craft and a willingness to learn
- Clear written and verbal communication
- Ownership mindset — you ship and you iterate
- Comfortable working in a fast-moving, collaborative environment

## Why join us

- Competitive compensation and growth path
- Modern tooling and a culture of learning
- Real ownership and visibility from day one`;
}

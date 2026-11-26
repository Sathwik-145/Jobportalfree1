/** Smart job matching: scores a job against a user's skills and preferences (pure, no I/O). */

export interface MatchProfile {
  skills: string[];
  preferredSkills: string[];
  preferredJobTypes: string[];
  preferredLocations: string[];
}

export interface MatchJob {
  title?: string | null;
  location?: string | null;
  job_type?: string | null;
  skills_required?: string[] | null;
}

export interface MatchResult {
  score: number; // 0-100
  matchedSkills: string[];
  missingSkills: string[];
  typeMatch: boolean | null; // null = no preference given
  locationMatch: boolean | null;
}

const ALIASES: Record<string, string> = {
  js: "javascript", ecmascript: "javascript", ts: "typescript",
  reactjs: "react", "react.js": "react", "react js": "react",
  node: "nodejs", "node.js": "nodejs", "node js": "nodejs",
  vuejs: "vue", "vue.js": "vue", nextjs: "next", "next.js": "next",
  py: "python", golang: "go", postgres: "postgresql", mongo: "mongodb",
  "c++": "cpp", "c#": "csharp", ml: "machinelearning", "machine learning": "machinelearning",
  html5: "html", css3: "css", "html/css": "html", k8s: "kubernetes",
  powerbi: "powerbi", "power bi": "powerbi", "power bi / tableau": "powerbi", "rest apis": "rest", "rest api": "rest",
  "ci/cd": "cicd", "tailwind css": "tailwind", tailwindcss: "tailwind",
};

export function normalizeSkill(skill: string): string {
  const s = skill.trim().toLowerCase().replace(/\s+/g, " ");
  return ALIASES[s] ?? s;
}

const norm = (list: string[]) => Array.from(new Set(list.map(normalizeSkill).filter(Boolean)));
const tokens = (s: string | null | undefined) => (s || "").toLowerCase().split(/[,/|]|\s{2,}/).map((x) => x.trim()).filter(Boolean);

const W_SKILLS = 60, W_TYPE = 20, W_LOCATION = 20;

/** Returns null when we know nothing about the user (no skills and no preferences). */
export function computeMatch(job: MatchJob, profile: MatchProfile | null): MatchResult | null {
  if (!profile) return null;
  const userSkills = norm([...profile.skills, ...profile.preferredSkills]);
  const hasPrefs = profile.preferredJobTypes.length + profile.preferredLocations.length > 0;
  if (userSkills.length === 0 && !hasPrefs) return null;

  const required = norm(job.skills_required || []);
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const have = new Set(userSkills);
  for (const raw of job.skills_required || []) {
    (have.has(normalizeSkill(raw)) ? matchedSkills : missingSkills).push(raw);
  }

  let earned = 0, possible = 0;
  if (required.length > 0 && userSkills.length > 0) {
    possible += W_SKILLS;
    earned += W_SKILLS * (matchedSkills.length / (matchedSkills.length + missingSkills.length));
  }

  let typeMatch: boolean | null = null;
  if (profile.preferredJobTypes.length > 0 && job.job_type) {
    const wanted = profile.preferredJobTypes.map((t) => t.toLowerCase().trim());
    const jt = job.job_type.toLowerCase().trim();
    typeMatch = wanted.some((w) => jt.includes(w) || w.includes(jt));
    possible += W_TYPE;
    if (typeMatch) earned += W_TYPE;
  }

  let locationMatch: boolean | null = null;
  if (profile.preferredLocations.length > 0 && job.location) {
    const wanted = profile.preferredLocations.map((l) => l.toLowerCase().trim());
    const places = tokens(job.location);
    const loc = (job.location || "").toLowerCase();
    locationMatch = loc.includes("remote") || wanted.includes("remote")
      ? loc.includes("remote") || wanted.some((w) => loc.includes(w))
      : wanted.some((w) => loc.includes(w) || places.some((p) => w.includes(p)));
    possible += W_LOCATION;
    if (locationMatch) earned += W_LOCATION;
  }

  if (possible === 0) return null;
  return {
    score: Math.round((earned / possible) * 100),
    matchedSkills, missingSkills, typeMatch, locationMatch,
  };
}

export function matchLabel(score: number): string {
  if (score >= 80) return "Great match";
  if (score >= 60) return "Good match";
  if (score >= 40) return "Fair match";
  return "Low match";
}

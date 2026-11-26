// Browser-safe job alert rules shared by the Job Alerts page, the admin Job Alerts page and the mail route.

export type AlertPrefs = {
  preferred_locations?: string[] | null;
  preferred_job_types?: string[] | null;
  preferred_skills?: string[] | null;
  is_active?: boolean | null;
  admin_paused?: boolean | null;
};

export type AlertJob = {
  title?: string | null;
  location?: string | null;
  job_type?: string | null;
  skills_required?: string[] | null;
};

const norm = (v: string) => v.trim().toLowerCase();

/** Alerts go out only when the person has them on AND the admin has not switched them off. */
export function alertsAllowed(p: AlertPrefs | null | undefined): boolean {
  return !!p && p.is_active !== false && p.admin_paused !== true;
}

/**
 * A job matches when any one saved preference matches (location, job type or skill).
 * Someone who saved no preferences at all hears about every new job.
 */
export function jobMatchesPrefs(p: AlertPrefs, job: AlertJob): boolean {
  const locs = (p.preferred_locations || []).map(norm).filter(Boolean);
  const types = (p.preferred_job_types || []).map(norm).filter(Boolean);
  const skills = (p.preferred_skills || []).map(norm).filter(Boolean);
  if (!locs.length && !types.length && !skills.length) return true;
  const loc = norm(job.location || "");
  const type = norm(job.job_type || "");
  const jobSkills = (job.skills_required || []).map(norm);
  const title = norm(job.title || "");
  return (
    locs.some((l) => loc.includes(l)) ||
    types.some((t) => type.includes(t)) ||
    skills.some((s) => jobSkills.includes(s) || title.includes(s))
  );
}

export const splitList = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 25);

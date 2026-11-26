// Browser-safe helpers for the admin "Find recent jobs" tool.
export const JOB_FINDER_MIN = 4;
export const JOB_FINDER_MAX = 30;

export type FoundJob = {
  title: string;
  company: string;
  location: string;
  job_type: string;
  experience_level: string;
  salary_range: string;
  skills_required: string[];
  description: string;
  source_url: string;
  deadline: string | null;
};

export function clampJobCount(n: unknown) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return JOB_FINDER_MIN;
  return Math.min(JOB_FINDER_MAX, Math.max(JOB_FINDER_MIN, v));
}

const str = (v: unknown, n: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

export function normalizeUrl(raw: unknown): string | null {
  try {
    const u = new URL(String(raw ?? '').trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    u.hash = '';
    return u.href;
  } catch { return null; }
}

/** Clean AI output: keep only complete postings with a real web link, drop duplicates and already-listed links. */
export function cleanFoundJobs(raw: unknown, existingUrls: Iterable<string> = [], limit = JOB_FINDER_MAX): FoundJob[] {
  const list = Array.isArray(raw) ? raw : [];
  const seen = new Set([...existingUrls].map((u) => normalizeUrl(u)).filter(Boolean) as string[]);
  const out: FoundJob[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const url = normalizeUrl(r.source_url ?? r.url);
    const title = str(r.title, 200);
    const company = str(r.company, 200);
    if (!url || !title || !company || seen.has(url)) continue;
    seen.add(url);
    const deadline = /^\d{4}-\d{2}-\d{2}$/.test(String(r.deadline ?? '')) ? String(r.deadline) : null;
    const skills = Array.isArray(r.skills_required) ? r.skills_required : String(r.skills_required ?? '').split(',');
    out.push({
      title, company,
      location: str(r.location, 200),
      job_type: str(r.job_type, 60),
      experience_level: str(r.experience_level, 60),
      salary_range: str(r.salary_range, 100),
      skills_required: skills.map((s) => str(s, 40)).filter(Boolean).slice(0, 12),
      description: str(r.description, 2000),
      source_url: url,
      deadline,
    });
    if (out.length >= limit) break;
  }
  return out;
}

/** Pull the first JSON array out of a model reply (it may be wrapped in prose or code fences). */
export function extractJsonArray(text: string): unknown[] {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end <= start) return [];
  try { const v = JSON.parse(text.slice(start, end + 1)); return Array.isArray(v) ? v : []; } catch { return []; }
}

/** A link counts as reachable unless the site says it is gone. Many job boards block automated visits (403/429/999) even for live postings. */
export const linkLooksLive = (status: number) => status < 400 || status === 403 || status === 429 || status === 999;

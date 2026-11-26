import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { mailAdminDb } from '@/lib/mail-auth.server';
import { cleanFoundJobs, clampJobCount, extractJsonArray, linkLooksLive, type FoundJob } from '@/lib/jobFinder';

const schema = z.object({
  count: z.number().int().min(4).max(30),
  query: z.string().max(200).optional(),
  location: z.string().max(120).optional(),
});

async function searchWithGemini(apiKey: string, count: number, query: string, location: string) {
  const today = new Date().toISOString().slice(0, 10);
  const prompt = `Today is ${today}. Use Google Search to find ${count + 6} real, currently open job postings published in the last 14 days${query ? ` for: ${query}` : ' for freshers and early-career candidates (software, IT, data, support, internships)'}${location ? ` in ${location}` : ' in India or remote'}.
Only include postings you actually found in search results, each with its direct posting or official careers-page URL. Never invent companies, roles or links.
Reply with ONLY a JSON array. Each item: {"title","company","location","job_type" (Full-time/Part-time/Internship/Contract/Remote),"experience_level" (Fresher/Entry/Mid/Senior),"salary_range" (or ""),"skills_required" (array of strings),"description" (2-4 sentences from the posting),"source_url","deadline" (YYYY-MM-DD or null)}.`;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], tools: [{ google_search: {} }], generationConfig: { temperature: 0.2 } }),
    signal: AbortSignal.timeout(50000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Job search failed [${res.status}]: ${body.slice(0, 300)}`);
  }
  const data: any = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts || []).map((p: any) => p?.text || '').join('');
  return extractJsonArray(text);
}

async function keepLive(jobs: FoundJob[]) {
  const checks = await Promise.all(jobs.map(async (job) => {
    try {
      const r = await fetch(job.source_url, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (JobPortalFree link check)' }, signal: AbortSignal.timeout(8000) });
      try { await r.body?.cancel(); } catch { /* ignore */ }
      return linkLooksLive(r.status);
    } catch { return false; }
  }));
  return jobs.filter((_, i) => checks[i]);
}

/** Admin-only: find recent real job postings on the web (Google Search through Gemini), with links checked. Nothing is saved here. */
export const Route = createFileRoute('/api/public/find-jobs')({
  server: { handlers: { POST: async ({ request }) => {
    const db = await mailAdminDb(request);
    if (!db) return Response.json({ error: 'Admin sign-in required' }, { status: 403 });
    let input: z.infer<typeof schema>;
    try { input = schema.parse(await request.json()); } catch { return Response.json({ error: 'Choose between 4 and 30 jobs' }, { status: 400 }); }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: 'Add GEMINI_API_KEY in Cloudflare (your Worker → Settings → Variables and Secrets) and redeploy to search the web for jobs.' }, { status: 503 });
    try {
      const count = clampJobCount(input.count);
      const { data: existing } = await db.from('jobs').select('source_url').not('source_url', 'is', null).limit(2000);
      const raw = await searchWithGemini(apiKey, count, (input.query || '').trim(), (input.location || '').trim());
      const cleaned = cleanFoundJobs(raw, (existing || []).map((r: any) => r.source_url), count + 6);
      const live = (await keepLive(cleaned)).slice(0, count);
      return Response.json({ jobs: live, found: raw.length, dropped: cleaned.length - live.length });
    } catch (e) {
      console.error('find-jobs failed', e);
      return Response.json({ error: e instanceof Error ? e.message : 'Job search failed' }, { status: 502 });
    }
  } } },
});

import { createFileRoute } from '@tanstack/react-router';
import { databaseUrl, databaseKey } from "@/lib/database-target";

// XML sitemap for search engines: static pages plus every active job.
const STATIC_PATHS = ['/', '/jobs', '/assessments', '/interview-prep', '/certifications', '/contact'];

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function fetchJobUrls(): Promise<{ id: string; updated_at: string }[]> {
  const base = databaseUrl();
  const key = databaseKey();
  if (!base || !key) return [];
  try {
    const res = await fetch(
      `${base}/rest/v1/jobs?select=id,updated_at&is_active=eq.true&order=updated_at.desc&limit=1000`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) {
      console.error(`Sitemap jobs fetch failed [${res.status}]: ${await res.text()}`);
      return [];
    }
    return (await res.json()) as { id: string; updated_at: string }[];
  } catch (e) {
    console.error('Sitemap jobs fetch error:', e);
    return [];
  }
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const jobs = await fetchJobUrls();
        const urls = [
          ...STATIC_PATHS.map(
            (p) => `  <url><loc>${xmlEscape(origin + p)}</loc><changefreq>weekly</changefreq></url>`,
          ),
          ...jobs.map(
            (j) =>
              `  <url><loc>${xmlEscape(`${origin}/jobs/${j.id}`)}</loc><lastmod>${j.updated_at}</lastmod><changefreq>daily</changefreq></url>`,
          ),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
        return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
      },
    },
  },
});

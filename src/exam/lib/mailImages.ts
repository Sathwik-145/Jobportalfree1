// Built-in email pictures live in public/email/ and are served from the site's own address.
// Set VITE_SITE_URL (for example https://jobportalfree.example.com) so pictures in sent emails
// point at your live site instead of the fallback address below.
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
export const MAIL_ASSET_ORIGIN = String(env.VITE_SITE_URL || 'https://jobportalfree.pages.dev').replace(/\/+$/, '');

const IMAGES = [
  { id: 'logo', name: 'JobPortalFree logo', file: 'logo.png' },
  { id: 'welcome-logo', name: 'Welcome banner with logo', file: 'welcome-logo.jpg' },
  { id: 'welcome', name: 'Welcome', file: 'welcome.jpg' },
  { id: 'assessment', name: 'Assessment', file: 'assessment.jpg' },
  { id: 'interview', name: 'Interview preparation', file: 'interview.jpg' },
  { id: 'success', name: 'Congratulations', file: 'success.jpg' },
  { id: 'certificate', name: 'Certificate', file: 'certificate.jpg' },
  { id: 'celebration', name: 'Celebration', file: 'celebration.jpg' },
  { id: 'reminder', name: 'Reminder', file: 'reminder.jpg' },
  { id: 'deadline', name: 'Deadline', file: 'deadline.jpg' },
  { id: 'tips', name: 'Study tips', file: 'tips.jpg' },
  { id: 'thankyou', name: 'Thank you', file: 'thankyou.jpg' },
];

export const MAIL_IMAGES = IMAGES.map(({ id, name, file }) => ({
  id,
  name,
  legacy: `/email/${file}`,
  url: `${MAIL_ASSET_ORIGIN}/email/${file}`,
}));

/** Accept direct public HTTPS images, not page markup, local URLs or data URLs. */
export function resolveMailImageUrl(value: string): string | null {
  const clean = value.trim();
  const legacy = MAIL_IMAGES.find(image => clean === image.legacy || clean === `{{siteUrl}}${image.legacy}`);
  if (legacy) return legacy.url;
  try {
    const url = new URL(clean, MAIL_ASSET_ORIGIN);
    const known = MAIL_IMAGES.find(image => url.pathname === image.legacy);
    if (known) return known.url;
    if (url.protocol !== 'https:' || url.username || url.password || /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(url.hostname)) return null;
    if (!clean.startsWith('https://')) return null;
    return url.href;
  } catch { return null; }
}

/**
 * Forgiving readers for the Supabase environment variables.
 * Pasting values into a dashboard often adds quotes, spaces, a trailing "/" or a path such as
 * "/rest/v1", and any of those makes Supabase answer "Invalid path specified in request URL"
 * or the browser throw "Invalid URL". These helpers clean the value so the app still works.
 */

/** Trim spaces and one pair of surrounding quotes. */
export function cleanEnvValue(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();
}

/**
 * Turn whatever was pasted into the bare project address: https://<ref>.supabase.co
 * Accepts a missing https://, a trailing slash, an extra path (/rest/v1, /auth/v1 ...),
 * or just the project ref.
 */
export function cleanSupabaseUrl(value: unknown): string {
  const raw = cleanEnvValue(value);
  if (!raw) return "";
  if (/^[a-z0-9]{15,30}$/i.test(raw)) return `https://${raw.toLowerCase()}.supabase.co`;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return raw;
  }
}

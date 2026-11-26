/**
 * Website server access without the database's secret server key.
 * The server sends its CRON_SECRET in a private header; the database only stores
 * its SHA-256 fingerprint (linked once by a signed-in main admin).
 */
export function serverAccessKey(): string {
  const k = process.env['CRON_SECRET'] || '';
  return k.length >= 16 ? k : '';
}

export async function serverAccessHash(key = serverAccessKey()) {
  if (!key) return '';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return Array.from(new Uint8Array(buf), x => x.toString(16).padStart(2, '0')).join('');
}

/** True when the database recognises this website server (or a real server key is set). */
export async function serverAccessReady(): Promise<boolean> {
  const { serverDb, hasServerKey } = await import('@/lib/credential-mailer.server');
  if (hasServerKey()) return true;
  if (!serverAccessKey()) return false;
  const { data, error } = await (serverDb() as any).rpc('server_request');
  return !error && data === true;
}

/** Links this website server using a verified main admin's own database session. */
export async function linkServerAccess(adminDb: any, label = 'website'): Promise<boolean> {
  if (await serverAccessReady()) return true;
  const hash = await serverAccessHash();
  if (!hash) return false;
  const { error } = await adminDb.rpc('register_server_key', { _hash: hash, _label: label.slice(0, 60) });
  if (error) return false;
  return serverAccessReady();
}

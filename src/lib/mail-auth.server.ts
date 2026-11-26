import { createClient } from '@supabase/supabase-js';
import { databaseUrl, databaseKey } from "@/lib/database-target";

export async function mailAdminDb(request: Request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const url = databaseUrl();
  const key = databaseKey();
  if (!token || !url || !key) return null;
  const db = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  const role = await db.rpc('has_role', { _user_id: data.user.id, _role: 'admin' });
  return !role.error && role.data === true ? db : null;
}

export async function schedulerAuthorized(request: Request) {
  const expected = process.env['CRON_SECRET'];
  const provided = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (expected && provided.length === expected.length) {
    let difference = 0;
    for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
    if (difference === 0) return true;
  }
  return !!(await mailAdminDb(request));
}
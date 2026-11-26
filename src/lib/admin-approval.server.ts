import { createClient } from '@supabase/supabase-js';
import { ADMIN_APPROVAL_EMAIL, ADMIN_APPROVAL_KEY, APPROVAL_LIFETIME_MS, approvalStatus } from './adminApproval';
import { createBrevoTransport } from './brevo-mail.server';
import { renderMail } from '@/exam/lib/mailContent';
import { SYSTEM_TEMPLATES_KEY, resolveTemplate } from './system-mail-templates';
import { linkServerAccess } from './server-access.server';
import { databaseUrl, databaseKey } from "@/lib/database-target";

/** Private database access: the server key when set, otherwise the linked website server header. */
async function privateDb(): Promise<any> {
  const { serverDb } = await import('./credential-mailer.server');
  return serverDb();
}

async function approvalIdentity(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  const url = databaseUrl();
  const key = databaseKey();
  if (!token || !url || !key) throw new Error('Sign in required');
  const db = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new Error('Sign in required');
  const roles = await db.from('user_roles').select('role').eq('user_id', data.user.id);
  if (roles.error || !roles.data?.some(r => r.role === 'admin' || r.role === 'subadmin')) throw new Error('Admin account required');
  // Decode only after auth.getUser has verified the token with the auth service.
  const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  const sessionId = typeof payload.session_id === 'string' && /^[0-9a-f-]{36}$/i.test(payload.session_id) ? payload.session_id as string : '';
  return { db, user: data.user, sessionId };
}
function requireSession(identity: { sessionId: string }) {
  if (!identity.sessionId) throw new Error('Sign in again to start a new session');
}
async function approvalEnabled(db: any) {
  const { data, error } = await db.from('site_settings').select('value').eq('key', ADMIN_APPROVAL_KEY).maybeSingle();
  if (error) throw new Error('Could not read admin approval settings');
  return data?.value?.enabled === true;
}
export async function readApproval(request: Request) {
  const identity = await approvalIdentity(request);
  // Each admin visit keeps the website server linked (needed for emails and student logins).
  await linkServerAccess(identity.db).catch(() => false);
  if (!(await approvalEnabled(identity.db))) return { status: 'disabled' as const };
  requireSession(identity);
  const { data, error } = await identity.db.from('admin_login_approvals').select('status,expires_at').eq('session_id', identity.sessionId).maybeSingle();
  if (error) throw new Error('Admin approval setup must be installed before access can be granted');
  return { status: approvalStatus(data), expiresAt: data?.expires_at };
}
export async function requestApproval(request: Request) {
  const identity = await approvalIdentity(request);
  if (!(await approvalEnabled(identity.db))) return { status: 'disabled' as const };
  requireSession(identity);
  const { data: existing, error } = await identity.db.from('admin_login_approvals').select('status,expires_at').eq('session_id', identity.sessionId).maybeSingle();
  if (error) throw new Error('Admin approval setup must be installed first');
  if (existing) return { status: approvalStatus(existing), expiresAt: existing.expires_at };
  await linkServerAccess(identity.db);
  const db = await privateDb();
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + APPROVAL_LIFETIME_MS).toISOString();
  const { error: insertError } = await db.from('admin_login_approvals').insert({ user_id: identity.user.id, session_id: identity.sessionId, email: identity.user.email || '', token_hash: await hashToken(token), expires_at: expiresAt });
  if (insertError?.code === '23505') return readApproval(request);
  if (insertError) throw new Error('Could not create approval request');
  try {
    const configured = process.env['APP_URL'] || new URL(request.url).origin;
    const url = new URL('/api/public/admin-approval', configured);
    url.searchParams.set('token', token);
    const transport = createBrevoTransport(process.env['BREVO_SENDER_EMAIL'] || ADMIN_APPROVAL_EMAIL, 'JobPortalFree');
    const saved = await db.from('codexam_settings').select('value').eq('key', SYSTEM_TEMPLATES_KEY).maybeSingle();
    const tpl = resolveTemplate(saved.data?.value, 'admin_approval');
    const vars = { account: identity.user.email || '', time: new Date().toUTCString(), device: (request.headers.get('user-agent') || 'Unknown device').slice(0, 160), approvalUrl: url.href };
    const subject = tpl.subject.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars as any)[k] ?? '');
    await transport.sendMail({ to: ADMIN_APPROVAL_EMAIL, subject, ...renderMail(tpl.body, vars, false) });
  } catch (error) {
    await db.from('admin_login_approvals').delete().eq('session_id', identity.sessionId).eq('status', 'pending');
    throw error;
  }
  return { status: 'pending' as const, expiresAt };
}
export async function saveApprovalSettings(request: Request, enabled: boolean) {
  const { db, user } = await approvalIdentity(request);
  const admin = await db.rpc('has_role', { _user_id: user.id, _role: 'admin' });
  if (admin.error || admin.data !== true) throw new Error('Approved administrator required');
  if (enabled) {
    // Turning OFF always works; turning ON needs the approval tables, email and server access.
    const ready = await db.rpc('admin_approval_identity');
    if (ready.error) throw new Error('Run the database update (upgrade-existing-database.sql) once in the database SQL editor, then turn this on.');
    if (!process.env['BREVO_API_KEY']) throw new Error('Add BREVO_API_KEY to the website settings so approval emails can be sent.');
    if (!(await linkServerAccess(db))) throw new Error('The website server could not be linked. Make sure CRON_SECRET (at least 16 characters) is set on the website, then try again.');
  }
  const { error } = await db.from('site_settings').upsert({ key: ADMIN_APPROVAL_KEY, value: { enabled }, updated_at: new Date().toISOString() });
  if (error) throw new Error('Could not save approval settings');
  return { enabled };
}
async function hashToken(token: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), x => x.toString(16).padStart(2, '0')).join('');
}
export async function decideApproval(token: string, decision: 'approved' | 'denied') {
  if (!/^[0-9a-f-]{72}$/i.test(token)) throw new Error('Invalid approval link');
  const db = await privateDb();
  const { data, error } = await db.from('admin_login_approvals').update({ status: decision, decided_at: new Date().toISOString() }).eq('token_hash', await hashToken(token)).eq('status', 'pending').gt('expires_at', new Date().toISOString()).select('id');
  if (error || !data?.length) throw new Error('This link expired or has already been used. Sign in again for a new request.');
}
async function requireApprovedAdmin(request: Request) {
  const identity = await approvalIdentity(request);
  const admin = await identity.db.rpc('has_role', { _user_id: identity.user.id, _role: 'admin' });
  if (admin.error || admin.data !== true) throw new Error('Only a main admin can approve sign-ins');
  if (await approvalEnabled(identity.db)) {
    requireSession(identity);
    const own = await identity.db.from('admin_login_approvals').select('status,expires_at').eq('session_id', identity.sessionId).maybeSingle();
    if (approvalStatus(own.data) !== 'approved') throw new Error('Your own sign-in must be approved first');
  }
  return identity;
}
export async function listPending(request: Request) {
  const identity = await requireApprovedAdmin(request);
  await linkServerAccess(identity.db).catch(() => false);
  if (!(await approvalEnabled(identity.db))) return { requests: [], enabled: false };
  const { data, error } = await (await privateDb()).from('admin_login_approvals').select('id,email,status,created_at,expires_at').eq('status', 'pending').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(50);
  if (error) throw new Error('Could not load sign-in requests');
  return { requests: data || [], enabled: true };
}
export async function decideById(request: Request, id: string, decision: 'approved' | 'denied') {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid request');
  const identity = await requireApprovedAdmin(request);
  requireSession(identity);
  const { data, error } = await (await privateDb()).from('admin_login_approvals').update({ status: decision, decided_at: new Date().toISOString() }).eq('id', id).eq('status', 'pending').neq('session_id', identity.sessionId).gt('expires_at', new Date().toISOString()).select('id');
  if (error || !data?.length) throw new Error('This request expired or was already handled');
  return { ok: true };
}

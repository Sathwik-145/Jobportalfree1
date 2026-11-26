import { supabase } from '@/lib/db-client';
import type { AdminEvent } from './admin-events';
export type { AdminEvent } from './admin-events';
// Identity and event content are read back from saved records by the server.
export function notifyAdmin(event: AdminEvent, data: { name?: string; email?: string; studentId?: string; examId?: string; eventId?: string; detail?: string } = {}) {
  try {
    void supabase.auth.getSession().then(({ data: auth }) => fetch('/api/public/notify-admin', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth.session ? { Authorization: `Bearer ${auth.session.access_token}` } : {}) }, body: JSON.stringify({ event, ...data }), keepalive: true })).catch(() => {});
  } catch { /* ignore */ }
}

import { supabase } from "@/lib/db-client";

const KEY = "jpf_admin_session_id";

function deviceLabel(ua: string) {
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Unknown OS";
  const br = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  return `${br} on ${os}`;
}

/** Record a new admin sign-in and email the owner (if the alert is switched on). */
export async function startAdminSession(userId: string, email: string) {
  const ua = navigator.userAgent.slice(0, 400);
  const { data } = await supabase.from("admin_sessions").insert({ user_id: userId, email, device: deviceLabel(ua), user_agent: ua }).select("id").single();
  if (data?.id) localStorage.setItem(KEY, data.id);
  const { data: s } = await supabase.auth.getSession();
  fetch("/api/public/notify-admin", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(s.session ? { Authorization: `Bearer ${s.session.access_token}` } : {}) },
    body: JSON.stringify({ event: "admin_login", eventId: data?.id, detail: deviceLabel(ua) }),
  }).catch(() => {});
}

/** Heartbeat; returns false when this session was logged out remotely. */
export async function checkAdminSession(): Promise<boolean> {
  const id = localStorage.getItem(KEY);
  if (!id) return true;
  const { data } = await supabase.from("admin_sessions").select("revoked_at").eq("id", id).maybeSingle();
  if (data?.revoked_at) { localStorage.removeItem(KEY); return false; }
  await supabase.from("admin_sessions").update({ last_seen: new Date().toISOString() }).eq("id", id);
  return true;
}

export async function endAdminSession() {
  const id = localStorage.getItem(KEY);
  if (id) await supabase.from("admin_sessions").update({ ended_at: new Date().toISOString() }).eq("id", id);
  localStorage.removeItem(KEY);
}

export const currentAdminSessionId = () => localStorage.getItem(KEY);

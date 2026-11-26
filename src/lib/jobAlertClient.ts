import { supabase } from "@/lib/db-client";

export type JobAlertResult = { sent?: number | boolean; failed?: number; people?: number; skipped?: number; reason?: string; matches?: number; error?: string };

async function call(body: unknown): Promise<JobAlertResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { error: "Sign in required" };
  try {
    const res = await fetch("/api/public/job-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as JobAlertResult;
    return res.ok ? json : { error: json.error || `Request failed (${res.status})` };
  } catch (e: any) {
    return { error: String(e?.message || e) };
  }
}

/** Emails the signed-in person a confirmation of the alerts they just saved. */
export const confirmAlertsSaved = () => call({ action: "saved" });

/** Emails everyone whose saved alerts match these newly published jobs (staff only). */
export const sendJobAlertsFor = (jobIds: string[]) =>
  jobIds.length ? call({ action: "jobs_posted", jobIds: jobIds.slice(0, 100) }) : Promise.resolve({ sent: 0 } as JobAlertResult);

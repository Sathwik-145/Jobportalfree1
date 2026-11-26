import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/db-client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Loader2, MailCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_APPROVAL_EMAIL, ADMIN_APPROVAL_KEY } from "@/lib/adminApproval";

async function call(method: "GET" | "POST", body?: unknown) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You are signed out. Sign in again.");
  const r = await fetch("/api/public/admin-approval", {
    method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({ error: `Approval service did not answer (status ${r.status}).` }));
  if (!r.ok || j.error) throw new Error(j.error || "Request failed");
  return j as { status?: string; enabled?: boolean; requests?: { id: string; email: string; created_at: string; expires_at: string }[] };
}

/** On/off switch shown in Admin Controls. */
export function AdminApprovalSwitch() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", ADMIN_APPROVAL_KEY).maybeSingle()
      .then(({ data }) => setEnabled((data?.value as any)?.enabled === true));
  }, []);
  const change = async (v: boolean) => {
    setBusy(true); setError("");
    try { await call("POST", { action: "settings", enabled: v }); setEnabled(v); toast.success(v ? "Admin sign-in approval is ON" : "Admin sign-in approval is OFF"); }
    catch (e) { const m = e instanceof Error ? e.message : "Could not save"; setError(m); toast.error(m); }
    finally { setBusy(false); }
  };
  return (
    <Card className="border-primary/30">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
            <div>
              <h2 className="font-semibold">Approve every admin sign-in</h2>
              <p className="text-sm text-muted-foreground">When on, a new admin sign-in stays blocked until you approve it from the email sent to <b>{ADMIN_APPROVAL_EMAIL}</b>.</p>
            </div>
          </div>
          <Switch aria-label="Approve every admin sign-in" checked={enabled} disabled={busy} onCheckedChange={change} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive flex items-start gap-2 rounded-lg bg-destructive/10 p-3"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> Not working: {error}</p>}
      </CardContent>
    </Card>
  );
}

/** Blocks the admin panel until this sign-in is approved (when the switch is on). */
export function AdminApprovalGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<string>("loading");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const check = async () => {
    try { const j = await call("GET"); setStatus(j.status || "disabled"); setError(""); }
    catch (e) { const m = e instanceof Error ? e.message : ""; if (/setup|installed/i.test(m)) setStatus("disabled"); else { setError(m); setStatus("error"); } }
  };
  useEffect(() => { check(); }, []);
  useEffect(() => { if (status !== "pending") return; const t = setInterval(check, 5000); return () => clearInterval(t); }, [status]);
  const request = async () => {
    setSending(true); setError("");
    try { const j = await call("POST", { action: "request" }); setStatus(j.status || "pending"); toast.success(`Approval email sent to ${ADMIN_APPROVAL_EMAIL}`); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not send"); }
    finally { setSending(false); }
  };
  if (status === "disabled" || status === "approved") return <>{children}</>;
  if (status === "loading") return <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <MailCheck className="w-12 h-12 text-primary mx-auto" />
          <h1 className="font-display text-2xl font-bold">Waiting for approval</h1>
          <p className="text-muted-foreground">
            {status === "pending" ? <>An approval email was sent to <b>{ADMIN_APPROVAL_EMAIL}</b>. This page opens by itself once it is approved.</>
              : status === "denied" ? "This sign-in was denied. Sign out and sign in again to make a new request."
              : status === "expired" ? "The approval request expired. Send a new one."
              : <>This sign-in needs approval from <b>{ADMIN_APPROVAL_EMAIL}</b>.</>}
          </p>
          {status === "pending" && <p className="text-sm flex items-center justify-center gap-2 text-primary"><Loader2 className="w-4 h-4 animate-spin" /> Checking every 5 seconds…</p>}
          {status !== "pending" && status !== "denied" && <Button onClick={request} disabled={sending}>{sending ? "Sending…" : "Send approval email"}</Button>}
          {error && <p role="alert" className="text-sm text-destructive flex items-start gap-2 text-left rounded-lg bg-destructive/10 p-3"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> Not working: {error}</p>}
          {status === "approved" && <CheckCircle2 className="w-6 h-6 text-primary mx-auto" />}
          <Button variant="ghost" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}>Sign out</Button>
        </CardContent>
      </Card>
    </div>
  );
}

/** Pending admin sign-ins that can be approved right here on the website. */
export function PendingApprovals() {
  const [rows, setRows] = useState<{ id: string; email: string; created_at: string; expires_at: string }[]>([]);
  const [error, setError] = useState("");
  const [on, setOn] = useState(true);
  const load = async () => { try { const j = await call("POST", { action: "list" }); setRows(j.requests || []); setOn(j.enabled !== false); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Could not load"); } };
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);
  const decide = async (id: string, decision: "approved" | "denied") => {
    try { await call("POST", { action: "decide", id, decision }); toast.success(decision === "approved" ? "Sign-in approved" : "Sign-in denied"); load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); }
  };
  return (
    <Card><CardContent className="p-5 space-y-3">
      <h2 className="font-semibold">Sign-ins waiting for approval</h2>
      <p className="text-sm text-muted-foreground">Approve here or from the email — either works. Refreshes every 15 seconds.</p>
      {error && <p role="alert" className="text-sm text-destructive flex items-start gap-2 rounded-lg bg-destructive/10 p-3"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> Not working: {error}</p>}
      {!error && !on && <p className="text-sm text-muted-foreground">Approval is off, so admins sign in straight away. Turn on the switch above to start approving sign-ins.</p>}
      {!error && on && !rows.length && <p className="text-sm text-muted-foreground">No sign-ins are waiting.</p>}
      {rows.map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
        <div className="text-sm"><b>{r.email}</b><br /><span className="text-muted-foreground">Asked {new Date(r.created_at).toLocaleString()} · expires {new Date(r.expires_at).toLocaleTimeString()}</span></div>
        <div className="flex gap-2"><Button size="sm" onClick={() => decide(r.id, "approved")}><CheckCircle2 className="w-4 h-4 mr-1" /> Approve</Button><Button size="sm" variant="outline" onClick={() => decide(r.id, "denied")}>Deny</Button></div>
      </div>)}
    </CardContent></Card>
  );
}

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/db-client";
import SystemTemplatesEditor from "@/exam/components/SystemTemplatesEditor";
import { mailRequestHeaders } from "@/exam/lib/mailRequest";

export default function SignupVerification() {
  const [require, setRequire] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const load = () => {
    supabase.from("site_settings").select("value").eq("key", "auth").maybeSingle().then(({ data }) => setRequire(!!(data?.value as any)?.requireEmailVerification));
    supabase.from("profiles").select("user_id,full_name,email,email_verified,created_at").order("created_at", { ascending: false }).limit(500).then(({ data }) => setRows(data || []));
  };
  useEffect(load, []);

  const toggle = async (v: boolean) => {
    setRequire(v);
    const { error } = await supabase.from("site_settings").upsert({ key: "auth", value: { requireEmailVerification: v }, updated_at: new Date().toISOString() });
    if (error) { toast.error("Could not save — admin access needed"); setRequire(!v); }
    else toast.success(v ? "New sign-ups must verify their email" : "Verification OFF — new users sign in directly");
  };
  const markVerified = async (id: string) => {
    const { error } = await supabase.from("profiles").update({ email_verified: true, verify_token: null }).eq("user_id", id);
    if (error) toast.error(error.message); else { toast.success("Marked as verified"); load(); }
  };
  const resend = async (email: string) => {
    const r = await fetch("/api/public/send-verification", { method: "POST", headers: await mailRequestHeaders(), body: JSON.stringify({ email }) });
    const j = await r.json().catch(() => ({}));
    r.ok ? toast.success("Verification email sent") : toast.error(j?.error || "Email could not be sent", { duration: 10000 });
  };
  const [testTo, setTestTo] = useState("");
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<any>(null);
  const runCheck = async () => {
    setChecking(true);
    try {
      const r = await fetch("/api/public/mail-check", { method: "POST", headers: await mailRequestHeaders(), body: JSON.stringify({ to: testTo.trim() || undefined }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) toast.error(j?.error || "Check failed"); else setCheck(j);
    } finally { setChecking(false); }
  };
  const list = rows.filter((r) => `${r.full_name} ${r.email}`.toLowerCase().includes(q.toLowerCase()));
  const pending = rows.filter((r) => r.email_verified === false).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">New sign-ups & verification</h1>
        <p className="text-sm text-muted-foreground">{rows.length} accounts · {pending} waiting for verification</p>
      </div>
      <Card><CardContent className="p-5 flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold">Email verification for new sign-ups</div>
          <p className="text-xs text-muted-foreground">ON: new users must click the email link before signing in. OFF: they sign in right away.</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">{require ? "ON" : "OFF"}<Switch checked={require} onCheckedChange={toggle} /></label>
      </CardContent></Card>
      <Card><CardContent className="p-5 space-y-3">
        <div>
          <div className="font-semibold">Email delivery check</div>
          <p className="text-xs text-muted-foreground">Checks the live server's email setup and tells you exactly why emails fail. Add an address to also send a real test email.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Send a test email to (optional)" value={testTo} onChange={(e) => setTestTo(e.target.value)} className="max-w-xs" />
          <Button onClick={runCheck} disabled={checking}>{checking ? "Checking…" : "Check email setup"}</Button>
        </div>
        {check && (
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              {Object.entries(check.config || {}).map(([k, v]) => (
                <span key={k} className={`rounded-md border px-2 py-0.5 text-xs ${v ? "text-primary" : "text-destructive"}`}>{v ? "✓" : "✗"} {k}</span>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">Sender: {check.sender} · Brevo sender status: {check.senderStatus}{check.account ? ` · Brevo account: ${check.account}` : ""}</div>
            {check.problems?.length ? (
              <ul className="list-disc pl-5 text-destructive space-y-1">{check.problems.map((p: string) => <li key={p}>{p}</li>)}</ul>
            ) : <p className="text-primary font-medium">No setup problems found.</p>}
            {check.test && (check.test.ok
              ? <p className="text-primary font-medium">Test email accepted by Brevo. Check the inbox (and spam).</p>
              : <p className="text-destructive font-medium">Test email failed: {check.test.error}</p>)}
          </div>
        )}
      </CardContent></Card>
      <Input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      <Card><CardContent className="p-0 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs"><tr className="text-left"><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Status</th><th className="p-3">Joined</th><th className="p-3" /></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.user_id} className="border-t">
                <td className="p-3">{p.full_name || "—"}</td>
                <td className="p-3">{p.email}</td>
                <td className="p-3"><span className={p.email_verified ? "text-primary font-medium" : "text-destructive font-medium"}>{p.email_verified ? "Verified" : "Pending"}</span></td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</td>
                <td className="p-3 text-right whitespace-nowrap space-x-2">
                  {!p.email_verified && <>
                    <Button size="sm" variant="outline" onClick={() => resend(p.email)}>Resend link</Button>
                    <Button size="sm" onClick={() => markVerified(p.user_id)}>Mark verified</Button>
                  </>}
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No sign-ups found.</td></tr>}
          </tbody>
        </table>
      </CardContent></Card>
      <Card><CardContent className="p-5">
        <h2 className="font-semibold">Verify email template</h2>
        <p className="text-xs text-muted-foreground mb-4">The message sent when someone signs up or you click "Resend link". Use the formatting codes below the box to add a button, links, bold text and more.</p>
        <SystemTemplatesEditor only={["verify_email"]} />
      </CardContent></Card>
    </div>
  );
}

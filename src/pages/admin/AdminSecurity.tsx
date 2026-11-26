import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldCheck, MailWarning } from "lucide-react";
import { fetchKey, saveKey } from "@/exam/lib/codexamSettings";
import { PASSWORD_REMINDER_EMAIL, PASSWORD_ROTATION_DAYS, daysUntilRotation, type PasswordMeta } from "@/lib/passwordReminder";

const KEY = "admin_password_meta";

export default function AdminSecurity() {
  const [meta, setMeta] = useState<PasswordMeta>({});
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetchKey(KEY, {}).then((m: PasswordMeta) => setMeta(m || {})); }, []);

  const left = daysUntilRotation(meta);
  const change = async () => {
    if (pw.length < 8) return toast.error("Use at least 8 characters");
    if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return toast.error("Include at least one capital letter and one number");
    if (pw !== pw2) return toast.error("The two passwords do not match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setBusy(false); return toast.error(error.message); }
    const next = { ...meta, changedAt: Date.now() };
    try { await saveKey(KEY, next); setMeta(next); } catch { /* password still changed */ }
    setPw(""); setPw2(""); setBusy(false);
    toast.success("Admin password changed. Use it next time you sign in.");
  };
  const toggle = async (enabled: boolean) => {
    const next = { ...meta, enabled };
    setMeta(next);
    try { await saveKey(KEY, next); toast.success(enabled ? "Reminders on" : "Reminders off"); } catch { toast.error("Could not save"); }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-primary" /> Admin password</h1>
        <p className="text-sm text-muted-foreground mt-1">Change the password you use to sign in to this admin panel.</p>
      </div>

      <Card><CardContent className="p-5 space-y-4">
        <div className="rounded-xl border bg-muted/50 p-3 text-sm">
          {meta.changedAt ? <>Last changed on <b>{new Date(meta.changedAt).toLocaleDateString()}</b>. </> : <>No password change recorded yet. </>}
          {left !== null && (left > 0 ? <>Next change due in <b>{left} days</b>.</> : <b className="text-destructive">Password change is overdue — please change it now.</b>)}
        </div>
        <div className="space-y-2"><Label htmlFor="np">New password</Label><Input id="np" type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="np2">Confirm new password</Label><Input id="np2" type="password" autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} /></div>
        <Button onClick={change} disabled={busy} className="gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Change password</Button>
      </CardContent></Card>

      <Card><CardContent className="p-5 flex items-start justify-between gap-4">
        <div className="text-sm">
          <p className="font-semibold flex items-center gap-2"><MailWarning className="w-4 h-4 text-primary" /> Reset reminder every {PASSWORD_ROTATION_DAYS} days</p>
          <p className="text-muted-foreground mt-1">An email goes to <b>{PASSWORD_REMINDER_EMAIL}</b> when the admin password has not been changed for {PASSWORD_ROTATION_DAYS} days.
            {meta.lastReminderAt ? ` Last reminder: ${new Date(meta.lastReminderAt).toLocaleDateString()}.` : ""}</p>
        </div>
        <Switch checked={meta.enabled !== false} onCheckedChange={toggle} aria-label="Password reminder emails" />
      </CardContent></Card>
    </div>
  );
}

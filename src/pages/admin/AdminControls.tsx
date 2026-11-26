import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/db-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "@/lib/router-compat";
import { Bell, Camera, LogOut, Monitor, Shuffle, SlidersHorizontal, Trash2 } from "lucide-react";
import { fetchKey, saveKey } from "@/exam/lib/codexamSettings";
import { ADMIN_EVENTS } from "@/lib/admin-events";
import { DEFAULT_MEDIA, MEDIA_KEY, type MediaSettings } from "@/exam/components/MediaProctor";
import { currentAdminSessionId } from "@/lib/adminSessions";
import { AdminApprovalSwitch, PendingApprovals } from "@/components/AdminApproval";
import SystemTemplatesEditor from "@/exam/components/SystemTemplatesEditor";

type Session = { id: string; email: string | null; device: string | null; created_at: string; last_seen: string; revoked_at: string | null; ended_at: string | null };
type Recipients = { all?: string[]; events?: Record<string, string[]> };
const fmt = (d: string) => new Date(d).toLocaleString();
const isActive = (s: Session) => !s.revoked_at && !s.ended_at && Date.now() - new Date(s.last_seen).getTime() < 10 * 60 * 1000;
const splitEmails = (v: string) => v.split(/[\s,;]+/).map(x => x.trim().toLowerCase()).filter(x => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x));

export default function AdminControls() {
  // ---- sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const loadSessions = async () => {
    const { data } = await supabase.from("admin_sessions").select("*").order("created_at", { ascending: false }).limit(500);
    setSessions((data as Session[]) || []);
  };
  const filtered = useMemo(() => sessions.filter(s => (!from || s.created_at >= new Date(from).toISOString()) && (!to || s.created_at <= new Date(to).toISOString())), [sessions, from, to]);
  const logoutAll = async () => {
    if (!confirm("Log out every admin on every device, including this one?")) return;
    const { error } = await supabase.from("admin_sessions").update({ revoked_at: new Date().toISOString() }).is("revoked_at", null);
    if (error) return toast.error(error.message);
    await supabase.auth.signOut({ scope: "global" });
    window.location.href = "/login";
  };
  const revoke = async (id: string) => {
    await supabase.from("admin_sessions").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    toast.success("That device will be logged out within a minute"); loadSessions();
  };

  // ---- alerts
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [rcpt, setRcpt] = useState<Recipients>({});
  const [allText, setAllText] = useState("");
  // ---- proctoring
  const [media, setMedia] = useState<MediaSettings>(DEFAULT_MEDIA);
  useEffect(() => {
    loadSessions();
    fetchKey("admin_notify", {}).then((p: any) => setPrefs(p || {}));
    fetchKey("admin_notify_recipients", {}).then((r: Recipients) => { setRcpt(r || {}); setAllText((r?.all || []).join(", ")); });
    fetchKey(MEDIA_KEY, DEFAULT_MEDIA).then((m: MediaSettings) => setMedia({ ...DEFAULT_MEDIA, ...(m || {}) }));
  }, []);

  const saveAlerts = async () => {
    const next = { ...rcpt, all: splitEmails(allText) };
    try { await saveKey("admin_notify", prefs); await saveKey("admin_notify_recipients", next); setRcpt(next); toast.success("Alert settings saved"); }
    catch { toast.error("Could not save"); }
  };
  const saveMedia = async (m: MediaSettings) => { setMedia(m); try { await saveKey(MEDIA_KEY, m); toast.success("Saved for all tests"); } catch { toast.error("Could not save"); } };

  const me = currentAdminSessionId();

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><SlidersHorizontal className="w-6 h-6 text-primary" /> Admin Controls</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign-in alerts, devices, test monitoring and alert email wording in one place. Random MCQ tests are in Exam Settings → Schedules.</p>
      </div>

      <AdminApprovalSwitch />
      <PendingApprovals />
      <Card><CardContent className="p-5"><h2 className="font-semibold mb-3">Approval email wording</h2><SystemTemplatesEditor only={["admin_approval"]} /></CardContent></Card>

      {/* Alerts */}
      <Card><CardContent className="p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Alert emails to admin</h2>
        <label className="flex items-center justify-between gap-3 rounded-xl border p-3 bg-muted/40">
          <span className="text-sm"><b>Email jobportalfreeofficial@gmail.com whenever an admin signs in</b><br /><span className="text-muted-foreground">Includes the device used.</span></span>
          <Switch checked={prefs.admin_login !== false} onCheckedChange={v => setPrefs({ ...prefs, admin_login: v })} />
        </label>
        <label className="flex items-center justify-between text-sm"><b>All alerts</b><Switch checked={prefs.all !== false} onCheckedChange={v => setPrefs({ ...prefs, all: v })} /></label>
        <div className="grid sm:grid-cols-2 gap-2">
          {Object.entries(ADMIN_EVENTS).map(([ev, c]) => (
            <div key={ev} className="rounded-xl border p-3 space-y-2">
              <label className="flex items-center justify-between text-sm gap-2"><span>Someone {c.title}</span><Switch checked={prefs[ev] !== false} onCheckedChange={v => setPrefs({ ...prefs, [ev]: v })} /></label>
              <Input placeholder="Extra emails for this alert (optional)" defaultValue={(rcpt.events?.[ev] || []).join(", ")}
                onBlur={e => setRcpt(r => ({ ...r, events: { ...(r.events || {}), [ev]: splitEmails(e.target.value) } }))} />
            </div>
          ))}
        </div>
        <div className="space-y-1"><span className="text-sm font-medium">Also send every alert to</span>
          <Input placeholder="name@example.com, other@example.com" value={allText} onChange={e => setAllText(e.target.value)} /></div>
        <Button onClick={saveAlerts}>Save alert settings</Button>
        <div className="pt-2 border-t"><h3 className="font-semibold text-sm mb-2">Alert email wording</h3><SystemTemplatesEditor only={["admin_alert"]} /></div>
      </CardContent></Card>

      {/* Proctoring now lives in the exam portal only */}
      <Card><CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2"><Camera className="w-4 h-4 text-primary" /> Exam monitoring & recordings</h2>
          <p className="text-sm text-muted-foreground">Camera, microphone, screen-sharing and recording switches are in the CodeXam exam admin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/exam-admin/settings?tab=monitoring" className="btn-pill btn-pill-primary h-9 text-xs">Monitoring settings</Link>
          <Link to="/exam-admin/recordings" className="btn-pill btn-pill-ghost h-9 text-xs">Recordings</Link>
        </div>
      </CardContent></Card>

      {/* Sessions */}
      <Card><CardContent className="p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold flex items-center gap-2"><Monitor className="w-4 h-4 text-primary" /> Admin sign-ins and devices</h2>
          <Button variant="destructive" className="gap-2" onClick={logoutAll}><LogOut className="w-4 h-4" /> Log out all admins</Button>
        </div>
        <p className="text-sm">Active now: <b>{sessions.filter(isActive).length}</b></p>
        <div className="flex flex-wrap gap-2 items-center text-sm">
          From <Input type="datetime-local" className="w-auto" value={from} onChange={e => setFrom(e.target.value)} />
          To <Input type="datetime-local" className="w-auto" value={to} onChange={e => setTo(e.target.value)} />
          {(from || to) && <Button size="sm" variant="ghost" onClick={() => { setFrom(""); setTo(""); }}><Trash2 className="w-4 h-4" /></Button>}
        </div>
        <div className="overflow-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left"><tr><th className="p-2">Signed in (date & time)</th><th className="p-2">Admin</th><th className="p-2">Device</th><th className="p-2">Last active</th><th className="p-2">Status</th><th className="p-2"></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={6} className="p-3 text-muted-foreground">No sign-ins recorded yet.</td></tr>}
              {filtered.map(s => (
                <tr key={s.id} className="border-t">
                  <td className="p-2 whitespace-nowrap">{fmt(s.created_at)}</td><td className="p-2">{s.email}</td><td className="p-2">{s.device}{s.id === me && " (this device)"}</td>
                  <td className="p-2 whitespace-nowrap">{fmt(s.last_seen)}</td>
                  <td className="p-2">{s.revoked_at ? <Badge variant="destructive">Logged out</Badge> : s.ended_at ? <Badge variant="secondary">Signed out</Badge> : isActive(s) ? <Badge>Active</Badge> : <Badge variant="outline">Idle</Badge>}</td>
                  <td className="p-2">{!s.revoked_at && !s.ended_at && <Button size="sm" variant="outline" onClick={() => revoke(s.id)}>Log out</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent></Card>
    </div>
  );
}

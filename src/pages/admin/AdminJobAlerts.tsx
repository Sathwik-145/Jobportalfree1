import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/db-client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BellRing, RefreshCw, Search, Mail, BellOff } from "lucide-react";
import { alertsAllowed } from "@/lib/jobAlerts";

type Row = {
  id: string;
  user_id: string;
  is_active: boolean;
  admin_paused?: boolean;
  preferred_locations: string[] | null;
  preferred_job_types: string[] | null;
  preferred_skills: string[] | null;
  updated_at: string;
  name?: string;
  email?: string;
};

const list = (v: string[] | null) => (v && v.length ? v.join(", ") : "Any");

const AdminJobAlerts = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("job_preferences").select("*").order("updated_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const prefs = (data || []) as Row[];
    setNeedsUpdate(prefs.length > 0 && prefs.every((p) => p.admin_paused === undefined));
    const ids = prefs.map((p) => p.user_id);
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("user_id,full_name,email").in("user_id", ids)
      : { data: [] as any[] };
    const byId = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    setRows(prefs.map((p) => ({ ...p, name: byId.get(p.user_id)?.full_name || "", email: byId.get(p.user_id)?.email || "" })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setAllowed = async (row: Row, allowed: boolean) => {
    setBusy(row.id);
    const { error } = await supabase.from("job_preferences").update({ admin_paused: !allowed } as any).eq("id", row.id);
    setBusy(null);
    if (error) {
      toast.error(error.message.includes("admin_paused") ? "Run the database update script first (database/upgrade-existing-database.sql)." : error.message);
      return;
    }
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, admin_paused: !allowed } : r)));
    toast.success(allowed ? `Alerts switched back on for ${row.email || "this person"}` : `Alerts switched off for ${row.email || "this person"}`);
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => [r.name, r.email, list(r.preferred_locations), list(r.preferred_job_types), list(r.preferred_skills)].join(" ").toLowerCase().includes(s));
  }, [rows, q]);

  const receiving = rows.filter(alertsAllowed).length;
  const paused = rows.filter((r) => r.admin_paused).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2"><BellRing className="h-6 w-6 text-primary" /> Job alerts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Everyone who saved job alerts. New jobs you post are emailed to matching people. Switch someone off to stop their alert emails.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
      </div>

      {needsUpdate && (
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
          The per-person switch needs the latest database update. Run <span className="font-mono">database/upgrade-existing-database.sql</span> once in your database's SQL editor.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Saved alerts", value: rows.length, icon: BellRing }, { label: "Receiving emails", value: receiving, icon: Mail }, { label: "Switched off by admin", value: paused, icon: BellOff }].map((s) => (
          <Card key={s.label} className="rounded-2xl bg-card"><CardContent className="p-4">
            <s.icon className="mb-2 h-5 w-5 text-primary" />
            <p className="font-display text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search job alerts" placeholder="Search name, email, skill…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <Card className="rounded-2xl bg-card"><CardContent className="p-0">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : !filtered.length ? (
          <p className="p-6 text-sm text-muted-foreground">{rows.length ? "No one matches your search." : "No one has saved job alerts yet."}</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((r) => {
              const allowed = r.admin_paused !== true;
              return (
                <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{r.name || "Unnamed user"}</p>
                      {!r.is_active && <Badge variant="secondary">Turned off by user</Badge>}
                      {!allowed && <Badge variant="destructive">Switched off by admin</Badge>}
                      {alertsAllowed(r) && <Badge className="bg-success text-success-foreground">Receiving</Badge>}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{r.email || r.user_id}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Locations: {list(r.preferred_locations)} · Types: {list(r.preferred_job_types)} · Skills: {list(r.preferred_skills)}</p>
                  </div>
                  <label className="flex shrink-0 items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Allow alerts</span>
                    <Switch aria-label={`Allow job alerts for ${r.email || r.name}`} checked={allowed} disabled={busy === r.id} onCheckedChange={(v) => setAllowed(r, v)} />
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent></Card>
    </div>
  );
};

export default AdminJobAlerts;

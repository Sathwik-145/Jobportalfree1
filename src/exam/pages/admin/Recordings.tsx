import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/db-client";
import AdminLayout from "@/exam/components/AdminLayout";
import { Link } from "@/lib/router-compat";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Camera, MonitorUp, Trash2, Play, Loader2, Video, RefreshCw, AlertCircle } from "lucide-react";

type Rec = {
  id: string; student_id: string; student_name: string | null; student_email: string | null;
  exam_title: string | null; kind: string; path: string; size_bytes: number | null;
  started_at: string; ended_at: string; created_at: string;
};

const BUCKET = "exam-recordings";
const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const mins = (a: string, b: string) => Math.max(1, Math.round((+new Date(b) - +new Date(a)) / 1000));
const mb = (n: number | null) => (n ? `${(n / 1048576).toFixed(1)} MB` : "—");

export default function ExamRecordings() {
  const [rows, setRows] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [kind, setKind] = useState<"all" | "camera" | "screen">("all");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState<{ id: string; url: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true); setError("");
    const { data, error } = await supabase.from("exam_recordings").select("*").order("created_at", { ascending: false }).limit(1000);
    if (error) setError("Not working: recordings could not be loaded. Make sure you are signed in as the main admin and your sign-in is approved.");
    setRows((data as Rec[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const shown = useMemo(() => rows.filter(r => {
    if (kind !== "all" && r.kind !== kind) return false;
    const t = +new Date(r.started_at);
    if (from && t < +new Date(from)) return false;
    if (to && t > +new Date(to)) return false;
    const hay = `${r.student_name ?? ""} ${r.student_email ?? ""} ${r.exam_title ?? ""} ${r.student_id}`.toLowerCase();
    return !q || hay.includes(q.toLowerCase());
  }), [rows, q, from, to, kind]);

  const play = async (r: Rec) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(r.path, 3600);
    if (error || !data) { toast.error("Not working: this recording could not be opened."); return; }
    setPlaying({ id: r.id, url: data.signedUrl });
  };

  const remove = async (ids: string[]) => {
    if (!ids.length || !confirm(`Delete ${ids.length} recording${ids.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
    setBusy(true);
    const paths = rows.filter(r => ids.includes(r.id)).map(r => r.path);
    const { error: se } = await supabase.storage.from(BUCKET).remove(paths);
    const { error: de } = await supabase.from("exam_recordings").delete().in("id", ids);
    setBusy(false);
    if (se || de) { toast.error("Not working: some recordings could not be deleted."); }
    else toast.success(`Deleted ${ids.length} recording${ids.length > 1 ? "s" : ""}`);
    setPicked(new Set()); if (playing && ids.includes(playing.id)) setPlaying(null);
    void load();
  };

  const toggle = (id: string) => setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allPicked = shown.length > 0 && shown.every(r => picked.has(r.id));

  return (
    <AdminLayout>
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="page-hero">
        <p className="eyebrow mb-3"><Video className="h-3.5 w-3.5" /> Private · admins only</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Exam recordings</h1>
        <p className="mt-1 text-sm muted-on-ink">Camera and screen recordings from monitored tests, saved in 2-minute parts. Only admins can watch them.</p>
        <p className="mt-2 text-xs muted-on-ink">Turn recording on with the "Save recordings" switch in <Link to="/exam-admin/settings?tab=monitoring" className="font-semibold text-accent underline-offset-2 hover:underline">Exam settings → Monitoring</Link>.</p>
      </header>

      <Card className="rounded-2xl">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input placeholder="Search student or test" value={q} onChange={e => setQ(e.target.value)} className="lg:col-span-2" />
          <label className="text-xs text-muted-foreground">From<Input type="datetime-local" value={from} onChange={e => setFrom(e.target.value)} /></label>
          <label className="text-xs text-muted-foreground">To<Input type="datetime-local" value={to} onChange={e => setTo(e.target.value)} /></label>
          <div className="flex items-end gap-1">
            {(["all", "camera", "screen"] as const).map(k => (
              <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)} className="capitalize">{k}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && <p className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4" /> {error}</p>}

      {playing && (
        <Card className="rounded-2xl overflow-hidden">
          <video key={playing.url} src={playing.url} controls autoPlay className="w-full max-h-[70vh] bg-foreground" />
          <div className="flex justify-end p-3"><Button variant="outline" size="sm" onClick={() => setPlaying(null)}>Close player</Button></div>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{shown.length} recording{shown.length === 1 ? "" : "s"} · newest first</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-1"><RefreshCw className="h-4 w-4" /> Refresh</Button>
          <Button variant="destructive" size="sm" disabled={!picked.size || busy} onClick={() => remove([...picked])} className="gap-1">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete selected ({picked.size})
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl overflow-hidden">
        {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p> : shown.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No recordings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 w-10"><Checkbox checked={allPicked} onCheckedChange={v => setPicked(v ? new Set(shown.map(r => r.id)) : new Set())} /></th>
                  <th className="p-3 text-left">Student</th><th className="p-3 text-left">Test</th><th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Date & time</th><th className="p-3 text-left">Length</th><th className="p-3 text-left">Size</th><th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {shown.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3"><Checkbox checked={picked.has(r.id)} onCheckedChange={() => toggle(r.id)} /></td>
                    <td className="p-3"><div className="font-medium">{r.student_name || r.student_id}</div><div className="text-xs text-muted-foreground">{r.student_email}</div></td>
                    <td className="p-3">{r.exam_title || "—"}</td>
                    <td className="p-3"><span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{r.kind === "camera" ? <Camera className="h-3 w-3" /> : <MonitorUp className="h-3 w-3" />}{r.kind}</span></td>
                    <td className="p-3 whitespace-nowrap">{fmt(r.started_at)}</td>
                    <td className="p-3">{Math.floor(mins(r.started_at, r.ended_at) / 60)}m {mins(r.started_at, r.ended_at) % 60}s</td>
                    <td className="p-3">{mb(r.size_bytes)}</td>
                    <td className="p-3"><div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => play(r)} className="gap-1"><Play className="h-3.5 w-3.5" /> Watch</Button>
                      <Button size="sm" variant="ghost" onClick={() => remove([r.id])} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
    </AdminLayout>
  );
}

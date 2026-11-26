import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/db-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Search, ArrowRight, FileText, Users, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LogoSpinner from "@/components/LogoSpinner";
import { SAMPLE_APPLICATIONS } from "@/lib/sampleApplications";

interface AppRow {
  id: string;
  status: string;
  created_at: string;
  resume_url: string | null;
  user_id: string;
  job_id: string;
  profiles: { full_name: string | null; email: string | null } | null;
  jobs: { id: string; title: string | null; company: string | null } | null;
}

const STAGES = [
  { key: "applied", label: "Applied", color: "border-primary/40 bg-primary/5", badge: "bg-primary/10 text-primary" },
  { key: "reviewed", label: "Reviewed", color: "border-accent/40 bg-accent/5", badge: "bg-accent/10 text-accent-foreground" },
  { key: "shortlisted", label: "Shortlisted", color: "border-secondary/40 bg-secondary/5", badge: "bg-secondary/10 text-secondary" },
  { key: "selected", label: "Selected", color: "border-success/40 bg-success/5", badge: "bg-success/10 text-success" },
  { key: "rejected", label: "Rejected", color: "border-destructive/40 bg-destructive/5", badge: "bg-destructive/10 text-destructive" },
];

const AdminTracking = () => {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { fetchApps(); }, []);

  const fetchApps = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("applications")
      .select("id, status, created_at, resume_url, user_id, job_id, profiles:user_id(full_name, email), jobs:job_id(id, title, company)")
      .order("created_at", { ascending: false });
    const rows = (data as any) || [];
    setApps(rows.length > 0 ? rows : (SAMPLE_APPLICATIONS as any));
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    if (!id.startsWith("demo-")) {
      await supabase.from("applications").update({ status }).eq("id", id);
    }
    setApps((p) => p.map((a) => a.id === id ? { ...a, status } : a));
    toast({ title: "Moved", description: `Application moved to ${status}` });
  };

  const jobOptions = useMemo(() => {
    const map = new Map<string, string>();
    apps.forEach((a) => { if (a.jobs?.id) map.set(a.jobs.id, a.jobs.title || "Untitled"); });
    return Array.from(map.entries());
  }, [apps]);

  const filtered = useMemo(() => apps.filter((a) => {
    if (jobFilter !== "all" && a.jobs?.id !== jobFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const hay = `${a.profiles?.full_name || ""} ${a.profiles?.email || ""} ${a.jobs?.title || ""} ${a.jobs?.company || ""}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    return true;
  }), [apps, search, jobFilter]);

  const grouped = useMemo(() => {
    const g: Record<string, AppRow[]> = {};
    STAGES.forEach((s) => g[s.key] = []);
    filtered.forEach((a) => { if (g[a.status]) g[a.status].push(a); });
    return g;
  }, [filtered]);

  const total = filtered.length;
  const selected = grouped.selected?.length || 0;
  const shortlisted = grouped.shortlisted?.length || 0;
  const conversion = total > 0 ? Math.round((selected / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6 flex-wrap gap-2">
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold">Application Tracking</h2>
          <p className="text-sm text-muted-foreground">Kanban pipeline of every candidate by stage</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-4 h-4 text-primary" /></div>
          <div><p className="text-xl font-bold font-display leading-none">{total}</p><p className="text-xs text-muted-foreground mt-1">Total</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center"><Users className="w-4 h-4 text-secondary" /></div>
          <div><p className="text-xl font-bold font-display leading-none">{shortlisted}</p><p className="text-xs text-muted-foreground mt-1">Shortlisted</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-success" /></div>
          <div><p className="text-xl font-bold font-display leading-none">{selected}</p><p className="text-xs text-muted-foreground mt-1">Selected</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-accent-foreground" /></div>
          <div><p className="text-xl font-bold font-display leading-none">{conversion}%</p><p className="text-xs text-muted-foreground mt-1">Conversion</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search candidate, email, job..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="All jobs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All jobs</SelectItem>
            {jobOptions.map(([id, title]) => <SelectItem key={id} value={id}>{title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Pipeline */}
      {loading ? (
        <div className="py-12 flex items-center justify-center"><LogoSpinner size="md" /></div>

      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {STAGES.map((stage) => (
            <div key={stage.key} className={`rounded-xl border-2 ${stage.color} p-3 min-h-[400px]`}>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-sm">{stage.label}</h3>
                <Badge className={stage.badge + " border-0"}>{grouped[stage.key]?.length || 0}</Badge>
              </div>
              <div className="space-y-2">
                {grouped[stage.key]?.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No candidates</p>
                ) : grouped[stage.key]?.map((app) => (
                  <Card key={app.id} className="bg-card border border-border hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm truncate">{app.profiles?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.profiles?.email}</p>
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs font-medium truncate">{app.jobs?.title}</p>
                        <p className="text-[10px] text-muted-foreground">{app.jobs?.company}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        {app.resume_url && (
                          <a href={app.resume_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary underline shrink-0">Resume</a>
                        )}
                        <Select value={app.status} onValueChange={(v) => updateStatus(app.id, v)}>
                          <SelectTrigger className="h-7 text-[10px] ml-auto w-auto gap-1 px-2"><ArrowRight className="w-3 h-3" /> Move</SelectTrigger>
                          <SelectContent>
                            {STAGES.filter((s) => s.key !== app.status).map((s) => (
                              <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTracking;

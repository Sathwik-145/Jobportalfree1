import DateRangeFilter, { inRange, type DateRange } from "@/components/DateRangeFilter";
import { useEffect, useState } from "react";
import { useNavigate } from '@/lib/router-compat';
import { supabase } from "@/lib/db-client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ExternalLink, Pencil, Users, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

type JobWithCount = Tables<"jobs"> & { application_count: number };

const ManageJobs = () => {
  const [jobs, setJobs] = useState<JobWithCount[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [pending, setPending] = useState<{ ids: string[]; titles: string[] } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    const { data: jobsData } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (!jobsData) { setJobs([]); return; }
    const { data: countData } = await supabase.from("applications").select("job_id");
    const counts: Record<string, number> = {};
    (countData || []).forEach((a) => { counts[a.job_id] = (counts[a.job_id] || 0) + 1; });
    setJobs(jobsData.map((j) => ({ ...j, application_count: counts[j.id] || 0 })));
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("jobs").update({ is_active: !current }).eq("id", id);
    setJobs((p) => p.map((j) => j.id === id ? { ...j, is_active: !current } : j));
  };

  const toggleSelect = (id: string) => {
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    setSelected((p) => p.size === jobs.length ? new Set() : new Set(jobs.map((j) => j.id)));
  };

  const requestDelete = (ids: string[]) => {
    const titles = jobs.filter((j) => ids.includes(j.id)).map((j) => j.title || "Untitled");
    setConfirmText("");
    setPending({ ids, titles });
  };

  const confirmDelete = async () => {
    if (!pending || !isAdmin) return;
    setBusy(true);
    const { error } = await supabase.from("jobs").delete().in("id", pending.ids);
    setBusy(false);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setJobs((p) => p.filter((j) => !pending.ids.includes(j.id)));
    setSelected((p) => {
      const n = new Set(p);
      pending.ids.forEach((id) => n.delete(id));
      return n;
    });
    toast({ title: `Deleted ${pending.ids.length} job${pending.ids.length > 1 ? "s" : ""}` });
    setPending(null);
  };

  const isBulk = (pending?.ids.length ?? 0) > 1;
  const requireText = isBulk ? "DELETE" : "";
  const canConfirm = !isBulk || confirmText.trim() === requireText;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-accent/30 p-6">
        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Manage Jobs</h2>
        {isAdmin && selected.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="gap-2 animate-fade-in shadow-md hover:shadow-lg hover:shadow-destructive/30 transition-shadow"
            onClick={() => requestDelete(Array.from(selected))}
          >
            <Trash2 className="w-4 h-4" /> Delete {selected.size} selected
          </Button>
        )}
      </div>

      <div className="mb-4"><DateRangeFilter value={range} onChange={setRange} /></div>
      {jobs.length === 0 ? (
        <p className="text-muted-foreground rounded-2xl border border-dashed bg-card p-10 text-center">No jobs yet.</p>
      ) : (
        <>
          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {jobs.filter((j) => inRange(j.created_at, range)).map((job) => {
              const checked = selected.has(job.id);
              return (
                <Card key={job.id} className={`rounded-2xl border-border/60 shadow-sm transition-all hover-lift ${checked ? "ring-2 ring-primary" : ""}`}>
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-start gap-3 mb-2">
                      {isAdmin && (
                        <Checkbox checked={checked} onCheckedChange={() => toggleSelect(job.id)} className="mt-1" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{job.title || "Untitled"}</p>
                            <p className="text-sm text-muted-foreground">{job.company || "—"}</p>
                          </div>
                          {job.job_type && <Badge variant="outline" className="shrink-0">{job.job_type}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span>{job.application_count} applied</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch checked={job.is_active} onCheckedChange={() => toggleActive(job.id, job.is_active)} />
                        <span className="text-xs text-muted-foreground">{job.is_active ? "Active" : "Inactive"}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => navigate(`/admin/edit-job/${job.id}`)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {job.source_url && (
                          <a href={job.source_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary/10 hover:text-secondary transition-colors"><ExternalLink className="w-4 h-4" /></Button>
                          </a>
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors" onClick={() => requestDelete([job.id])}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Desktop */}
          <div className="hidden md:block rounded-2xl border border-border/60 bg-card shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/60">
                  {isAdmin && (
                    <th className="p-3 w-10">
                      <Checkbox
                        checked={selected.size === jobs.length && jobs.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                  )}
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Title</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Company</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Applications</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Posted</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Active</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.filter((j) => inRange(j.created_at, range)).map((job) => {
                  const checked = selected.has(job.id);
                  return (
                    <tr key={job.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors transition-colors hover:bg-muted/40 ${checked ? "bg-primary/5" : ""}`}>
                      {isAdmin && (
                        <td className="p-3">
                          <Checkbox checked={checked} onCheckedChange={() => toggleSelect(job.id)} />
                        </td>
                      )}
                      <td className="p-3 font-medium">{job.title || "Untitled"}</td>
                      <td className="p-3">{job.company || "—"}</td>
                      <td className="p-3">{job.job_type ? <Badge variant="outline">{job.job_type}</Badge> : "—"}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{job.application_count}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</td>
                      <td className="p-3"><Switch checked={job.is_active} onCheckedChange={() => toggleActive(job.id, job.is_active)} /></td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => navigate(`/admin/edit-job/${job.id}`)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {job.source_url && (
                            <a href={job.source_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary/10 hover:text-secondary transition-colors"><ExternalLink className="w-4 h-4" /></Button>
                            </a>
                          )}
                          {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors" onClick={() => requestDelete([job.id])}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete {pending?.ids.length === 1 ? "this job" : `${pending?.ids.length} jobs`}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>This permanently removes the job{isBulk ? "s" : ""} and any associated application history. This cannot be undone.</p>
                {pending && (
                  <div className="max-h-32 overflow-y-auto rounded-md border bg-muted/40 p-2 text-sm">
                    {pending.titles.slice(0, 8).map((t, i) => (
                      <div key={i} className="truncate">• {t}</div>
                    ))}
                    {pending.titles.length > 8 && (
                      <div className="text-xs text-muted-foreground mt-1">…and {pending.titles.length - 8} more</div>
                    )}
                  </div>
                )}
                {isBulk && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm:</p>
                    <Input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="font-mono"
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              disabled={!canConfirm || busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? "Deleting…" : `Delete ${pending?.ids.length ?? ""}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageJobs;

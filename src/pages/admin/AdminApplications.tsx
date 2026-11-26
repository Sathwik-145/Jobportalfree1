import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import ApplicationNotes from "@/components/ApplicationNotes";
import { SAMPLE_APPLICATIONS } from "@/lib/sampleApplications";
import DateRangeFilter, { inRange, type DateRange } from "@/components/DateRangeFilter";

interface AppRow {
  id: string;
  status: string;
  created_at: string;
  resume_url: string | null;
  cover_letter: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
  jobs: { title: string | null; company: string | null } | null;
}

const AdminApplications = () => {
  const [apps, setApps] = useState<AppRow[]>([]);
  const { toast } = useToast();
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const shown = apps.filter((a) => inRange(a.created_at, range));

  useEffect(() => { fetchApps(); }, []);

  const fetchApps = async () => {
    const { data } = await supabase
      .from("applications")
      .select("id, status, created_at, resume_url, cover_letter, profiles:user_id(full_name, email), jobs:job_id(title, company)")
      .order("created_at", { ascending: false });
    const rows = (data as any) || [];
    setApps(rows.length > 0 ? rows : (SAMPLE_APPLICATIONS as any));
  };

  const updateStatus = async (id: string, status: string) => {
    if (!id.startsWith("demo-")) {
      await supabase.from("applications").update({ status }).eq("id", id);
    }
    setApps((p) => p.map((a) => a.id === id ? { ...a, status } : a));
    toast({ title: "Updated", description: `Status changed to ${status}` });
  };

  const statusColors: Record<string, string> = {
    applied: "bg-primary/10 text-primary",
    reviewed: "bg-accent/10 text-accent-foreground",
    shortlisted: "bg-success/10 text-success",
    rejected: "bg-destructive/10 text-destructive",
  };

  return (
    <div>
      <header className="mb-6 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-accent/30 p-6"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Hiring workspace</p><h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Applications</h1><p className="mt-2 text-sm text-muted-foreground">Review candidates and move great talent forward.</p></header>
      <div className="mb-4"><DateRangeFilter value={range} onChange={setRange} /></div>
      {apps.length === 0 ? (
        <p className="text-muted-foreground rounded-2xl border border-dashed bg-card p-10 text-center">No applications yet.</p>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="md:hidden space-y-3">
            {shown.map((app) => (
              <Card key={app.id} className="rounded-2xl border-border/60 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="font-medium">{app.profiles?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{app.profiles?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{app.jobs?.title || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground">{app.jobs?.company} • {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Select value={app.status} onValueChange={(v) => updateStatus(app.id, v)}>
                      <SelectTrigger className="w-36">
                        <Badge className={statusColors[app.status] || ""}>{app.status}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    {app.resume_url ? (
                      <a href={app.resume_url} target="_blank" className="text-primary text-sm underline shrink-0">Resume</a>
                    ) : <span className="text-xs text-muted-foreground rounded-2xl border border-dashed bg-card p-10 text-center">No resume</span>}
                    <ApplicationNotes applicationId={app.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block rounded-2xl border border-border/60 bg-card shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/60">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Candidate</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Job</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Applied</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                   <th className="text-left p-3 text-sm font-medium text-muted-foreground">Resume</th>
                   <th className="text-left p-3 text-sm font-medium text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((app) => (
                  <tr key={app.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <p className="font-medium">{app.profiles?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{app.profiles?.email}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-medium">{app.jobs?.title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">{app.jobs?.company}</p>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                    </td>
                    <td className="p-3">
                      <Select value={app.status} onValueChange={(v) => updateStatus(app.id, v)}>
                        <SelectTrigger className="w-32">
                          <Badge className={statusColors[app.status] || ""}>{app.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                     <td className="p-3">
                       {app.resume_url ? (
                         <a href={app.resume_url} target="_blank" className="text-primary text-sm underline">View</a>
                       ) : "—"}
                     </td>
                     <td className="p-3">
                       <ApplicationNotes applicationId={app.id} />
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminApplications;

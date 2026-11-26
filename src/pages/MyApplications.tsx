import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Link } from '@/lib/router-compat';
import { Briefcase, X } from "lucide-react";
import ApplicationTimeline from "@/components/ApplicationTimeline";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ApplicationWithJob {
  id: string;
  status: string;
  created_at: string;
  cover_letter: string | null;
  jobs: { id: string; title: string | null; company: string | null; location: string | null } | null;
}

const statusColors: Record<string, string> = {
  applied: "bg-primary/10 text-primary",
  reviewed: "bg-accent/10 text-accent-foreground",
  shortlisted: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
};

const MyApplications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apps, setApps] = useState<ApplicationWithJob[]>([]);

  useEffect(() => { if (user) fetchApps(); }, [user]);

  const fetchApps = async () => {
    const { data } = await supabase
      .from("applications")
      .select("id, status, created_at, cover_letter, jobs(id, title, company, location)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setApps((data as any) || []);
  };

  const withdraw = async (id: string) => {
    const { error } = await supabase.from("applications").delete().eq("id", id).eq("user_id", user!.id);
    if (error) {
      toast({ title: "Could not withdraw", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Application withdrawn" });
      setApps((p) => p.filter((a) => a.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container py-6 px-4 md:py-8 max-w-3xl mx-auto">
        <header className="relative mb-7 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/15 via-card to-accent/40 p-6 sm:p-8"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Career workspace</p><h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Every application. One place.</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">Follow your progress and stay on top of your next career move.</p></header>
        {apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card px-6 py-20 text-center text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No applications yet. Start applying!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map((app) => (
              <Card key={app.id} className="rounded-2xl border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/jobs/${app.jobs?.id}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                        {app.jobs?.title || "Untitled"}
                      </Link>
                      <p className="text-sm text-muted-foreground truncate">{app.jobs?.company} • {app.jobs?.location}</p>
                      <p className="text-xs text-muted-foreground mt-1">Applied {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={statusColors[app.status] || ""}>{app.status}</Badge>
                      {app.status !== "shortlisted" && app.status !== "rejected" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1">
                              <X className="w-4 h-4" /> Withdraw
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Withdraw application?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove your application for "{app.jobs?.title}". You can re-apply later if the job is still open.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => withdraw(app.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Withdraw
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                  <ApplicationTimeline status={app.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;

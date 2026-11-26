import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import JobCard from "@/components/JobCard";
import Navbar from "@/components/Navbar";
import { Bookmark } from "lucide-react";

const SavedJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Tables<"jobs">[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    if (user) fetchSaved();
  }, [user]);

  const fetchSaved = async () => {
    const { data } = await supabase
      .from("saved_jobs")
      .select("job_id, jobs(*)")
      .eq("user_id", user!.id);
    const jobsList = data?.map((s: any) => s.jobs).filter(Boolean) || [];
    setJobs(jobsList);
    setSavedIds(jobsList.map((j: any) => j.id));
  };

  const toggleSave = async (jobId: string) => {
    await supabase.from("saved_jobs").delete().eq("job_id", jobId).eq("user_id", user!.id);
    setSavedIds((p) => p.filter((id) => id !== jobId));
    setJobs((p) => p.filter((j) => j.id !== jobId));
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container py-6 px-4 md:py-8">
        <header className="relative mb-7 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/15 via-card to-accent/40 p-6 sm:p-8"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Career workspace</p><h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Your opportunity shortlist</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">Great roles worth coming back to, all together in one place.</p></header>
        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card px-6 py-20 text-center text-muted-foreground">
            <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No saved jobs yet. Browse and save jobs you're interested in!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} isSaved={true} onToggleSave={() => toggleSave(job.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;

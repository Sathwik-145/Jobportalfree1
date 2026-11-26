import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from '@/lib/router-compat';
import { supabase } from "@/lib/db-client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Tables } from "@/integrations/supabase/types";
import MarkdownContent from "@/components/MarkdownContent";
import { MapPin, Clock, Briefcase, ExternalLink, ArrowLeft, Send } from "lucide-react";
import SocialShare from "@/components/SocialShare";
import { getJobSkills, getJobDescription } from "@/lib/jobFallback";
import { formatDistanceToNow } from "date-fns";
import MatchRing from "@/components/MatchRing";
import { useMatchProfile } from "@/hooks/useMatchProfile";
import { computeMatch, matchLabel } from "@/lib/jobMatch";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { notifyAdmin } from '@/lib/notifyAdmin';

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Tables<"jobs"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [applyCount, setApplyCount] = useState<number>(0);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const matchProfile = useMatchProfile();

  useEffect(() => {
    if (id) {
      fetchJob();
      fetchApplyCount();
      if (user) checkApplication();
    }
  }, [id, user]);

  const fetchApplyCount = async () => {
    if (!id) return;
    const { count } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("job_id", id);
    setApplyCount(count || 0);
  };

  const fetchJob = async () => {
    setIsLoading(true);
    setFetchError(null);
    const { data, error } = await supabase.from("jobs").select("*").eq("id", id!).single();
    if (error || !data) {
      setJob(null);
      setFetchError("Job not found or unavailable.");
      setIsLoading(false);
      return;
    }
    setJob(data);
    setIsLoading(false);
  };

  const checkApplication = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", id!)
      .eq("user_id", user.id)
      .maybeSingle();
    setHasApplied(!!data);
  };

  const handleApply = async () => {
    if (!user || !id) {
      navigate("/login");
      return;
    }
    setApplying(true);
    const { data: saved, error } = await supabase.from("applications").insert({
      job_id: id,
      user_id: user.id,
      cover_letter: coverLetter || null,
      resume_url: profile?.resume_url || null,
    }).select('id').single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      if (saved) notifyAdmin('job_application', { eventId: saved.id });
      toast({ title: "Applied!", description: "Your application has been submitted." });
      setHasApplied(true);
      setApplyCount((c) => c + 1);
      setDialogOpen(false);
      // Notify dashboards/profile to refresh counts immediately
      window.dispatchEvent(new CustomEvent("user-applications-changed"));
    }
    setApplying(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar />
        <div className="container max-w-4xl space-y-4 py-8" aria-busy="true">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (fetchError || !job) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar />
        <div className="container py-16 text-center">
          <p className="mb-4 text-muted-foreground">{fetchError || "Unable to load this job."}</p>
          <Button variant="outline" onClick={() => navigate("/jobs")}>Browse Jobs</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container max-w-4xl py-6 px-4 md:py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardContent className="p-4 sm:p-6 md:p-8">
            {/* Header - stack on mobile, side by side on desktop */}
            <div className="mb-6 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/10 via-card to-accent/30 p-5 sm:p-6">
              <div>
                {job.company && (
                  <p className="mb-2 flex items-center gap-2 font-medium text-primary">
                    <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-base font-bold text-primary-foreground">{job.company.trim().charAt(0).toUpperCase()}</span>
                    {job.company}
                  </p>
                )}
                <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground md:text-3xl">{job.title || "Untitled Position"}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-muted-foreground">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 shrink-0" /> {job.location}
                    </span>
                  )}
                  {job.job_type && <Badge variant="outline" className="rounded-full">{job.job_type}</Badge>}
                  {job.experience_level && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4 shrink-0" /> {job.experience_level}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 shrink-0" /> {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </span>
                </div>
                {job.salary_range && <p className="mt-2 text-lg font-semibold text-foreground">{job.salary_range}</p>}
                <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                  <Send className="h-3 w-3" /> {applyCount} {applyCount === 1 ? "person has" : "people have"} applied
                </p>
              </div>

              {/* Apply button - full width on mobile */}
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <SocialShare title={job.title || "Job Opportunity"} />
                {job.source_url ? (
                  <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto gap-1">
                      <ExternalLink className="h-4 w-4" /> Apply Now
                    </Button>
                  </a>
                ) : hasApplied ? (
                  <Button disabled variant="secondary" className="w-full sm:w-auto">
                    Applied ✓
                  </Button>
                ) : (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full sm:w-auto gap-1">
                        <Send className="h-4 w-4" /> Apply Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="mx-4 max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Apply for {job.title || "this position"}</DialogTitle>
                      </DialogHeader>
                      <div className="mt-4 space-y-4">
                        {!user && (
                          <p className="text-sm text-muted-foreground">
                            You need to <Link to="/login" className="text-primary underline">sign in</Link> first.
                          </p>
                        )}
                        <Textarea
                          placeholder="Cover letter (optional)"
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          rows={5}
                        />
                        <Button onClick={handleApply} disabled={applying || !user} className="w-full">
                          {applying ? "Submitting..." : "Submit Application"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {(() => {
              const sk: string[] = getJobSkills(job);
              const desc: string = getJobDescription(job);
              const match = computeMatch(job, matchProfile);
              return (
                <>
                  {match && (
                    <div className="mb-6 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                      <div className="flex items-center gap-4">
                        <MatchRing score={match.score} size={64} />
                        <div>
                          <h3 className="font-semibold text-foreground">How you match</h3>
                          <p className="text-sm text-muted-foreground">{matchLabel(match.score)} based on your profile skills and job alert preferences.</p>
                        </div>
                      </div>
                      {(match.matchedSkills.length > 0 || match.missingSkills.length > 0) && (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-success"><CheckCircle2 className="h-3.5 w-3.5" /> You have</p>
                            <div className="flex flex-wrap gap-1.5">{match.matchedSkills.length ? match.matchedSkills.map((k) => <Badge key={k} className="bg-success/10 text-success hover:bg-success/10">{k}</Badge>) : <span className="text-xs text-muted-foreground">No overlap yet</span>}</div>
                          </div>
                          <div>
                            <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><CircleDashed className="h-3.5 w-3.5" /> To learn</p>
                            <div className="flex flex-wrap gap-1.5">{match.missingSkills.length ? match.missingSkills.map((k) => <Badge key={k} variant="outline">{k}</Badge>) : <span className="text-xs text-muted-foreground">Nothing missing</span>}</div>
                          </div>
                        </div>
                      )}
                      <p className="mt-4 text-xs text-muted-foreground">Improve your odds: <Link to="/resume-builder" className="text-primary underline">build a resume</Link> or <Link to="/job-alerts" className="text-primary underline">update your preferences</Link>.</p>
                    </div>
                  )}
                  {sk.length > 0 && (
                    <div className="mb-6 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/10 via-card to-accent/30 p-5 sm:p-6">
                      <h3 className="mb-2 font-semibold text-foreground">Skills Required</h3>
                      <div className="flex flex-wrap gap-2">
                        {sk.map((skill) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mb-6 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/10 via-card to-accent/30 p-5 sm:p-6">
                    <h3 className="mb-2 font-semibold text-foreground">Description</h3>
                    <MarkdownContent content={desc} className="text-sm" />
                  </div>
                </>
              );
            })()}

            {job.scraped_content && (
              <div>
                <h3 className="mb-2 font-semibold text-foreground">Job Details</h3>
                <MarkdownContent content={job.scraped_content} className="text-sm" />
              </div>
            )}

            {job.deadline && (
              <p className="mt-6 text-sm font-medium text-destructive">Deadline: {new Date(job.deadline).toLocaleDateString()}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobDetail;

import { useNavigate } from '@/lib/router-compat';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Briefcase, Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { getJobSkills } from "@/lib/jobFallback";
import MatchRing from "@/components/MatchRing";
import type { MatchResult } from "@/lib/jobMatch";

interface JobCardProps {
  job: Tables<"jobs">;
  isSaved?: boolean;
  onToggleSave?: () => void;
  showActions?: boolean;
  match?: MatchResult | null;
}

const JobCard = ({ job, isSaved = false, onToggleSave, showActions = true, match = null }: JobCardProps) => {
  const navigate = useNavigate();
  const isNew = Date.now() - +new Date(job.created_at) < 3 * 864e5;
  const daysLeft = job.deadline ? Math.ceil((+new Date(job.deadline) - Date.now()) / 864e5) : null;
  const initial = (job.company || job.title || "J").trim().charAt(0).toUpperCase();

  const jobTypeColors: Record<string, string> = {
    "full-time": "bg-success/10 text-success border-success/20",
    "part-time": "bg-accent/10 text-accent-foreground border-accent/20",
    internship: "bg-primary/10 text-primary border-primary/20",
    contract: "bg-secondary/10 text-secondary-foreground border-secondary/20",
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or links
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;
    navigate(`/jobs/${job.id}`);
  };

  return (
    <Card
      className="group h-full rounded-2xl bg-card shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border border-border/60 hover:border-primary/30 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-sm font-bold text-primary-foreground">{initial}</span>
              {job.company && (
                <span className="text-sm font-semibold text-primary">{job.company}</span>
              )}
              {isNew && <Badge className="rounded-full bg-success/15 px-2 text-[10px] font-semibold text-success hover:bg-success/15">New</Badge>}
              {job.job_type && (
                <Badge variant="outline" className={`rounded-full ${jobTypeColors[job.job_type] || ""}`}>
                  {job.job_type}
                </Badge>
              )}
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {job.title || "Untitled Position"}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {job.location}
                </span>
              )}
              {job.experience_level && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" /> {job.experience_level}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
              </span>
            </div>
            {(job.salary_range || (daysLeft !== null && daysLeft >= 0 && daysLeft <= 14)) && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {job.salary_range && <p className="text-sm font-medium text-foreground">{job.salary_range}</p>}
                {daysLeft !== null && daysLeft >= 0 && daysLeft <= 14 && (
                  <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">
                    {daysLeft === 0 ? "Closes today" : `${daysLeft}d left`}
                  </span>
                )}
              </div>
            )}
            {(() => { const sk = getJobSkills(job); return (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {sk.slice(0, 4).map((skill) => (
                  <Badge key={skill} variant="secondary" className="rounded-full bg-muted text-muted-foreground text-xs font-medium">{skill}</Badge>
                ))}
                {sk.length > 4 && (
                  <Badge variant="secondary" className="rounded-full bg-muted text-muted-foreground text-xs font-medium">+{sk.length - 4}</Badge>
                )}
              </div>
            ); })()}
          </div>
          {showActions && (
            <div className="flex flex-col items-center gap-1">
              {match && <MatchRing score={match.score} />}
              {onToggleSave && (
                <Button variant="ghost" size="icon" onClick={onToggleSave} className="h-9 w-9 rounded-xl bg-muted/60 hover:bg-primary/10 hover:text-primary">
                  {isSaved ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
                </Button>
              )}
              {job.source_url && (
                <a href={job.source_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-muted/60 hover:bg-primary/10 hover:text-primary">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;

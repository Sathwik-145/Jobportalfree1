import { useNavigate } from '@/lib/router-compat';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Briefcase, Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { getJobSkills } from "@/lib/jobFallback";

interface JobCardProps {
  job: Tables<"jobs">;
  isSaved?: boolean;
  onToggleSave?: () => void;
  showActions?: boolean;
}

const JobCard = ({ job, isSaved = false, onToggleSave, showActions = true }: JobCardProps) => {
  const navigate = useNavigate();

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
              {job.company && (
                <span className="text-sm font-semibold text-primary">{job.company}</span>
              )}
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
            {job.salary_range && (
              <p className="mt-2 text-sm font-medium text-foreground">{job.salary_range}</p>
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
            <div className="flex flex-col gap-1">
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

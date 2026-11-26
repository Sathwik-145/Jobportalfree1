/** Application pipeline stages, in order. "pending" (old default) counts as "applied". */
export const PIPELINE = ["applied", "reviewed", "shortlisted", "interview", "selected"] as const;
export const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  interview: "Interview",
  selected: "Selected",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function normalizeStatus(status: string | null | undefined): string {
  const s = (status || "applied").toLowerCase();
  return s === "pending" ? "applied" : s;
}

export function statusLabel(status: string | null | undefined): string {
  const s = normalizeStatus(status);
  return STATUS_LABELS[s] || s.charAt(0).toUpperCase() + s.slice(1);
}

/** Position in the pipeline, or -1 for rejected / unknown. */
export function stageIndex(status: string | null | undefined): number {
  return (PIPELINE as readonly string[]).indexOf(normalizeStatus(status));
}

export const STATUS_BADGE: Record<string, string> = {
  applied: "bg-primary/10 text-primary",
  reviewed: "bg-accent/10 text-accent-foreground",
  shortlisted: "bg-secondary/10 text-secondary",
  interview: "bg-warning/15 text-warning",
  selected: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
};

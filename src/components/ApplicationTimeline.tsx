import { CheckCircle, Circle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PIPELINE, STATUS_LABELS, normalizeStatus, stageIndex } from "@/lib/applicationStatus";

export interface StatusEvent { status: string; created_at: string }

/** Progress tracker. When status history is available each reached step shows its date. */
const ApplicationTimeline = ({ status, history = [] }: { status: string; history?: StatusEvent[] }) => {
  const current = normalizeStatus(status);
  const isRejected = current === "rejected";
  // Rejected: show progress up to the last pipeline step that was reached.
  const reached = history.map((h) => stageIndex(h.status)).filter((i) => i >= 0);
  const currentIdx = isRejected ? (reached.length ? Math.max(...reached) : 0) : stageIndex(current);
  const dateFor = (key: string) => {
    const e = history.find((h) => normalizeStatus(h.status) === key);
    return e ? format(new Date(e.created_at), "d MMM") : "";
  };
  const rejectedAt = history.find((h) => normalizeStatus(h.status) === "rejected");

  return (
    <div className="flex w-full items-start overflow-x-auto pb-1" role="list" aria-label="Application progress">
      {PIPELINE.map((key, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx && !isRejected;
        return (
          <div key={key} role="listitem" className="flex flex-1 items-start last:flex-none">
            <div className="flex min-w-[56px] flex-col items-center">
              {done ? (
                <CheckCircle className={cn("h-5 w-5", active ? "text-primary" : "text-primary/60")} />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40" />
              )}
              <span className={cn("mt-1 whitespace-nowrap text-[10px]", done ? "font-medium text-foreground" : "text-muted-foreground")}>
                {STATUS_LABELS[key]}
              </span>
              <span className="h-3 text-[9px] text-muted-foreground">{done ? dateFor(key) : ""}</span>
            </div>
            {i < PIPELINE.length - 1 && (
              <div className={cn("mx-1 mt-2.5 h-0.5 min-w-3 flex-1 rounded", i < currentIdx ? "bg-primary/60" : "bg-muted")} />
            )}
          </div>
        );
      })}
      {isRejected && (
        <div className="ml-2 flex min-w-[56px] flex-col items-center">
          <XCircle className="h-5 w-5 text-destructive" />
          <span className="mt-1 text-[10px] font-medium text-destructive">Rejected</span>
          <span className="h-3 text-[9px] text-muted-foreground">{rejectedAt ? format(new Date(rejectedAt.created_at), "d MMM") : ""}</span>
        </div>
      )}
    </div>
  );
};

export default ApplicationTimeline;

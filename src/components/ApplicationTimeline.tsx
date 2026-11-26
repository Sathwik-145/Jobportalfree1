import { CheckCircle, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "applied", label: "Applied" },
  { key: "reviewed", label: "Reviewed" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "selected", label: "Selected" },
];

const ApplicationTimeline = ({ status }: { status: string }) => {
  const currentIdx = STEPS.findIndex((s) => s.key === status);
  const isRejected = status === "rejected";

  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx && !isRejected;
        const active = i === currentIdx && !isRejected;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              {done ? (
                <CheckCircle className={cn("w-5 h-5", active ? "text-primary" : "text-primary/60")} />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/40" />
              )}
              <span className={cn("text-[10px] mt-1 whitespace-nowrap", done ? "text-foreground font-medium" : "text-muted-foreground")}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-0.5 flex-1 mx-1 rounded", done && i < currentIdx ? "bg-primary/60" : "bg-muted")} />
            )}
          </div>
        );
      })}
      {isRejected && (
        <div className="flex flex-col items-center ml-2">
          <Clock className="w-5 h-5 text-destructive" />
          <span className="text-[10px] mt-1 text-destructive font-medium">Rejected</span>
        </div>
      )}
    </div>
  );
};

export default ApplicationTimeline;

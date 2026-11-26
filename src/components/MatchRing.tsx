import { cn } from "@/lib/utils";
import { matchLabel } from "@/lib/jobMatch";

/** Circular percentage badge for how well a job matches the signed-in user. */
const MatchRing = ({ score, size = 44, className }: { score: number; size?: number; className?: string }) => {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = score >= 80 ? "text-success" : score >= 60 ? "text-primary" : score >= 40 ? "text-warning" : "text-muted-foreground";
  return (
    <div className={cn("relative shrink-0", tone, className)} style={{ width: size, height: size }} title={`${matchLabel(score)} (${score}%)`} aria-label={`${score}% match`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground">{score}%</span>
    </div>
  );
};

export default MatchRing;

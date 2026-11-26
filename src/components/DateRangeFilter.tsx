import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export type DateRange = { from: string; to: string };
/** True when an ISO timestamp falls inside the picked from/to local date-times (empty = open-ended). */
export function inRange(iso: string | null | undefined, r: DateRange) {
  if (!r.from && !r.to) return true;
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return (!r.from || t >= new Date(r.from).getTime()) && (!r.to || t <= new Date(r.to).getTime());
}
export const fmtDateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");

export default function DateRangeFilter({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">From</span>
      <Input type="datetime-local" className="h-9 w-auto" value={value.from} onChange={e => onChange({ ...value, from: e.target.value })} />
      <span className="text-muted-foreground">To</span>
      <Input type="datetime-local" className="h-9 w-auto" value={value.to} onChange={e => onChange({ ...value, to: e.target.value })} />
      {(value.from || value.to) && <Button size="sm" variant="ghost" onClick={() => onChange({ from: "", to: "" })}><X className="h-4 w-4" /> Clear</Button>}
    </div>
  );
}

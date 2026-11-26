import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function LiveUpdatedBadge() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return null;
  const date = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const time = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30 text-xs font-medium text-success">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
      </span>
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>Updated daily · {date} · {time}</span>
    </div>
  );
}

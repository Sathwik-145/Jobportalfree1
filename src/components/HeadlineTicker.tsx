import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { X } from "lucide-react";

const HeadlineTicker = () => {
  const [headlines, setHeadlines] = useState<{ id: string; text: string }[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchHeadlines = async () => {
      const { data } = await supabase
        .from("headlines")
        .select("id, text")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setHeadlines(data || []);
    };
    fetchHeadlines();
  }, []);

  if (dismissed || headlines.length === 0) return null;

  const tickerText = headlines.map((h) => h.text).join("   •   ");

  return (
    <div className="relative bg-primary text-primary-foreground overflow-hidden">
      <div className="flex items-center h-8">
        <div className="flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap inline-block">
            <span className="text-sm font-medium px-4">
              {tickerText}   •   {tickerText}
            </span>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 mr-2 hover:bg-primary-foreground/20 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default HeadlineTicker;

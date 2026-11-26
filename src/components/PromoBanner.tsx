import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { Youtube, ExternalLink, Megaphone, Radio } from "lucide-react";

interface Banner {
  id: string;
  icon_type: string;
  title: string;
  subtitle: string | null;
  link_url: string | null;
}

const iconMap: Record<string, React.ElementType> = {
  youtube: Youtube,
  megaphone: Megaphone,
  radio: Radio,
  link: ExternalLink,
};

const PromoBanner = () => {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("promo_banners")
        .select("id, icon_type, title, subtitle, link_url")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setBanners(data || []);
    };
    fetch();
  }, []);

  if (banners.length === 0) return null;

  return (
    <div className="space-y-0">
      {banners.map((b) => {
        const Icon = iconMap[b.icon_type] || Megaphone;
        const content = (
          <div className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium">
            <Icon className="w-5 h-5 shrink-0 text-destructive" />
            <span className="font-semibold">{b.title}</span>
            {b.subtitle && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{b.subtitle}</span>
              </>
            )}
            {b.link_url && <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />}
          </div>
        );

        return b.link_url ? (
          <a
            key={b.id}
            href={b.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-accent/50 hover:bg-accent transition-colors border-b"
          >
            {content}
          </a>
        ) : (
          <div key={b.id} className="bg-accent/50 border-b">
            {content}
          </div>
        );
      })}
    </div>
  );
};

export default PromoBanner;

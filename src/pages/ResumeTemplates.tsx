import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tables } from "@/integrations/supabase/types";
import { Download, ExternalLink, FileText } from "lucide-react";
import { STATIC_RESUME_TEMPLATES } from "@/lib/staticResumeTemplates";
import { motion } from "framer-motion";

type Tpl = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  preview_url: string | null;
  download_url: string;
  source_url?: string | null;
};

const ResumeTemplates = () => {
  const [templates, setTemplates] = useState<Tpl[]>(STATIC_RESUME_TEMPLATES);

  useEffect(() => {
    supabase.from("resume_templates").select("*").eq("is_active", true)
      .then(({ data }) => {
        const dbRows = ((data || []) as any[]) as (Tables<"resume_templates"> & { source_url?: string | null })[];
        // Merge: DB rows first (admin curated), then any static fallback not duplicated by name.
        const seenNames = new Set(dbRows.map((d) => d.name.toLowerCase()));
        const staticOnly = STATIC_RESUME_TEMPLATES.filter((s) => !seenNames.has(s.name.toLowerCase()));
        setTemplates([...dbRows, ...staticOnly] as Tpl[]);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 md:py-12 px-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">Resume Templates</h1>
          <p className="text-muted-foreground">
            Hand-picked, ATS-friendly templates to boost your applications. Download, customise, and ship.
          </p>
          <a href="/resume-builder" className="mt-4 inline-flex"><Button className="gap-2"><FileText className="h-4 w-4" /> Or build one online and download a PDF</Button></a>
        </motion.div>

        {templates.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No templates available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {templates.map((t, i) => {
              const hasSourceUrl = !!t.source_url;
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="overflow-hidden group hover-lift border-border/60 hover:border-primary/40 h-full flex flex-col">
                    {t.preview_url && (
                      <div className="aspect-[3/4] bg-muted overflow-hidden relative">
                        <img
                          src={t.preview_url}
                          alt={t.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="min-w-0 mb-3 flex-1">
                        <h3 className="font-semibold text-foreground">{t.name}</h3>
                        {t.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}
                        {t.category && <Badge variant="secondary" className="mt-2">{t.category}</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <a href={t.download_url} target="_blank" rel="noopener noreferrer" className={hasSourceUrl ? "flex-1" : "w-full"}>
                          <Button size="sm" className="gap-1 w-full hover-glow">
                            <Download className="w-3.5 h-3.5" /> Download
                          </Button>
                        </a>
                        {hasSourceUrl && (
                          <a href={t.source_url!} target="_blank" rel="noopener noreferrer" className="flex-1">
                            <Button size="sm" variant="outline" className="gap-1 w-full">
                              <ExternalLink className="w-3.5 h-3.5" /> Source
                            </Button>
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ResumeTemplates;

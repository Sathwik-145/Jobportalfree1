import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DatabaseBackup, Download, Loader2, CalendarClock } from "lucide-react";

// Tables included in a full site backup (download as one JSON file).
export const BACKUP_TABLES = [
  "jobs", "applications", "saved_jobs", "profiles", "user_roles", "notifications", "contact_messages",
  "headlines", "promo_banners", "resume_templates", "interview_prep", "site_settings",
  "subadmin_requests", "subadmin_permissions", "application_notes", "job_preferences",
  "students", "exams", "questions", "submissions", "mcq_questions", "mcq_submissions",
  "fib_questions", "fib_submissions", "writing_questions", "writing_submissions",
  "exam_feedback", "exam_recordings", "reevaluation_requests", "admin_notifications", "registrations", "codexam_settings",
] as const;

export const formatBackupDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Never";

export async function getLastBackup(): Promise<string | null> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", "last_backup").maybeSingle();
  return ((data?.value as { at?: string } | null)?.at) ?? null;
}

export default function BackupData() {
  const [last, setLast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { getLastBackup().then(setLast); }, []);

  const run = async () => {
    setBusy(true);
    try {
      const out: Record<string, unknown[]> = {};
      for (const t of BACKUP_TABLES) {
        const rows: unknown[] = [];
        for (let from = 0; ; from += 1000) {
          const { data, error } = await supabase.from(t as never).select("*").range(from, from + 999);
          if (error) break;
          rows.push(...(data ?? []));
          if (!data || data.length < 1000) break;
        }
        out[t] = rows;
      }
      const at = new Date().toISOString();
      const blob = new Blob([JSON.stringify({ created_at: at, tables: out }, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `jobportal-backup-${at.slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      await supabase.from("site_settings").upsert({ key: "last_backup", value: { at }, updated_at: at });
      setLast(at);
      toast.success("Backup downloaded");
    } catch (e) {
      toast.error("Backup failed", { description: String(e) });
    }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Backup</h1>
        <p className="text-sm text-muted-foreground mt-1">Download a copy of all jobs, users, exams and settings.</p>
      </header>
      <Card className="rounded-2xl">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary"><CalendarClock className="h-6 w-6" /></div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Last backup</p>
              <p className="font-display text-xl font-semibold">{formatBackupDate(last)}</p>
            </div>
          </div>
          <Button onClick={run} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {busy ? "Preparing…" : "Download backup now"}
          </Button>
        </CardContent>
      </Card>
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><DatabaseBackup className="h-4 w-4" /> Keep the file somewhere safe. It includes private student data.</p>
    </div>
  );
}

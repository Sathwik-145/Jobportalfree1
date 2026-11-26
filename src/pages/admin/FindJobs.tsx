import { useState } from "react";
import { supabase } from "@/lib/db-client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Globe, Loader2, Search, PlusCircle, ExternalLink } from "lucide-react";
import { JOB_FINDER_MAX, JOB_FINDER_MIN, clampJobCount, type FoundJob } from "@/lib/jobFinder";
import { sendJobAlertsFor } from "@/lib/jobAlertClient";

export default function FindJobs() {
  const { user } = useAuth();
  const [count, setCount] = useState(8);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jobs, setJobs] = useState<FoundJob[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());

  const search = async () => {
    setBusy(true); setJobs([]); setPicked(new Set());
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/public/find-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(s.session ? { Authorization: `Bearer ${s.session.access_token}` } : {}) },
        body: JSON.stringify({ count: clampJobCount(count), query, location }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Search failed (${res.status})`);
      const list: FoundJob[] = body.jobs || [];
      setJobs(list); setPicked(new Set(list.map((_, i) => i)));
      if (!list.length) toast.info("No new postings with working links were found. Try a different search.");
      else toast.success(`Found ${list.length} recent jobs with working links.`);
    } catch (e: any) { toast.error(e.message || "Search failed"); }
    setBusy(false);
  };

  const addSelected = async () => {
    const rows = jobs.filter((_, i) => picked.has(i)).map((j) => ({
      title: j.title, company: j.company, location: j.location || null, job_type: j.job_type || null,
      experience_level: j.experience_level || null, salary_range: j.salary_range || null,
      skills_required: j.skills_required.length ? j.skills_required : null, description: j.description || null,
      source_url: j.source_url, deadline: j.deadline, posted_by: user?.id, is_active: true,
    }));
    if (!rows.length) return toast.error("Tick at least one job");
    setSaving(true);
    const { data: created, error } = await supabase.from("jobs").insert(rows).select("id");
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${rows.length} jobs added and live on the site.`);
    sendJobAlertsFor((created || []).map((r) => r.id)).then((mail) => {
      if (mail.error) toast.error(`Alert emails failed: ${mail.error}`);
      else if (mail.sent) toast.success(`Job alerts emailed to ${mail.sent} ${mail.sent === 1 ? "person" : "people"}`);
    });
    setJobs(jobs.filter((_, i) => !picked.has(i))); setPicked(new Set());
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Globe className="w-6 h-6 text-primary" /> Find recent jobs</h1>
        <p className="text-sm text-muted-foreground mt-1">Search the web for real job postings from the last two weeks. Every link is checked before it is shown, and jobs already on the site are skipped.</p>
      </div>
      <Card className="rounded-2xl"><CardContent className="p-5 grid gap-4 sm:grid-cols-[120px_1fr_1fr_auto] items-end">
        <div className="space-y-1.5"><Label htmlFor="fj-count">How many</Label>
          <Input id="fj-count" type="number" min={JOB_FINDER_MIN} max={JOB_FINDER_MAX} value={count} onChange={(e) => setCount(Number(e.target.value))} onBlur={() => setCount(clampJobCount(count))} /></div>
        <div className="space-y-1.5"><Label htmlFor="fj-q">Role or skill (optional)</Label>
          <Input id="fj-q" placeholder="e.g. React developer, data analyst" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="fj-l">Location (optional)</Label>
          <Input id="fj-l" placeholder="e.g. Bengaluru, Remote" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
        <Button onClick={search} disabled={busy} className="gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}{busy ? "Searching…" : "Find jobs"}</Button>
        <p className="text-xs text-muted-foreground sm:col-span-4">Choose between {JOB_FINDER_MIN} and {JOB_FINDER_MAX}. A search can take up to a minute.</p>
      </CardContent></Card>

      {jobs.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">{picked.size} of {jobs.length} selected</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPicked(picked.size === jobs.length ? new Set() : new Set(jobs.map((_, i) => i)))}>{picked.size === jobs.length ? "Clear all" : "Select all"}</Button>
              <Button size="sm" onClick={addSelected} disabled={saving || !picked.size} className="gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />} Add selected to the site</Button>
            </div>
          </div>
          {jobs.map((j, i) => (
            <Card key={j.source_url} className="rounded-2xl"><CardContent className="p-4 flex gap-3">
              <Checkbox checked={picked.has(i)} onCheckedChange={(v) => { const n = new Set(picked); v ? n.add(i) : n.delete(i); setPicked(n); }} aria-label={`Select ${j.title}`} className="mt-1" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-semibold">{j.title} <span className="font-normal text-muted-foreground">· {j.company}</span></p>
                <div className="flex flex-wrap gap-1.5">{[j.location, j.job_type, j.experience_level, j.salary_range].filter(Boolean).map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</div>
                {j.description && <p className="text-sm text-muted-foreground line-clamp-2">{j.description}</p>}
                <a href={j.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 break-all"><ExternalLink className="w-3 h-3 shrink-0" />{j.source_url}</a>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}

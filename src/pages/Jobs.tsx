import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from '@/lib/router-compat';
import { supabase } from "@/lib/db-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tables } from "@/integrations/supabase/types";
import JobCard from "@/components/JobCard";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useMatchProfile } from "@/hooks/useMatchProfile";
import { computeMatch } from "@/lib/jobMatch";
import { Search, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 12;

const Jobs = () => {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Tables<"jobs">[]>([]);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [jobType, setJobType] = useState("all");
  const [expLevel, setExpLevel] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "salary" | "title" | "match">("newest");
  const [page, setPage] = useState(1);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const { user } = useAuth();
  const matchProfile = useMatchProfile();
  const matches = useMemo(() => new Map(jobs.map((j) => [j.id, computeMatch(j, matchProfile)] as const)), [jobs, matchProfile]);
  const canMatch = Array.from(matches.values()).some(Boolean);
  useEffect(() => { if (canMatch) setSortBy((s) => (s === "newest" ? "match" : s)); }, [canMatch]);

  useEffect(() => {
    fetchJobs();
    if (user) fetchSavedJobs();
  }, [user]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || el.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      document.getElementById("job-search")?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { setPage(1); }, [search, jobType, expLevel, sortBy]);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs").select("*").eq("is_active", true)
      .order("created_at", { ascending: false });
    setJobs(data || []);
  };

  const fetchSavedJobs = async () => {
    if (!user) return;
    const { data } = await supabase.from("saved_jobs").select("job_id").eq("user_id", user.id);
    setSavedJobs(data?.map((s) => s.job_id) || []);
  };

  const toggleSave = async (jobId: string) => {
    if (!user) return;
    if (savedJobs.includes(jobId)) {
      await supabase.from("saved_jobs").delete().eq("job_id", jobId).eq("user_id", user.id);
      setSavedJobs((p) => p.filter((id) => id !== jobId));
    } else {
      await supabase.from("saved_jobs").insert({ job_id: jobId, user_id: user.id });
      setSavedJobs((p) => [...p, jobId]);
    }
  };

  const filtered = useMemo(() => {
    const f = jobs.filter((job) => {
      const matchesSearch = !search ||
        [job.title, job.company, job.description, ...(job.skills_required || [])]
          .some((x) => x?.toLowerCase().includes(search.toLowerCase()));
      const matchesType = jobType === "all" || job.job_type === jobType;
      const matchesExp = expLevel === "all" || job.experience_level === expLevel;
      return matchesSearch && matchesType && matchesExp;
    });
    const sorted = [...f];
    if (sortBy === "newest") sorted.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sortBy === "oldest") sorted.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    if (sortBy === "match") sorted.sort((a, b) => (matches.get(b.id)?.score ?? -1) - (matches.get(a.id)?.score ?? -1) || +new Date(b.created_at) - +new Date(a.created_at));
    if (sortBy === "title") sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    if (sortBy === "salary") {
      const num = (s: string | null) => parseInt(String(s || "").replace(/[^0-9]/g, "")) || 0;
      sorted.sort((a, b) => num(b.salary_range) - num(a.salary_range));
    }
    return sorted;
  }, [jobs, search, jobType, expLevel, sortBy, matches]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const TYPES = [["all", "All"], ["full-time", "Full time"], ["part-time", "Part time"], ["internship", "Internship"], ["contract", "Contract"]] as const;
  const LEVELS = [["all", "All levels"], ["entry", "Entry level"], ["mid", "Mid level"], ["senior", "Senior"]] as const;
  const newThisWeek = jobs.filter(j => Date.now() - +new Date(j.created_at) < 7 * 864e5).length;
  const companies = new Set(jobs.map(j => j.company)).size;
  const activeFilters = (jobType !== "all" ? 1 : 0) + (expLevel !== "all" ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <section className="border-b bg-gradient-to-br from-primary/15 via-background to-accent/40">
        <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-3 py-1 text-xs font-semibold text-primary"><Briefcase className="h-3.5 w-3.5" /> Career workspace</p>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-5xl">Find your next opportunity</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">Search roles by title, company or skill, then narrow by job type and experience.</p>
          <div className="relative mt-6 max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input id="job-search" placeholder="Job title, company or skill (press / to focus)" className="h-14 rounded-2xl border-primary/20 bg-card pl-12 text-base shadow-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <dl className="mt-6 flex flex-wrap gap-3 text-sm">
            {[["Open roles", jobs.length], ["New this week", newThisWeek], ["Companies", companies]].map(([l, v]) => (
              <div key={l as string} className="rounded-xl border bg-card/80 px-4 py-2"><dt className="text-xs text-muted-foreground">{l}</dt><dd className="font-display text-lg font-semibold">{v}</dd></div>
            ))}
          </dl>
        </div>
      </section>
      <div className="container mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job type</p>
            <div className="flex flex-wrap gap-2 lg:flex-col">
              {TYPES.map(([v, l]) => (
                <button key={v} onClick={() => setJobType(v)} className={`rounded-xl px-3 py-2 text-left text-sm transition-colors ${jobType === v ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Experience</p>
            <div className="flex flex-wrap gap-2 lg:flex-col">
              {LEVELS.map(([v, l]) => (
                <button key={v} onClick={() => setExpLevel(v)} className={`rounded-xl px-3 py-2 text-left text-sm transition-colors ${expLevel === v ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"}`}>{l}</button>
              ))}
            </div>
          </div>
          {activeFilters > 0 && <Button variant="outline" className="w-full" onClick={() => { setSearch(""); setJobType("all"); setExpLevel("all"); }}>Clear filters ({activeFilters})</Button>}
        </aside>
        <main className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{filtered.length} jobs found · Page {page} of {totalPages}</p>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-44 bg-card"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              {canMatch && <SelectItem value="match">Best match</SelectItem>}
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="salary">Highest salary</SelectItem>
              <SelectItem value="title">Title (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card px-6 py-20 text-center text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No jobs match your search criteria.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {pageItems.map((job) => (
                <JobCard key={job.id} job={job} isSaved={savedJobs.includes(job.id)} onToggleSave={() => toggleSave(job.id)} match={matches.get(job.id) ?? null} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, i, arr) => (
                    <span key={p} className="flex items-center gap-2">
                      {i > 0 && arr[i - 1] !== p - 1 && <span className="text-muted-foreground">…</span>}
                      <Button variant={p === page ? "default" : "outline"} size="sm" onClick={() => setPage(p)}>
                        {p}
                      </Button>
                    </span>
                  ))}
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
        </main>
      </div>
    </div>
  );
};

export default Jobs;

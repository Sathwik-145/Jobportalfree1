import { useEffect, useState } from "react";
import { Link, useNavigate } from '@/lib/router-compat';
import { supabase } from "@/lib/db-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import JobCard from "@/components/JobCard";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search, Briefcase, Users, TrendingUp, FileText, ArrowRight, MapPin, GraduationCap,
  Sparkles, ShieldCheck, BellRing, BookOpen, Code2, BarChart3, Palette, Megaphone,
  Building2, Star, CheckCircle2, Upload, PlusCircle, Quote, Pencil, Save, RotateCcw, X
} from "lucide-react";
import HeadlineTicker from "@/components/HeadlineTicker";
import PromoBanner from "@/components/PromoBanner";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import AutoSuggest from "@/components/AutoSuggest";
import CompanyMarquee from "@/components/CompanyMarquee";
import LiveUpdatedBadge from "@/components/LiveUpdatedBadge";
import TestimonialsMarquee from "@/components/TestimonialsMarquee";

import { useSiteSettings, writeSettings, DEFAULT_SETTINGS } from "@/lib/siteSettings";
import { useFestival, festivalRange } from "@/lib/festivals";
import { artworkDuration, useFestivalArtwork } from "@/lib/festivalArtwork";
import { LANDING_TEMPLATES, validLandingTemplate } from "@/lib/landingTemplates";
import LandingHero from "@/components/landing/LandingHero";
import FestivalArt from "@/components/FestivalArt";
import { toast } from "sonner";

const JOB_TITLE_SUGGESTIONS = [
  "Frontend Developer", "Backend Developer", "Full Stack Developer", "Software Engineer",
  "Senior Software Engineer", "Data Scientist", "Data Analyst", "Machine Learning Engineer",
  "DevOps Engineer", "Site Reliability Engineer", "Cloud Engineer", "Mobile Developer",
  "iOS Developer", "Android Developer", "Product Manager", "Project Manager",
  "UI Designer", "UX Designer", "UI/UX Designer", "Graphic Designer", "Product Designer",
  "QA Engineer", "Test Automation Engineer", "Business Analyst", "Marketing Manager",
  "Digital Marketing Specialist", "Content Writer", "SEO Specialist", "Sales Executive",
  "Customer Success Manager", "HR Manager", "Recruiter", "Finance Analyst",
];
const LOCATION_SUGGESTIONS = [
  "Hyderabad", "Bangalore", "Bengaluru", "Mumbai", "Delhi", "New Delhi", "Gurgaon",
  "Noida", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Kochi", "Indore",
  "Chandigarh", "Coimbatore", "Visakhapatnam", "Lucknow", "Bhubaneswar", "Nagpur",
  "Remote", "Hybrid", "Work from home", "Anywhere in India",
];
const EXPERIENCE_SUGGESTIONS = [
  "Fresher", "0-1 years", "1-2 years", "2-3 years", "3-5 years",
  "5-7 years", "7-10 years", "10+ years", "Internship", "Entry level",
  "Mid level", "Senior level", "Lead", "Manager",
];

const Index = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Tables<"jobs">[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [counts, setCounts] = useState({ jobs: 0, users: 0, applications: 0 });
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const [exp, setExp] = useState("");
  const { user, isAdmin } = useAuth();
  const settings = useSiteSettings();
  const { settings: festivalSettings, festival } = useFestival();
  const duration = artworkDuration(festivalSettings, festival?.id);
  const festivalPeriod = festival ? festivalRange(festival, new Date().getFullYear(), festivalSettings)?.start || String(new Date().getFullYear()) : "";
  const showFestIntro = useFestivalArtwork(festival?.id, festivalSettings.showImages, duration, festivalPeriod);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!editing) setDraft(settings); }, [settings, editing]);
  const visible = editing ? draft : settings;
  const template = validLandingTemplate(visible.landingTemplate);
  const saveLanding = async () => { setSaving(true); try { await writeSettings(draft); setEditing(false); toast.success('Landing page saved for everyone'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save'); } finally { setSaving(false); } };

  useEffect(() => {
    fetchJobs();
    fetchCounts();
    if (user) fetchSavedJobs();
  }, [user]);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs").select("*").eq("is_active", true)
      .order("created_at", { ascending: false }).limit(30);
    setJobs(data || []);
  };

  const fetchCounts = async () => {
    const [j, u, a] = await Promise.all([
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("applications").select("id", { count: "exact", head: true }),
    ]);
    setCounts({ jobs: j.count || 0, users: u.count || 0, applications: a.count || 0 });
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

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (loc) params.set("location", loc);
    if (exp) params.set("experience", exp);
    navigate(`/jobs${params.toString() ? `?${params}` : ""}`);
  };

  const stats = [
    { icon: Briefcase, label: visible.stat1Label, value: visible.stat1Override || `${counts.jobs}+`, sub: visible.stat1Sub },
    { icon: Users, label: visible.stat2Label, value: visible.stat2Override || `${Math.max(counts.users, 35)}+`, sub: visible.stat2Sub },
    { icon: FileText, label: visible.stat3Label, value: visible.stat3Override || `${Math.max(counts.applications, 22)}+`, sub: visible.stat3Sub },
    { icon: TrendingUp, label: visible.stat4Label, value: visible.stat4Value, sub: visible.stat4Sub },
  ];

  const categories = [
    { icon: Code2, label: "Software", color: "text-primary" },
    { icon: BarChart3, label: "Data Science", color: "text-primary" },
    { icon: Palette, label: "UI/UX Design", color: "text-accent-foreground" },
    { icon: Megaphone, label: "Marketing", color: "text-primary" },
    { icon: TrendingUp, label: "Sales", color: "text-primary" },
    { icon: Users, label: "Human Resources", color: "text-accent-foreground" },
  ];

  const companies = ["Google", "Microsoft", "Amazon", "Adobe", "Infosys", "TCS", "Meta", "Netflix"];

  const features = [
    { icon: ShieldCheck, title: "Verified Jobs", desc: "Every posting is reviewed and linked to a real source." },
    { icon: BellRing, title: "Daily Job Alerts", desc: "Personalized alerts the moment a matching job goes live." },
    { icon: BookOpen, title: "Interview Prep", desc: "Curated questions, tips and resources to crack interviews." },
    { icon: FileText, title: "Resume Templates", desc: "Professional templates ready to download and edit." },
  ];

  const testimonials = [
    { name: "Rahul Sharma", role: "Frontend Developer @ Wipro", text: "Got hired within 2 weeks. The job alerts were spot on for my skills." },
    { name: "Priya Mehta", role: "Data Analyst @ Infosys", text: "Tracking my applications in one place changed everything. Super clean UX." },
    { name: "Arjun Patel", role: "UI Designer @ Zomato", text: "The resume templates and interview prep gave me an edge I needed." },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <HeadlineTicker />
      <PromoBanner />
      {isAdmin && <div className="container flex flex-wrap justify-end gap-2 py-3">{editing ? <><Button disabled={saving} onClick={saveLanding}><Save className="w-4 h-4 mr-2" />{saving ? 'Saving…' : 'Save changes'}</Button><Button variant="outline" onClick={() => setDraft(DEFAULT_SETTINGS)}><RotateCcw className="w-4 h-4 mr-2" />Restore defaults</Button><Button variant="ghost" onClick={() => setEditing(false)}><X className="w-4 h-4 mr-2" />Cancel</Button></> : <Button variant="outline" onClick={() => { setDraft(settings); setEditing(true); }}><Pencil className="w-4 h-4 mr-2" />Edit this page</Button>}</div>}

      {isAdmin && editing && <div className="container px-4 pb-3"><p className="text-sm font-semibold mb-2">Home page design</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{LANDING_TEMPLATES.map(t => <Button key={t.id} type="button" variant="outline" aria-pressed={template === t.id} onClick={() => setDraft({ ...draft, landingTemplate: t.id })} className={`h-auto min-w-0 flex-col items-start whitespace-normal rounded-lg p-3 text-left ${template === t.id ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}><span aria-hidden="true" className="mb-1 flex w-full gap-1"><span className="h-2 flex-1 rounded-full bg-primary" /><span className="h-2 flex-1 rounded-full bg-secondary" /><span className="h-2 flex-1 rounded-full bg-accent" /></span><span className="block text-sm font-semibold">{t.name}</span><span className="block text-xs font-normal text-muted-foreground">{t.description}</span></Button>)}</div></div>}

      {template !== "classic" ? (
        <LandingHero
          template={template}
          badge={visible.heroBadge}
          title={visible.heroTitle === DEFAULT_SETTINGS.heroTitle ? <>Find your <span className="text-gradient">dream job</span> in minutes.</> : visible.heroTitle}
          description={visible.heroDescription}
          search={<div className="surface rounded-[1.6rem] p-2.5 space-y-2 md:space-y-0 md:flex md:items-center md:gap-1.5 shadow-[var(--shadow-lift)]"><AutoSuggest value={q} onChange={setQ} placeholder="Job title or keyword" icon={<Search className="w-4 h-4" />} suggestions={JOB_TITLE_SUGGESTIONS} onEnter={handleSearch} /><AutoSuggest value={loc} onChange={setLoc} placeholder="Location" icon={<MapPin className="w-4 h-4" />} suggestions={LOCATION_SUGGESTIONS} onEnter={handleSearch} /><Button variant="hero" size="lg" onClick={handleSearch} className="h-12 px-7 w-full md:w-auto gap-1.5 text-base"><Search className="w-4 h-4" /> Search</Button></div>}
          ctas={<div className="flex flex-wrap gap-3"><Link to="/profile"><Button variant="outline" size="sm" className="gap-2"><Upload className="w-4 h-4" /> Upload Resume</Button></Link><Link to="/job-alerts"><Button variant="ghost" size="sm" className="gap-2"><BellRing className="w-4 h-4" /> Get Job Alerts</Button></Link></div>}
          live={<LiveUpdatedBadge />}
          stats={stats}
          launch={[{ to: "/jobs", icon: Briefcase, t: "Browse jobs", d: `${counts.jobs || "New"} active openings` }, { to: "/assessments", icon: BarChart3, t: "Practice a test", d: "Free timed assessments" }, { to: "/exam-login", icon: Code2, t: "CodeXam exam login", d: "Your assigned exams & results" }]}
          jobs={jobs.slice(0, 5)}
          festivalArt={showFestIntro && festival ? <FestivalArt festival={festival} image={festivalSettings.custom?.[festival.id]?.image} animated={festivalSettings.showParticles} /> : undefined}
        />
      ) : (
      <section className="relative overflow-hidden">
        <div className="bg-hero absolute inset-0" aria-hidden="true" />
        <div className="grid-dots noise-fade absolute inset-0 opacity-70" aria-hidden="true" />

        <div className="container relative py-10 px-4 md:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* LEFT */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="secondary" className="eyebrow mb-5 gap-1.5 hover:bg-primary/10">
                <Sparkles className="w-3.5 h-3.5" /> {editing ? <Input aria-label="Landing badge" value={draft.heroBadge} onChange={e => setDraft({ ...draft, heroBadge: e.target.value })} /> : visible.heroBadge}
              </Badge>
              <h1 className="font-display text-[2.6rem] sm:text-6xl lg:text-[4.1rem] font-extrabold leading-[1.02] tracking-[-0.04em] mb-6">
                {editing ? <textarea aria-label="Landing headline" className="w-full rounded border bg-background p-2 text-3xl text-foreground" value={draft.heroTitle} onChange={e => setDraft({ ...draft, heroTitle: e.target.value })} /> : visible.heroTitle === DEFAULT_SETTINGS.heroTitle ? <>Find your <span className="text-gradient">dream job</span> in minutes.</> : visible.heroTitle}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-xl">
                {editing ? <textarea aria-label="Landing description" className="w-full rounded border bg-background p-2 text-base text-foreground" value={draft.heroDescription} onChange={e => setDraft({ ...draft, heroDescription: e.target.value })} /> : visible.heroDescription}
              </p>

              {/* Multi-field search with autosuggest */}
              <div className="surface rounded-[1.6rem] p-2.5 space-y-2 md:space-y-0 md:flex md:items-center md:gap-1.5 shadow-[var(--shadow-lift)]">
                <AutoSuggest value={q} onChange={setQ} placeholder="Job title or keyword"
                  icon={<Search className="w-4 h-4" />} suggestions={JOB_TITLE_SUGGESTIONS} onEnter={handleSearch} />
                <div className="hidden md:block w-px h-7 bg-border" />
                <AutoSuggest value={loc} onChange={setLoc} placeholder="Location"
                  icon={<MapPin className="w-4 h-4" />} suggestions={LOCATION_SUGGESTIONS} onEnter={handleSearch} />
                <div className="hidden md:block w-px h-7 bg-border" />
                <AutoSuggest value={exp} onChange={setExp} placeholder="Experience"
                  icon={<GraduationCap className="w-4 h-4" />} suggestions={EXPERIENCE_SUGGESTIONS} onEnter={handleSearch} />
                <Button variant="hero" size="lg" onClick={handleSearch} className="h-12 px-7 w-full md:w-auto gap-1.5 text-base">
                  <Search className="w-4 h-4" /> Search
                </Button>
              </div>

              {/* Dual CTAs */}
              <div className="flex flex-wrap gap-3 mt-5">
                <Link to="/profile">
                  <Button variant="outline" size="sm" className="gap-2 hover-lift">
                    <Upload className="w-4 h-4" /> Upload Resume
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="sm" className="gap-2 hover-lift">
                    <PlusCircle className="w-4 h-4" /> Post a Job
                  </Button>
                </Link>
                <Link to="/job-alerts">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <BellRing className="w-4 h-4" /> Get Job Alerts
                  </Button>
                </Link>
              </div>

              {/* Live updated badge */}
              <div className="mt-5">
                <LiveUpdatedBadge />
              </div>
            </motion.div>

            <>
            {/* RIGHT — everything-in-one-place launcher */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="relative">
              <AnimatePresence mode="wait">
              {showFestIntro && festival ? (
                <motion.div key="fest" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.5 }} className="fest-intro">
                  <FestivalArt festival={festival} image={festivalSettings.custom?.[festival.id]?.image} animated={festivalSettings.showParticles} />
                  {duration !== "permanent" && <span key={`${festival.id}-${duration}`} className="fest-intro-bar" style={{ animationDuration: `${duration}s` }} aria-hidden="true" />}
                </motion.div>
              ) : (
              <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <div className="surface-ink relative overflow-hidden p-6 sm:p-8 shadow-[0_40px_80px_-40px_hsl(var(--ink)/0.8)]">
                <div className="grid-dots absolute inset-0 opacity-30" aria-hidden="true" />
                <div className="relative flex items-center justify-between">
                  <p className="eyebrow"><Sparkles className="w-3.5 h-3.5" /> One portal</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold muted-on-ink"><span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Live</span>
                </div>
                <h2 className="relative mt-5 font-display text-2xl sm:text-3xl font-extrabold leading-tight">Jobs, practice and exams —<br />pick where to start.</h2>
                <div className="relative mt-6 grid gap-3">
                  {[
                    { to: "/jobs", icon: Briefcase, t: "Browse jobs", d: `${counts.jobs || "New"} active openings`, tone: "bg-primary text-primary-foreground" },
                    { to: "/assessments", icon: BarChart3, t: "Practice a test", d: "Free timed assessments", tone: "bg-secondary text-secondary-foreground" },
                    { to: "/exam-login", icon: Code2, t: "CodeXam exam login", d: "Your assigned exams & results", tone: "bg-accent text-accent-foreground" },
                  ].map((x) => (
                    <Link key={x.to} to={x.to} className="group flex items-center gap-4 rounded-2xl border border-ink-foreground/10 bg-ink-foreground/5 p-4 hover:bg-ink-foreground/10 hover:border-ink-foreground/25">
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${x.tone}`}><x.icon className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1"><span className="block font-semibold">{x.t}</span><span className="block text-xs muted-on-ink">{x.d}</span></span>
                      <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
                <div className="relative mt-6 flex flex-wrap gap-2 text-xs">
                  {["Interview prep", "Resume templates", "Certifications", "Job alerts", "AI chat"].map((c) => <span key={c} className="rounded-full border border-ink-foreground/15 px-3 py-1 muted-on-ink">{c}</span>)}
                </div>
              </div>
              </motion.div>
              )}
              </AnimatePresence>
              {!(showFestIntro && festival) && <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.2, repeat: Infinity }} className="surface absolute -left-4 -bottom-9 z-10 hidden lg:flex items-center gap-2 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></span>
                <span><span className="block text-xs font-bold">Application sent</span><span className="block text-[10px] text-muted-foreground">Track it in one dashboard</span></span>
              </motion.div>}
            </motion.div>
            </>
          </div>

          {/* Stats — staggered scroll reveal */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-12">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
              >
                <Card className="hover-lift rounded-2xl">
                  <CardContent className="p-4 text-center">
                    <s.icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                    {editing ? <div className="space-y-2">{['Label', 'Sub', i === 3 ? 'Value' : 'Override'].map(field => { const key = `stat${i + 1}${field}` as keyof typeof draft; return <Input key={key} aria-label={`Statistic ${i + 1} ${field}`} placeholder={field} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />; })}</div> : <><p className="font-display text-2xl md:text-3xl font-bold">{s.value}</p><p className="text-xs md:text-sm font-medium">{s.label}</p><p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p></>}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* TOP COMPANIES — marquee with real logos */}
      <section className="border-y border-border/60 bg-card/60">
        <div className="container py-8 px-4">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground mb-5 font-semibold">
            Hiring now from 500+ top companies
          </p>
          <CompanyMarquee />
        </div>
      </section>

      {/* EVERYTHING IN ONE PLACE */}
      <section className="container py-12 md:py-20 px-4">
        <div className="max-w-2xl mb-8">
          <p className="eyebrow mb-4">Everything in one place</p>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold leading-[1.05]">Search, practise, test and apply — <span className="text-gradient">without switching sites.</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:auto-rows-[170px]">
          {[
            { to: "/jobs", icon: Briefcase, title: "Find jobs", desc: "Fresh, verified openings with real apply links.", span: "md:col-span-2 md:row-span-2", strong: true },
            { to: "/exam-login", icon: Code2, title: "Exam portal", desc: "Coding, MCQ, fill-in and writing tests with instant reports.", span: "md:col-span-2" },
            { to: "/assessments", icon: BarChart3, title: "Skill assessments", desc: "Check where you stand.", span: "" },
            { to: "/interview-prep", icon: BookOpen, title: "Interview prep", desc: "Questions and tips.", span: "" },
            { to: "/resume-templates", icon: FileText, title: "Resume templates", desc: "Ready to download.", span: "" },
            { to: "/job-alerts", icon: BellRing, title: "Job alerts", desc: "Matches in your inbox.", span: "" },
            { to: "/certifications", icon: ShieldCheck, title: "Certifications", desc: "Boost your profile.", span: "md:col-span-2" },
          ].map((t) => (
            <Link key={t.to} to={t.to} className={`group relative overflow-hidden rounded-3xl border p-6 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-xl ${t.span} ${t.strong ? "surface-ink border-transparent" : "bg-card border-border/60 hover:border-primary/40 hover:shadow-[var(--shadow-lift)]"}`}>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${t.strong ? "bg-accent text-accent-foreground" : "bg-primary/10"}`}>
                <t.icon className={`w-5 h-5 ${t.strong ? "" : "text-primary"}`} />
              </div>
              <div>
                <h3 className={`font-display font-bold ${t.strong ? "text-3xl md:text-4xl" : "text-lg"}`}>{t.title}</h3>
                <p className={`text-sm mt-1 ${t.strong ? "muted-on-ink" : "text-muted-foreground"}`}>{t.desc}</p>
                {t.strong && <div className="mt-5 flex flex-wrap gap-2">{categories.map((c) => <span key={c.label} className="text-xs rounded-full border border-ink-foreground/15 bg-ink-foreground/5 px-3 py-1">{c.label}</span>)}</div>}
              </div>
              <ArrowRight className="absolute top-6 right-6 w-5 h-5 opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED JOBS */}
      <section className="container py-10 px-4 md:py-16">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold">Featured opportunities</h2>
            <p className="text-sm text-muted-foreground mt-1">Hand-picked roles posted recently</p>
          </div>
          <Link to="/jobs">
            <Button variant="ghost" className="gap-1 text-sm">View All <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card px-6 py-20 text-center text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg">No jobs posted yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} isSaved={savedJobs.includes(job.id)} onToggleSave={() => toggleSave(job.id)} />
            ))}
          </div>
        )}
      </section>

      {/* TESTIMONIALS — dual-row marquee */}
      <section className="py-12 md:py-16">
        <div className="container px-4 text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold">Loved by candidates</h2>
          <p className="text-sm text-muted-foreground mt-2">Real stories from people who got hired through us.</p>
        </div>
        <TestimonialsMarquee />
      </section>

      {/* SUCCESS STORIES STRIP */}
      <section className="container px-4 pb-10">
        <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div>
                <p className="font-display text-xl font-bold">500+ candidates hired</p>
                <p className="text-sm text-muted-foreground">across Google, Microsoft, Adobe, Infosys, TCS and more</p>
              </div>
            </div>
            <Link to="/register">
              <Button className="gap-1">Join them <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="container px-4 pb-12 md:pb-20">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-secondary p-8 md:p-12 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-3">Ready to launch your career?</h2>
          <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto text-sm md:text-base">
            Create your profile, upload your resume, and start applying in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto bg-card text-foreground hover:bg-card/90">Get Started Free</Button>
            </Link>
            <Link to="/resume-templates">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto bg-card text-foreground hover:bg-card/90">Resume Templates</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

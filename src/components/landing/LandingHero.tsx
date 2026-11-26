import type { ReactNode, ComponentType } from "react";
import { motion } from "framer-motion";
import { Link } from "@/lib/router-compat";
import { ArrowRight, CheckCircle2, MapPin, Sparkles, Building2, Flame, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LandingTemplateId } from "@/lib/landingTemplates";
import ModernLandingHero from "./ModernLandingHero";

type Icon = ComponentType<{ className?: string }>;
export interface HeroStat { icon: Icon; label: string; value: string; sub: string }
export interface HeroLaunch { to: string; icon: Icon; t: string; d: string }
export interface HeroJob { id: string; title: string | null; company: string | null; location: string | null; job_type?: string | null }

export interface LandingHeroProps {
  template: LandingTemplateId;
  badge: ReactNode;
  title: ReactNode;
  description: ReactNode;
  search: ReactNode;
  ctas: ReactNode;
  live: ReactNode;
  stats: HeroStat[];
  statEditor?: (i: number) => ReactNode;
  launch: HeroLaunch[];
  jobs: HeroJob[];
  festivalArt?: ReactNode;
}

const TONES = ["bg-primary text-primary-foreground", "bg-secondary text-secondary-foreground", "bg-accent text-accent-foreground"];
const rise = (delay = 0) => ({ initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay } });

function StatGrid({ stats, statEditor, variant = "card" }: { stats: HeroStat[]; statEditor?: (i: number) => ReactNode; variant?: "card" | "ink" | "pill" | "color" }) {
  return (
    <div className={`grid grid-cols-2 gap-3 md:gap-4 ${variant === "color" ? "" : "md:grid-cols-4"} ${variant === "pill" ? "mt-10" : "mt-12"}`}>
      {stats.map((s, i) => (
        <motion.div key={s.label + i} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, delay: i * 0.1 }}>
          {variant === "ink" ? (
            <div className="rounded-2xl border border-ink-foreground/10 bg-ink-foreground/5 p-4 text-center">
              <s.icon className="mx-auto mb-1.5 h-5 w-5 text-accent" />
              {statEditor ? statEditor(i) : <><p className="font-display text-2xl font-bold md:text-3xl">{s.value}</p><p className="text-xs font-semibold md:text-sm">{s.label}</p><p className="text-[11px] muted-on-ink">{s.sub}</p></>}
            </div>
          ) : variant === "color" ? (
            <div className={`landing-stat-tile landing-stat-${i} rounded-2xl p-4`}>
              <s.icon className="mb-2 h-5 w-5 opacity-90" />
              {statEditor ? <div className="rounded-xl bg-card p-2 text-foreground">{statEditor(i)}</div> : <><p className="font-display text-2xl font-extrabold md:text-3xl">{s.value}</p><p className="text-xs font-bold md:text-sm">{s.label}</p><p className="text-[11px] opacity-80">{s.sub}</p></>}
            </div>
          ) : (
            <Card className={`hover-lift ${variant === "pill" ? "rounded-full" : "rounded-2xl"}`}>
              <CardContent className={variant === "pill" ? "flex items-center justify-center gap-3 px-4 py-3" : "p-4 text-center"}>
                <s.icon className={`h-5 w-5 text-primary ${variant === "pill" ? "shrink-0" : "mx-auto mb-1.5"}`} />
                {statEditor ? <div className="space-y-2">{statEditor(i)}</div> : variant === "pill"
                  ? <p className="min-w-0 text-left"><span className="block font-display text-xl font-bold leading-none">{s.value}</span><span className="text-xs text-muted-foreground">{s.label}</span></p>
                  : <><p className="font-display text-2xl font-bold md:text-3xl">{s.value}</p><p className="text-xs font-medium md:text-sm">{s.label}</p><p className="text-[11px] text-muted-foreground">{s.sub}</p></>}
              </CardContent>
            </Card>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function Launcher({ launch }: { launch: HeroLaunch[] }) {
  return (
    <div className="surface-ink relative overflow-hidden p-6 shadow-[0_40px_80px_-40px_hsl(var(--ink)/0.8)] sm:p-8">
      <div className="grid-dots absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="relative flex items-center justify-between">
        <p className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> One portal</p>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold muted-on-ink"><span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Live</span>
      </div>
      <h2 className="relative mt-5 font-display text-2xl font-extrabold leading-tight sm:text-3xl">Jobs, practice and exams —<br />pick where to start.</h2>
      <div className="relative mt-6 grid gap-3">
        {launch.map((x, i) => (
          <Link key={x.to} to={x.to} className="group flex items-center gap-4 rounded-2xl border border-ink-foreground/10 bg-ink-foreground/5 p-4 hover:border-ink-foreground/25 hover:bg-ink-foreground/10">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${TONES[i % 3]}`}><x.icon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-semibold">{x.t}</span><span className="block text-xs muted-on-ink">{x.d}</span></span>
            <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
          </Link>
        ))}
      </div>
      <div className="relative mt-6 flex flex-wrap gap-2 text-xs">
        {["Interview prep", "Resume templates", "Certifications", "Job alerts", "AI chat"].map((c) => <span key={c} className="rounded-full border border-ink-foreground/15 px-3 py-1 muted-on-ink">{c}</span>)}
      </div>
    </div>
  );
}

export default function LandingHero(p: LandingHeroProps) {
  return <>{p.festivalArt && <div className="container py-6"><div className="festival-home-showcase">{p.festivalArt}</div></div>}<LandingHeroContent {...p} festivalArt={undefined} /></>;
}

function LandingHeroContent(p: LandingHeroProps) {
  if (["studio", "horizon", "mosaic", "pulse", "atelier"].includes(p.template)) return <ModernLandingHero {...p} />;
  const art = p.festivalArt ? <div className="absolute -right-4 -top-28 z-10 hidden w-28 rotate-6 xl:block [&_.festival-art-caption]:!hidden">{p.festivalArt}</div> : null;

  if (p.template === "spotlight") return (
    <section className="landing-hero relative overflow-hidden">
      <div className="hero-spotlight absolute inset-0" aria-hidden="true" />
      <div className="grid-dots noise-fade absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="container relative px-4 py-12 text-center md:py-20">
        <motion.div {...rise()} className="mx-auto max-w-4xl">
          <div className="eyebrow mx-auto mb-6"><Sparkles className="h-3.5 w-3.5" /> {p.badge}</div>
          <h1 className="mb-6 font-display text-[2.7rem] font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">{p.title}</h1>
          <p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground md:text-lg">{p.description}</p>
          <div className="mx-auto max-w-4xl text-left">{p.search}</div>
          <div className="mt-5 flex flex-wrap justify-center gap-3">{p.ctas}</div>
          <div className="mt-5 flex justify-center">{p.live}</div>
        </motion.div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 text-left sm:grid-cols-3">
          {p.launch.map((x, i) => (
            <motion.div key={x.to} {...rise(0.15 + i * 0.1)}>
              <Link to={x.to} className={`spot-card spot-card-${i} group flex h-full flex-col justify-between rounded-3xl p-6`}>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-card/20 backdrop-blur"><x.icon className="h-6 w-6" /></span>
                <span className="mt-8 block">
                  <span className="block font-display text-xl font-bold">{x.t}</span>
                  <span className="mt-1 block text-sm opacity-85">{x.d}</span>
                </span>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold">Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="mx-auto max-w-5xl"><StatGrid stats={p.stats} statEditor={p.statEditor} variant="pill" /></div>
      </div>
    </section>
  );

  if (p.template === "aurora") return (
    <section className="landing-hero relative overflow-hidden">
      <div className="hero-aurora absolute inset-0" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="container relative px-4 py-12 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
          <motion.div {...rise()} className="glass rounded-[2rem] border p-6 shadow-[var(--shadow-lift)] sm:p-9">
            <div className="eyebrow mb-5"><Sparkles className="h-3.5 w-3.5" /> {p.badge}</div>
            <h1 className="mb-5 font-display text-[2.5rem] font-extrabold leading-[1.03] tracking-[-0.04em] sm:text-6xl">{p.title}</h1>
            <p className="mb-7 max-w-xl text-base text-muted-foreground md:text-lg">{p.description}</p>
            {p.search}
            <div className="mt-5 flex flex-wrap gap-3">{p.ctas}</div>
            <div className="mt-5">{p.live}</div>
          </motion.div>
          <motion.div {...rise(0.15)} className="relative">
            {art}
            <StatGrid stats={p.stats} statEditor={p.statEditor} variant="color" />
            <div className="mt-4 grid gap-3">
              {p.launch.map((x, i) => (
                <Link key={x.to} to={x.to} className="glass group flex items-center gap-3 rounded-2xl border p-3.5 hover-lift">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TONES[i % 3]}`}><x.icon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{x.t}</span><span className="block truncate text-xs text-muted-foreground">{x.d}</span></span>
                  <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );

  if (p.template === "midnight") return (
    <section className="landing-hero hero-midnight relative overflow-hidden text-ink-foreground">
      <div className="hero-midnight-glow absolute inset-0" aria-hidden="true" />
      <div className="container relative px-4 py-14 md:py-24">
        <div className="grid items-end gap-10 lg:grid-cols-[1.4fr_1fr]">
          <motion.div {...rise()}>
            <div className="eyebrow mb-6 !border-ink-foreground/20 !bg-ink-foreground/10 !text-ink-foreground"><Flame className="h-3.5 w-3.5 text-accent" /> {p.badge}</div>
            <h1 className="mb-6 font-display text-[2.8rem] font-extrabold leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-[5.2rem]">{p.title}</h1>
            <p className="mb-8 max-w-xl text-base md:text-lg muted-on-ink">{p.description}</p>
            <div className="text-foreground">{p.search}</div>
            <div className="midnight-ctas mt-5 flex flex-wrap gap-3">{p.ctas}</div>
          </motion.div>
          <motion.div {...rise(0.15)} className="relative grid gap-3">
            {art}
            {p.launch.map((x, i) => (
              <Link key={x.to} to={x.to} className={`neon-link neon-${i} group flex items-center gap-4 rounded-2xl p-4`}>
                <x.icon className="h-6 w-6 shrink-0" />
                <span className="min-w-0 flex-1"><span className="block font-display text-lg font-bold">{x.t}</span><span className="block text-xs muted-on-ink">{x.d}</span></span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </motion.div>
        </div>
        <StatGrid stats={p.stats} statEditor={p.statEditor} variant="ink" />
      </div>
    </section>
  );

  if (p.template === "editorial") return (
    <section className="landing-hero relative overflow-hidden border-b border-border">
      <div className="container relative px-4 py-10 md:py-16">
        <motion.div {...rise()} className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground pb-3 text-xs font-bold uppercase tracking-[0.18em]">
          <span className="inline-flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-accent" />{p.badge}</span>
          <span className="text-muted-foreground">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
        </motion.div>
        <motion.h1 {...rise(0.05)} className="editorial-title mt-8 font-display text-[2.9rem] font-extrabold leading-[0.95] tracking-[-0.055em] sm:text-7xl lg:text-[6.2rem]">{p.title}</motion.h1>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <motion.div {...rise(0.12)}>
            <p className="mb-7 max-w-xl text-lg text-muted-foreground first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-extrabold first-letter:leading-[0.8] first-letter:text-accent">{p.description}</p>
            {p.search}
            <div className="mt-5 flex flex-wrap gap-3">{p.ctas}</div>
            <div className="mt-5">{p.live}</div>
          </motion.div>
          <motion.div {...rise(0.2)} className="relative">
            {art}
            <div className="surface overflow-hidden">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <p className="font-display text-sm font-bold uppercase tracking-[0.14em]">Latest openings</p>
                <Link to="/jobs" className="inline-flex items-center gap-1 text-xs font-bold text-primary">All jobs <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
              <ol className="divide-y">
                {p.jobs.slice(0, 5).map((j, i) => (
                  <li key={j.id}>
                    <Link to={`/jobs/${j.id}`} className="group flex items-start gap-4 px-5 py-3.5 hover:bg-muted/60">
                      <span className="font-display text-2xl font-extrabold leading-none text-accent">{String(i + 1).padStart(2, "0")}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold group-hover:text-primary">{j.title || "Open role"}</span>
                        <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          {j.company && <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{j.company}</span>}
                          {j.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>}
                          {j.job_type && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{j.job_type}</span>}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
                {!p.jobs.length && <li className="px-5 py-8 text-center text-sm text-muted-foreground">New openings appear here.</li>}
              </ol>
            </div>
          </motion.div>
        </div>
        <StatGrid stats={p.stats} statEditor={p.statEditor} />
      </div>
    </section>
  );

  // Classic split
  return (
    <section className="landing-hero relative overflow-hidden">
      <div className="bg-hero absolute inset-0" aria-hidden="true" />
      <div className="grid-dots noise-fade absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="container relative px-4 py-10 md:py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <motion.div {...rise()}>
            <div className="eyebrow mb-5"><Sparkles className="h-3.5 w-3.5" /> {p.badge}</div>
            <h1 className="mb-6 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-[4.1rem]">{p.title}</h1>
            <p className="mb-6 max-w-xl text-base text-muted-foreground md:text-lg">{p.description}</p>
            {p.search}
            <div className="mt-5 flex flex-wrap gap-3">{p.ctas}</div>
            <div className="mt-5">{p.live}</div>
          </motion.div>
          <motion.div {...rise(0.15)} className="relative">
            {art}
            <Launcher launch={p.launch} />
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.2, repeat: Infinity }} className="surface absolute -bottom-9 -left-4 hidden items-center gap-2 p-3 sm:flex">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></span>
              <span><span className="block text-xs font-bold">Application sent</span><span className="block text-[10px] text-muted-foreground">Track it in one dashboard</span></span>
            </motion.div>
          </motion.div>
        </div>
        <StatGrid stats={p.stats} statEditor={p.statEditor} />
      </div>
    </section>
  );
}

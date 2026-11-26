import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Sparkles, MapPin, Building2 } from "lucide-react";
import { Link } from "@/lib/router-compat";
import type { LandingHeroProps } from "./LandingHero";
import workspace from "@/assets/career-workspace.jpg";
import campus from "@/assets/career-campus.jpg";

export default function ModernLandingHero(p: LandingHeroProps) {
  const reduced = useReducedMotion();
  const reveal = (i = 0) => ({ initial: reduced ? false as const : { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: .65, delay: i * .09 } });
  const photo = p.template === "studio" || p.template === "horizon";
  const badge = <div className="eyebrow mb-5"><Sparkles className="h-3.5 w-3.5" />{p.badge}</div>;
  const stats = <div className="modern-stats grid grid-cols-2 gap-5 md:grid-cols-4">{p.stats.map((s, i) => <motion.div key={i} {...reveal(i + 2)} className="min-w-0 border-t border-border pt-4"><s.icon className="mb-3 h-5 w-5 text-primary" />{p.statEditor ? p.statEditor(i) : <><p className="font-display text-3xl font-bold">{s.value}</p><p className="mt-1 text-sm font-semibold">{s.label}</p><p className="mt-1 text-xs text-muted-foreground">{s.sub}</p></>}</motion.div>)}</div>;
  const shortcuts = (colourful = false) => <div className={`modern-shortcuts grid gap-3 ${colourful ? "md:grid-cols-3" : "sm:grid-cols-3"}`}>{p.launch.map((x, i) => <motion.div key={x.to} {...reveal(i + 1)}><Link to={x.to} className={`modern-destination group flex h-full min-w-0 flex-col rounded-lg border p-5 ${colourful ? `landing-stat-${i}` : "border-border bg-card text-card-foreground"}`}><div className="flex items-center justify-between"><x.icon className="h-6 w-6" /><ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></div><span className="mt-6 block font-display text-lg font-bold">{x.t}</span><span className={`mt-2 block text-sm ${colourful ? "opacity-90" : "text-muted-foreground"}`}>{x.d}</span></Link></motion.div>)}</div>;
  const copy = <motion.div {...reveal()} className="min-w-0">{badge}<h1 className="modern-title font-display font-extrabold">{p.title}</h1><p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">{p.description}</p></motion.div>;
  const search = <motion.div {...reveal(1)} className="modern-search mt-7 min-w-0">{p.search}<div className="mt-4 flex flex-wrap gap-3">{p.ctas}</div><div className="mt-4">{p.live}</div></motion.div>;
  const artwork = p.festivalArt ? <div className="modern-festival mb-6">{p.festivalArt}</div> : null;

  if (photo) return <section className={`landing-hero modern-home modern-${p.template}`}>
    <div className="modern-photo-stage relative overflow-hidden">
      <motion.img initial={reduced ? false : { scale: 1.045 }} animate={{ scale: 1 }} transition={{ duration: 1.8 }} src={p.template === "studio" ? workspace : campus} alt={p.template === "studio" ? "Professionals collaborating in a modern learning workspace" : "Professionals arriving at a modern technology campus"} width={1600} height={1008} fetchPriority="high" className="modern-cover absolute inset-0 h-full w-full object-cover" />
      <div className="modern-photo-wash absolute inset-0" aria-hidden="true" />
      <div className="container relative py-10 md:py-14"><div className="modern-photo-copy max-w-2xl">{copy}{search}</div></div>
    </div>
    <div className="container space-y-8 py-7">{artwork}{shortcuts()}{stats}</div>
  </section>;

  if (p.template === "mosaic") return <section className="landing-hero modern-home modern-mosaic"><div className="container py-10 md:py-14"><div className="mx-auto max-w-4xl text-center">{copy}<div className="mx-auto max-w-3xl text-left">{search}</div></div><div className="mt-9">{artwork}{shortcuts(true)}</div><div className="mt-8">{stats}</div></div></section>;

  if (p.template === "pulse") return <section className="landing-hero modern-home modern-pulse"><div className="container py-10 md:py-14"><div className="grid gap-9 lg:grid-cols-[1.2fr_1fr]"><div className="min-w-0">{copy}{search}</div><div className="min-w-0">{artwork}<div className="mb-3 flex items-center justify-between border-b border-border pb-3"><h2 className="font-display text-lg font-bold">Latest opportunities</h2><Link to="/jobs" aria-label="All jobs" className="text-primary"><ArrowUpRight className="h-5 w-5" /></Link></div>{p.jobs.slice(0, 4).map((j, i) => <motion.div key={j.id} {...reveal(i + 1)}><Link to={`/jobs/${j.id}`} className="modern-job group flex items-center gap-4 border-b border-border py-4"><span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1"><span className="block font-semibold group-hover:text-primary">{j.title || "Open role"}</span><span className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{j.company}</span><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span></span></span><ArrowUpRight className="h-4 w-4 shrink-0" /></Link></motion.div>)}{!p.jobs.length && <Link to="/jobs" className="block py-8 text-primary">Browse all openings <ArrowUpRight className="inline h-4 w-4" /></Link>}</div></div><div className="mt-9">{shortcuts()}</div><div className="mt-8">{stats}</div></div></section>;

  return <section className="landing-hero modern-home modern-atelier"><div className="container py-10 md:py-14"><div className="border-b border-border pb-7">{copy}</div><div className="mt-8 grid items-center gap-8 lg:grid-cols-2"><div className="min-w-0">{search}{artwork}</div><motion.div {...reveal(2)} className="overflow-hidden"><img src={workspace} alt="A collaborative workspace for professionals" width={1600} height={1008} className="atelier-photo w-full object-cover" /></motion.div></div><div className="mt-8">{shortcuts()}</div><div className="mt-8">{stats}</div></div></section>;
}
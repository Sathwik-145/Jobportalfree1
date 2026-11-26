import PublicContacts from "@/components/PublicContacts";
import { Link } from "@/lib/router-compat";
import { ArrowUpRight, Heart } from "lucide-react";
import logo from "@/assets/logo.png";

const COLUMNS = [
  {
    title: "Find work",
    links: [
      { to: "/jobs", label: "Browse jobs" },
      { to: "/job-alerts", label: "Job alerts" },
      { to: "/saved-jobs", label: "Saved jobs" },
      { to: "/my-applications", label: "My applications" },
    ],
  },
  {
    title: "Prepare",
    links: [
      { to: "/assessments", label: "Skill assessments" },
      { to: "/interview-prep", label: "Interview prep" },
      { to: "/mock-interviews", label: "Mock interviews" },
      { to: "/certifications", label: "Certifications" },
      { to: "/resume-templates", label: "Resume templates" },
    ],
  },
  {
    title: "CodeXam & help",
    links: [
      { to: "/exam-login", label: "Exam login" },
      { to: "/start", label: "Quick start" },
      { to: "/chat", label: "JobBot AI chat" },
      { to: "/contact", label: "Contact us" },
    ],
  },
];

const Footer = () => (
  <footer className="mt-10 px-3 pb-3 sm:px-4 sm:pb-4">
    <div className="surface-ink overflow-hidden">
      <div className="container py-10 md:py-14">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 border-b border-ink-foreground/10 pb-10 md:flex-row md:items-center">
          <div>
            <p className="eyebrow">Free forever for students</p>
            <h2 className="mt-3 max-w-xl font-display text-2xl font-extrabold md:text-4xl">
              Your next role starts with one search.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/jobs" className="btn-pill btn-pill-accent">Browse jobs <ArrowUpRight className="h-4 w-4" /></Link>
            <Link to="/register" className="btn-pill border border-ink-foreground/20 text-ink-foreground hover:bg-ink-foreground/10">Create account</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="JobPortalFree" className="h-9 w-9 rounded-full bg-card object-cover" />
              <span className="font-display text-lg font-extrabold">JobPortal<span className="text-accent">Free</span></span>
            </div>
            <p className="max-w-xs text-sm muted-on-ink">
              Jobs, preparation and online exams for students and freshers — all in one place.
            </p>
            <div className="max-w-xs [&_a]:text-ink-foreground/80 [&_a:hover]:text-ink-foreground [&_.bg-primary\/5]:bg-ink-foreground/5">
              <PublicContacts />
            </div>
          </div>
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-foreground/60">{c.title}</h3>
              <ul className="space-y-2 text-sm">
                {c.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-ink-foreground/85 hover:text-accent">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-ink-foreground/10 pt-6 text-xs text-ink-foreground/60 sm:flex-row">
          <p>© {new Date().getFullYear()} JobPortalFree. All rights reserved.</p>
          <p className="flex items-center gap-1">Made with <Heart className="h-3 w-3 fill-accent text-accent" /> for students</p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;

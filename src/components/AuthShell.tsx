import type { ReactNode } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowLeft, BadgeCheck, BellRing, ClipboardCheck, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";

const POINTS = [
  { icon: BadgeCheck, text: "Verified fresher jobs with real apply links" },
  { icon: BellRing, text: "Daily alerts the moment a match goes live" },
  { icon: ClipboardCheck, text: "Free practice tests and CodeXam exams" },
];

/** Split-screen frame shared by sign in, sign up and password screens. */
export default function AuthShell({
  title,
  subtitle,
  back = { to: "/", label: "Home" },
  children,
}: {
  title: string;
  subtitle?: string;
  back?: { to: string; label: string };
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      <aside className="surface-ink relative m-3 hidden flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14">
        <div className="grid-dots absolute inset-0 opacity-40" aria-hidden="true" />
        <Link to="/" className="relative flex items-center gap-3">
          <span className="logo-ring h-11 w-11"><img src={logo} alt="" className="h-full w-full rounded-full bg-card object-cover" /></span>
          <span className="font-display text-xl font-extrabold">JobPortal<span className="text-accent">Free</span></span>
        </Link>
        <div className="relative max-w-md">
          <p className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> Built for students</p>
          <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] xl:text-5xl">
            Search, practise, test and apply — <span className="text-accent">in one place.</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-sm muted-on-ink">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-foreground/10 text-accent"><p.icon className="h-4 w-4" /></span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs muted-on-ink">© {new Date().getFullYear()} JobPortalFree</p>
      </aside>

      <main className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to={back.to} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {back.label}
          </Link>
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <img src={logo} alt="JobPortalFree" className="h-8 w-8 rounded-full object-cover" />
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10 animate-rise">
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}

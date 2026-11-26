import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "@/lib/router-compat";
import { ArrowRight, ChevronDown, LayoutGrid, Sparkles, Zap } from "lucide-react";
import { EVERYTHING } from "@/lib/navItems";
import { cn } from "@/lib/utils";

/** Desktop "Everything" menu: opens as soon as the pointer rests on it, closes shortly after it leaves. */
export default function EverythingMenu() {
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const { pathname } = useLocation();

  const show = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen((was) => { if (!was) setRound((r) => r + 1); return true; }), 60);
  };
  const hide = (delay = 180) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), delay);
  };

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  let n = 0;
  return (
    <div
      onMouseEnter={show}
      onMouseLeave={() => hide()}
      onFocus={show}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) hide(0); }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => (open ? setOpen(false) : show())}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
          open ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <LayoutGrid className="h-4 w-4" /> Everything
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", open && "rotate-180")} />
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        className={cn(
          "absolute left-1/2 top-[calc(100%-6px)] z-50 w-[min(96vw,1040px)] -translate-x-1/2 pt-3 transition-all duration-300 ease-[cubic-bezier(.2,.8,.2,1)]",
          open ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-2 opacity-0",
        )}
      >
        <div className="mega-panel">
          <div key={round} className="grid gap-2 p-3 lg:grid-cols-[250px_1fr]">
            {/* Featured */}
            <div className="mega-feature mega-item" style={{ animationDelay: "0ms" }}>
              <span className="eyebrow"><Sparkles className="h-3 w-3" /> All in one place</span>
              <p className="mt-4 font-display text-xl font-extrabold leading-tight">Jobs, practice and exams — one free portal.</p>
              <p className="muted-on-ink mt-2 text-xs leading-relaxed">Everything you need from first search to final offer.</p>
              <div className="mt-5 grid gap-2">
                <Link to="/jobs" className="mega-cta mega-cta-solid">Browse jobs <ArrowRight className="h-3.5 w-3.5" /></Link>
                <Link to="/start" className="mega-cta mega-cta-ghost"><Zap className="h-3.5 w-3.5" /> Quick start an exam</Link>
              </div>
              <span aria-hidden className="mega-orb mega-orb-a" />
              <span aria-hidden className="mega-orb mega-orb-b" />
            </div>

            {/* Groups */}
            <div className="grid gap-1 sm:grid-cols-3">
              {EVERYTHING.map((g) => (
                <div key={g.group} className="rounded-2xl p-2">
                  <div className="mega-item mb-1.5 px-2.5" style={{ animationDelay: `${(n++) * 22}ms` }}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{g.group}</p>
                    <p className="text-[11px] text-muted-foreground">{g.blurb}</p>
                  </div>
                  <ul className="space-y-0.5">
                    {g.items.map((it) => {
                      const active = pathname === it.to;
                      return (
                        <li key={it.to} className="mega-item" style={{ animationDelay: `${(n++) * 22}ms` }}>
                          <Link to={it.to} role="menuitem" className={cn("mega-link group", active && "mega-link-active")}>
                            <span className="mega-icon"><it.icon className="h-4 w-4" /></span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                <span className="truncate">{it.label}</span>
                                {it.badge && <span className="mega-badge">{it.badge}</span>}
                              </span>
                              {it.desc && <span className="block truncate text-xs text-muted-foreground">{it.desc}</span>}
                            </span>
                            <ArrowRight className="mega-arrow h-3.5 w-3.5" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mega-foot">
            <span>Not sure where to start? Ask JobBot — it answers in seconds.</span>
            <Link to="/chat" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Open chat <ArrowRight className="h-3 w-3" /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}

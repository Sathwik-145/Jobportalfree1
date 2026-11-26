import { Link, NavLink, useNavigate, useLocation } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User, LogOut, BookmarkCheck, FileText, Menu, ShieldCheck, Lightbulb, Briefcase, Home,
  GraduationCap, ClipboardCheck, MessagesSquare, Award, BellRing, Code2, ChevronDown, LayoutGrid, Mail, Mic,
} from "lucide-react";
import defaultLogo from "@/assets/logo.png";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import ContactAdmin from "@/components/ContactAdmin";
import ThemeToggle from "@/components/ThemeToggle";
import { useBrandLogo } from "@/lib/themeSettings";
import { cn } from "@/lib/utils";
import { EVERYTHING, type NavItem } from "@/lib/navItems";
import EverythingMenu from "@/components/EverythingMenu";

type Item = NavItem;

const PRIMARY: Item[] = [
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/assessments", label: "Assessments", icon: ClipboardCheck },
  { to: "/interview-prep", label: "Interview prep", icon: GraduationCap },
  { to: "/resume-templates", label: "Resumes", icon: FileText },
];

function EverythingGrid({ onPick }: { onPick?: () => void }) {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {EVERYTHING.map((g) => (
        <div key={g.group}>
          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{g.group}</p>
          <ul className="space-y-0.5">
            {g.items.map((it) => (
              <li key={it.to}>
                <Link
                  to={it.to}
                  onClick={onPick}
                  className="group flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-muted"
                >
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                    <it.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">{it.label}{it.badge && <span className="mega-badge">{it.badge}</span>}</span>
                    {it.desc && <span className="block text-xs text-muted-foreground">{it.desc}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function MobileDock() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const items: Item[] = [
    { to: "/", label: "Home", icon: Home },
    { to: "/jobs", label: "Jobs", icon: Briefcase },
    { to: "/assessments", label: "Practice", icon: ClipboardCheck },
    { to: "/exam-login", label: "Exams", icon: Code2 },
    { to: user ? "/profile" : "/login", label: user ? "Me" : "Sign in", icon: User },
  ];
  return (
    <nav className="mobile-dock" aria-label="Quick navigation">
      {items.map((it) => {
        const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
        return (
          <Link key={it.label} to={it.to} aria-current={active ? "page" : undefined}>
            <it.icon className="h-5 w-5" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

const Navbar = () => {
  const { user, isAdmin, isSubadmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const onAdmin = location.pathname.startsWith("/admin");
  const [open, setOpen] = useState(false);
  const logo = useBrandLogo(defaultLogo);
  const isAdminUser = isAdmin || isSubadmin;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 glass border-b">
        <div className="container relative flex h-16 items-center gap-3">
          <Link to="/" className="group mr-2 flex shrink-0 items-center gap-2.5">
            <span className="logo-ring h-10 w-10 transition-transform group-hover:rotate-6">
              <img src={logo} alt="JobPortalFree" className="h-full w-full rounded-full bg-card object-cover" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-[1.05rem] font-extrabold tracking-tight text-foreground">
                JobPortal<span className="text-accent">Free</span>
              </span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:block">
                Jobs · Prep · CodeXam
              </span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
            {PRIMARY.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) =>
                  cn(
                    "nav-pill rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                {it.label}
              </NavLink>
            ))}
            <EverythingMenu />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
            {isAdminUser && (
              <Link
                to="/admin"
                className={cn(
                  "hidden items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold md:inline-flex",
                  onAdmin ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]",
                )}
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
            <ThemeToggle />
            {user && <ContactAdmin />}
            {user && <NotificationBell />}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-sm font-bold uppercase text-primary">
                      {(user.email || "U").charAt(0)}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuLabel className="truncate text-xs font-medium text-muted-foreground">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/my-applications")}><BookmarkCheck className="mr-2 h-4 w-4" /> My applications</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/resume-builder")}><FileText className="mr-2 h-4 w-4" /> Resume builder</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/saved-jobs")}><FileText className="mr-2 h-4 w-4" /> Saved jobs</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/job-alerts")}><BellRing className="mr-2 h-4 w-4" /> Job alerts</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin/concepts")}>
                    <Lightbulb className="mr-2 h-4 w-4" /> {isAdminUser ? "Manage important concepts" : "Important concepts"}
                  </DropdownMenuItem>
                  {isAdminUser && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin")}><ShieldCheck className="mr-2 h-4 w-4" /> Admin command center</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/exam-admin")}><Code2 className="mr-2 h-4 w-4" /> CodeXam admin</DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden items-center gap-1.5 sm:flex">
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Sign in</Button>
                <Button variant="hero" size="sm" onClick={() => navigate("/register")}>Join free</Button>
              </div>
            )}

            {/* Full menu (phones, tablets, and anyone who wants the grouped view) */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto">
                <SheetTitle className="font-display text-lg">Everything in one place</SheetTitle>
                <SheetDescription className="text-xs">Jobs, preparation and exams.</SheetDescription>
                <div className="mt-5 space-y-6">
                  {isAdminUser && (
                    <div className="grid grid-cols-2 gap-2">
                      <Link to="/admin" onClick={() => setOpen(false)} className="btn-pill btn-pill-primary h-10 text-xs"><ShieldCheck className="h-4 w-4" /> Admin</Link>
                      <Link to="/exam-admin" onClick={() => setOpen(false)} className="btn-pill btn-pill-ghost h-10 text-xs"><Code2 className="h-4 w-4" /> CodeXam</Link>
                    </div>
                  )}
                  <EverythingGrid onPick={() => setOpen(false)} />
                  {user ? (
                    <button
                      onClick={() => { handleSignOut(); setOpen(false); }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 py-2.5 text-sm font-semibold text-destructive"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => { navigate("/login"); setOpen(false); }}>Sign in</Button>
                      <Button onClick={() => { navigate("/register"); setOpen(false); }}>Join free</Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
      {!onAdmin && <MobileDock />}
    </>
  );
};

export default Navbar;

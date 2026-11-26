import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Link, Outlet, useLocation } from '@/lib/router-compat';
import { supabase } from "@/lib/db-client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import HeadlineTicker from "@/components/HeadlineTicker";
import { useToast } from "@/hooks/use-toast";
import { Code2 } from "lucide-react";
import { Briefcase, Users, FileText, Settings, PlusCircle, BarChart3, UserPlus, Megaphone, Send, Loader2, Newspaper, Monitor, MessageCircle, TrendingUp, Upload, Kanban, LayoutDashboard, Palette, ClipboardList, Award, Brain, GraduationCap, Mail, PartyPopper, MailCheck, KeyRound, Globe, DatabaseBackup, Video } from "lucide-react";
import { getLastBackup, formatBackupDate } from "@/pages/admin/BackupData";
import { cn } from "@/lib/utils";
import { checkAdminSession } from "@/lib/adminSessions";
import { SlidersHorizontal, BellRing } from "lucide-react";
import { AdminApprovalGate } from "@/components/AdminApproval";

const AdminDashboard = () => {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem('job-admin-nav') || '{}');
      nav.scrollTop = saved.top || 0;
      nav.scrollLeft = saved.left || 0;
    } catch {}
    const save = () => {
      try { sessionStorage.setItem('job-admin-nav', JSON.stringify({ top: nav.scrollTop, left: nav.scrollLeft })); } catch {}
    };
    nav.addEventListener('scroll', save, { passive: true });
    nav.addEventListener('click', save, true);
    return () => { nav.removeEventListener('scroll', save); nav.removeEventListener('click', save, true); };
  }, [location.pathname]);

  const { isAdmin, isSubadmin, subadminPerms } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({ jobs: 0, applications: 0, users: 0 });
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  useEffect(() => { getLastBackup().then(setLastBackup); }, []);

  const handleAnnouncement = async () => {
    if (!annTitle.trim()) {
      toast({ title: "Enter a title", variant: "destructive" });
      return;
    }
    setSending(true);
    // Get all user IDs
    const { data: profiles } = await supabase.from("profiles").select("user_id");
    if (profiles && profiles.length > 0) {
      const rows = profiles.map((p) => ({
        user_id: p.user_id,
        title: annTitle.trim(),
        message: annMessage.trim() || null,
      }));
      const { error } = await supabase.from("notifications").insert(rows);
      if (error) {
        toast({ title: "Failed to send", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Announcement sent!", description: `Sent to ${profiles.length} users` });
        setAnnTitle("");
        setAnnMessage("");
      }
    }
    setSending(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Logged out remotely from "Admin Controls" → sign this device out too.
  useEffect(() => {
    const tick = async () => { if (!(await checkAdminSession())) { await supabase.auth.signOut(); window.location.href = "/login"; } };
    tick(); const t = setInterval(tick, 60000); return () => clearInterval(t);
  }, []);

  const fetchStats = async () => {
    const [jobsRes, appsRes, usersRes] = await Promise.all([
      supabase.from("jobs").select("id", { count: "exact", head: true }),
      supabase.from("applications").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    setStats({
      jobs: jobsRes.count || 0,
      applications: appsRes.count || 0,
      users: usersRes.count || 0,
    });
  };

  const allNavItems = [
    { group: "Home", to: "/admin", label: "Overview", icon: BarChart3, exact: true, perm: null },
    { group: "Jobs", to: "/admin/find-jobs", label: "Find Recent Jobs", icon: Globe, perm: "can_manage_jobs" },
    { group: "Jobs", to: "/admin/post-job", label: "Post Job", icon: PlusCircle, perm: "can_manage_jobs" },
    { group: "Jobs", to: "/admin/bulk-import", label: "Bulk Import", icon: Upload, perm: "can_manage_jobs" },
    { group: "Jobs", to: "/admin/manage-jobs", label: "Manage Jobs", icon: Briefcase, perm: "can_manage_jobs" },
    { group: "Candidates", to: "/admin/applications", label: "Applications", icon: FileText, perm: "can_view_applications" },
    { group: "Candidates", to: "/admin/tracking", label: "Tracking", icon: Kanban, perm: "can_view_applications" },
    { group: "Candidates", to: "/admin/users", label: "Users", icon: Users, perm: "can_view_users", adminOnly: true },
    { group: "Candidates", to: "/admin/signups", label: "New Sign-ups", icon: MailCheck, perm: null, adminOnly: true },
    { group: "Candidates", to: "/admin/job-alerts", label: "Job Alerts", icon: BellRing, perm: null, adminOnly: true },
    { group: "Candidates", to: "/admin/analytics", label: "Analytics", icon: TrendingUp, perm: "can_view_analytics" },
    { group: "Messages & mail", to: "/admin/messages", label: "Messages", icon: MessageCircle, perm: "can_view_messages" },
    { group: "Messages & mail", to: "/admin/mail", label: "Send Mail", icon: Mail, perm: null, adminOnly: true },
    { group: "Messages & mail", to: "/admin/festival-mails", label: "Festival Mails", icon: Mail, perm: null, adminOnly: true },
    { group: "Website", to: "/admin/landing", label: "Landing Page", icon: LayoutDashboard, perm: null, adminOnly: true },
    { group: "Website", to: "/admin/theme", label: "Theme", icon: Palette, perm: null, adminOnly: true },
    { group: "Website", to: "/admin/festivals", label: "Festivals", icon: PartyPopper, perm: null, adminOnly: true },
    { group: "Website", to: "/admin/headlines", label: "Headlines", icon: Newspaper, perm: "can_manage_headlines" },
    { group: "Website", to: "/admin/promo-banners", label: "Banners", icon: Monitor, perm: "can_manage_banners" },
    { group: "Website", to: "/admin/templates", label: "Resume Templates", icon: Settings, perm: "can_manage_templates" },
    { group: "Learning", to: "/admin/assessments", label: "Assessments", icon: ClipboardList, perm: null, adminOnly: true },
    { group: "Learning", to: "/admin/concepts", label: "Important Concepts", icon: Brain, perm: null, adminOnly: true },
    { group: "Learning", to: "/interview-prep", label: "Edit Interview Prep", icon: GraduationCap, perm: null, adminOnly: true, external: true },
    { group: "Learning", to: "/certifications", label: "Edit Certifications", icon: Award, perm: null, adminOnly: true, external: true },
    { group: "CodeXam exams", to: "/exam-admin", label: "Open CodeXam admin", icon: Code2, perm: null, adminOnly: true, external: true },
    { group: "Security", to: "/admin/controls", label: "Admin Controls", icon: SlidersHorizontal, perm: null, adminOnly: true },
    { group: "Security", to: "/admin/security", label: "Admin Password", icon: KeyRound, perm: null, adminOnly: true },
    { group: "Security", to: "/admin/sub-admins", label: "Sub-Admins", icon: UserPlus, perm: null, adminOnly: true },
    { group: "Security", to: "/admin/backup", label: "Backup", icon: DatabaseBackup, perm: null, adminOnly: true },
  ];


  const navItems = allNavItems.filter(item => {
    if (isAdmin) return true;
    if (item.adminOnly) return false;
    if (!item.perm) return true;
    return subadminPerms ? (subadminPerms as any)[item.perm] : false;
  });

  const isOverview = location.pathname === "/admin";

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <HeadlineTicker />
      <div className="container max-w-7xl mx-auto py-4 px-4 md:py-8">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8 justify-center">
          {/* Sidebar - horizontal scroll on mobile, fixed-width card on desktop */}
          <aside className={cn("w-full shrink-0 md:sticky md:top-20 md:self-start transition-all", collapsed ? "md:w-16" : "md:w-60")}>
            <nav ref={navRef} className="admin-rail flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto md:max-h-[calc(100dvh-6rem)] overscroll-contain pb-2 md:p-3 -mx-1 px-1 md:mx-0">
              <button type="button" aria-label={collapsed ? "Expand menu" : "Collapse menu"} onClick={() => setCollapsed((c) => !c)} className="admin-rail-toggle hidden md:flex items-center justify-center h-8 rounded-lg">
                {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
              {navItems.map((item, i) => {
                const showGroup = !collapsed && (i === 0 || navItems[i - 1].group !== item.group);
                const active = (item as any).exact ? location.pathname === item.to : location.pathname.startsWith(item.to) && item.to !== "/admin";
                return (
                  <div key={item.to} className="contents">
                  {showGroup && <p className="admin-rail-group hidden md:block px-2.5 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.16em]">{item.group}</p>}
                  <Link to={item.to} title={item.label} aria-current={active ? "page" : undefined} className={cn("admin-rail-link", collapsed && "md:justify-center md:px-0")}>
                    <item.icon className="w-4 h-4 shrink-0" /> <span className={cn("truncate", collapsed && "md:hidden")}>{item.label}</span>
                    {(item as any).external && !collapsed && <span className="ml-auto hidden md:inline text-[9px] font-bold uppercase tracking-wider opacity-60">↗</span>}
                  </Link>
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0 max-w-5xl mx-auto w-full md:pl-2"><AdminApprovalGate>
            {isOverview ? (
              <div>
                <header className="surface-ink relative mb-6 overflow-hidden p-6 md:p-8"><div className="grid-dots absolute inset-0 opacity-30" aria-hidden="true" /><div className="relative eyebrow mb-4"><LayoutDashboard className="h-3.5 w-3.5" /> Admin workspace</div><h1 className="relative font-display text-2xl md:text-4xl font-extrabold tracking-tight">Your command center</h1><p className="relative mt-3 max-w-lg text-sm leading-relaxed muted-on-ink">Jobs, candidates, mail, the website and the CodeXam exam portal — every admin tool in one place.</p><div className="relative mt-5 flex flex-wrap gap-2"><Link to="/exam-admin" className="btn-pill btn-pill-accent h-9 text-xs"><Code2 className="h-3.5 w-3.5" /> Open CodeXam admin</Link><Link to="/admin/post-job" className="btn-pill h-9 border border-ink-foreground/20 text-xs text-ink-foreground hover:bg-ink-foreground/10"><PlusCircle className="h-3.5 w-3.5" /> Post a job</Link></div><Link to="/admin/backup" className="relative mt-4 inline-flex items-center gap-2 rounded-full border border-ink-foreground/15 bg-ink-foreground/5 px-3 py-1.5 text-xs font-medium text-ink-foreground hover:border-accent"><DatabaseBackup className="h-3.5 w-3.5 text-accent" /> Last backup: {formatBackupDate(lastBackup)}</Link></header>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                  <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
                    <CardContent className="p-5 md:p-6 text-left">
                      <Briefcase className="w-11 h-11 mb-4 rounded-2xl bg-primary/10 p-2.5 text-primary" />
                      <p className="font-display text-2xl md:text-3xl font-bold">{stats.jobs}</p>
                      <p className="text-sm text-muted-foreground">Total Jobs</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
                    <CardContent className="p-5 md:p-6 text-left">
                      <FileText className="w-11 h-11 mb-4 rounded-2xl bg-primary/10 p-2.5 text-primary" />
                      <p className="font-display text-2xl md:text-3xl font-bold">{stats.applications}</p>
                      <p className="text-sm text-muted-foreground">Applications</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
                    <CardContent className="p-5 md:p-6 text-left">
                      <Users className="w-11 h-11 mb-4 rounded-2xl bg-primary/10 p-2.5 text-primary" />
                      <p className="font-display text-2xl md:text-3xl font-bold">{stats.users}</p>
                      <p className="text-sm text-muted-foreground">Registered Users</p>
                    </CardContent>
                  </Card>
                </div>
                {/* Announcement Section */}
                <Card className="mb-6 rounded-2xl border-border/60 shadow-sm">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Megaphone className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-sm md:text-base">Send Announcement to All Users</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Title</Label>
                        <Input placeholder="Announcement title..." value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Message (optional)</Label>
                        <Textarea placeholder="Details..." value={annMessage} onChange={(e) => setAnnMessage(e.target.value)} rows={2} />
                      </div>
                      <Button onClick={handleAnnouncement} disabled={sending} size="sm" className="gap-1">
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {sending ? "Sending..." : "Send to All"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <Link to="/admin/find-jobs">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 md:p-6 flex items-center gap-4">
                        <Globe className="w-8 md:w-10 h-8 md:h-10 text-primary shrink-0" />
                        <div>
                          <h3 className="font-semibold text-sm md:text-base">Find Recent Jobs</h3>
                          <p className="text-xs md:text-sm text-muted-foreground">Pull 4–30 real postings from the last two weeks</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link to="/admin/backup">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 md:p-6 flex items-center gap-4">
                        <DatabaseBackup className="w-8 md:w-10 h-8 md:h-10 text-primary shrink-0" />
                        <div>
                          <h3 className="font-semibold text-sm md:text-base">Backup</h3>
                          <p className="text-xs md:text-sm text-muted-foreground">Last backup: {formatBackupDate(lastBackup)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link to="/admin/post-job">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 md:p-6 flex items-center gap-4">
                        <PlusCircle className="w-8 md:w-10 h-8 md:h-10 text-primary shrink-0" />
                        <div>
                          <h3 className="font-semibold text-sm md:text-base">Post a New Job</h3>
                          <p className="text-xs md:text-sm text-muted-foreground">Add a job listing with just a link</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link to="/admin/manage-jobs">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 md:p-6 flex items-center gap-4">
                        <Settings className="w-8 md:w-10 h-8 md:h-10 text-secondary shrink-0" />
                        <div>
                          <h3 className="font-semibold text-sm md:text-base">Manage Jobs</h3>
                          <p className="text-xs md:text-sm text-muted-foreground">Edit, activate, or remove postings</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </div>
            ) : (
              <Outlet />
            )}
</AdminApprovalGate>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

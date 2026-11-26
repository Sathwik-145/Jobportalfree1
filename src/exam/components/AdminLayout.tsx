// @ts-nocheck
import ExamBrandName from '@/components/ExamBrandName';
import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { useLocation, Link } from '@/lib/router-compat';
import {
  LayoutDashboard, FileCode2, Users, Terminal, ClipboardList, BarChart3, ListChecks, UserPlus, Activity, Trophy,
  MessageSquareWarning, MessageSquare, PieChart, Bell, Zap, ArrowLeft, Link2, Users2, Settings2, PanelLeftClose,
  PanelLeftOpen, Menu, X, ExternalLink, Copy, GraduationCap, LogIn, Search, ChevronDown, Video, PenLine, TextCursorInput,
} from 'lucide-react';
import { fetchKey } from '@/exam/lib/codexamSettings';
import { toast } from 'sonner';
import ThemeToggle from './ThemeToggle';

/** One list drives the sidebar, the phone menu and the page title. */
export const EXAM_ADMIN_NAV = [
  { group: 'Overview', items: [
    { label: 'Exam settings', path: '/exam-admin/settings', icon: Settings2 },
    { label: 'Dashboard', path: '/exam-admin', icon: LayoutDashboard },
  ] },
  { group: 'Build exams', items: [
    { label: 'Tests & schedules', path: '/exam-admin/tests', icon: ClipboardList },
    { label: 'Coding questions', path: '/exam-admin/questions', icon: FileCode2 },
    { label: 'MCQs', path: '/exam-admin/mcqs', icon: ListChecks },
    { label: 'Fill-in-blanks', path: '/exam-admin/fib', icon: TextCursorInput },
    { label: 'Writing', path: '/exam-admin/writing', icon: PenLine },
  ] },
  { group: 'Students', items: [
    { label: 'Students', path: '/exam-admin/students', icon: Users },
    { label: 'Registrations', path: '/exam-admin/registrations', icon: UserPlus },
    { label: 'Registration links', path: '/exam-admin/registration-links', icon: Link2 },
    { label: 'Link registrants', path: '/exam-admin/link-registrants', icon: Users2 },
    { label: 'Quick sign-ups', path: '/exam-admin/quick-registrations', icon: Zap },
  ] },
  { group: 'Monitor', items: [
    { label: 'Live proctoring', path: '/exam-admin/proctoring', icon: Activity },
    { label: 'Recordings', path: '/exam-admin/recordings', icon: Video },
    { label: 'Notifications', path: '/exam-admin/notifications', icon: Bell, badge: 'extensions' },
  ] },
  { group: 'Results', items: [
    { label: 'Reports', path: '/exam-admin/reports', icon: BarChart3 },
    { label: 'Analytics', path: '/exam-admin/analytics', icon: PieChart },
    { label: 'Leaderboard', path: '/exam-admin/leaderboard', icon: Trophy },
    { label: 'Re-evaluations', path: '/exam-admin/reevaluations', icon: MessageSquareWarning },
    { label: 'Feedback', path: '/exam-admin/feedback', icon: MessageSquare },
  ] },
];

const studentPages = [
  { label: 'Student registration', path: '/exam-register', icon: UserPlus },
  { label: 'Quick sign-up', path: '/quick-start', icon: Zap },
  { label: 'Exam login', path: '/exam-login', icon: LogIn },
  { label: 'Student dashboard', path: '/exam-student', icon: GraduationCap },
];

const OPEN_KEY = 'cx_nav_groups_closed';
let scheduleChecked = false;

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Fallback trigger for scheduled credential mails (runs at most once per day server-side)
  useEffect(() => {
    if (scheduleChecked) return; scheduleChecked = true;
    const ping = () => fetch('/api/public/run-mail-schedule').catch(() => {});
    ping();
    setInterval(ping, 2 * 60 * 1000);
  }, []);
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    const load = () => fetchKey<any[]>('slot_extension_requests', []).then(rows => setPendingCount(Array.isArray(rows) ? rows.filter(r => r.status === 'pending').length : 0));
    load(); const timer = setInterval(load, 15000);
    window.addEventListener('extension-requests-changed', load);
    return () => { clearInterval(timer); window.removeEventListener('extension-requests-changed', load); };
  }, []);
  const { user } = useAuth();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    try { nav.scrollTop = JSON.parse(sessionStorage.getItem('codexam-admin-nav') || '{}').top || 0; } catch {}
    const save = () => { try { sessionStorage.setItem('codexam-admin-nav', JSON.stringify({ top: nav.scrollTop })); } catch {} };
    nav.addEventListener('scroll', save, { passive: true });
    return () => nav.removeEventListener('scroll', save);
  }, [location.pathname]);

  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('cx_sidebar_collapsed') === '1'; } catch { return false; } });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [closed, setClosed] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(OPEN_KEY) || '[]'); } catch { return []; } });
  const [showStudentPages, setShowStudentPages] = useState(false);
  useEffect(() => { try { localStorage.setItem('cx_sidebar_collapsed', collapsed ? '1' : '0'); } catch {} }, [collapsed]);
  useEffect(() => { try { localStorage.setItem(OPEN_KEY, JSON.stringify(closed)); } catch {} }, [closed]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (path: string) => path === '/exam-admin' ? location.pathname === path : location.pathname === path || location.pathname.startsWith(`${path}/`);
  const currentGroup = EXAM_ADMIN_NAV.find(g => g.items.some(i => isActive(i.path)));
  const current = currentGroup?.items.find(i => isActive(i.path));
  const q = query.trim().toLowerCase();
  const groups = useMemo(() => EXAM_ADMIN_NAV
    .map(g => ({ ...g, items: q ? g.items.filter(i => `${i.label} ${g.group}`.toLowerCase().includes(q)) : g.items }))
    .filter(g => g.items.length), [q]);
  const toggleGroup = (name: string) => setClosed(list => list.includes(name) ? list.filter(x => x !== name) : [...list, name]);
  const wide = !collapsed || mobileOpen;

  const copyLink = async (path: string, label: string) => {
    try { await navigator.clipboard.writeText(new URL(path, window.location.origin).href); toast.success(`${label} link copied`); }
    catch { toast.error('Could not copy link'); }
  };

  return (
    <div className="codexam-theme min-h-screen flex font-sans bg-background">
      {mobileOpen && <div className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />}
      <aside
        className={`codexam-sidebar cx-rail fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[17rem] shrink-0 flex-col transition-[transform,width] duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:sticky md:top-0 md:translate-x-0 ${collapsed ? 'md:w-[4.5rem]' : 'md:w-64'}`}
        data-collapsed={collapsed ? 'true' : 'false'}
      >
        {/* Brand */}
        <div className={`flex shrink-0 items-center gap-3 px-4 pb-3 pt-5 ${collapsed ? 'md:flex-col md:px-2' : ''}`}>
          <div className="cx-rail-mark"><Terminal className="h-4 w-4" /></div>
          <div className={`min-w-0 flex-1 ${collapsed ? 'md:hidden' : ''}`}>
            <p className="truncate font-display text-[15px] font-bold leading-tight text-sidebar-accent-foreground"><ExamBrandName /></p>
            <p className="text-[11px] font-medium text-sidebar-foreground/60">Exam admin</p>
          </div>
          <button aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(c => !c)} className="cx-rail-icon hidden md:inline-grid">
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="cx-rail-icon inline-grid md:hidden"><X className="h-4 w-4" /></button>
        </div>

        {/* Search */}
        {wide && (
          <div className={`shrink-0 px-3 pb-2 ${collapsed ? 'md:hidden' : ''}`}>
            <label className="cx-rail-search">
              <Search className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a page…" aria-label="Find an admin page" />
              {query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X className="h-3.5 w-3.5" /></button>}
            </label>
          </div>
        )}

        {/* Navigation */}
        <nav ref={navRef} aria-label="Exam admin" className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 pb-3">
          {groups.map(g => {
            const open = !!q || !closed.includes(g.group) || g.group === currentGroup?.group;
            const single = g.items.length === 1;
            return (
              <div key={g.group} className="pt-1">
                {!single && (
                  <button type="button" onClick={() => toggleGroup(g.group)} aria-expanded={open} className={`cx-rail-group ${collapsed ? 'md:hidden' : ''}`}>
                    <span>{g.group}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? '' : '-rotate-90'}`} />
                  </button>
                )}
                {(open || single || collapsed) && (
                  <div className="space-y-0.5">
                    {g.items.map(item => {
                      const active = isActive(item.path);
                      const badge = item.badge === 'extensions' && pendingCount > 0 ? pendingCount : 0;
                      return (
                        <Link key={item.path} to={item.path} aria-current={active ? 'page' : undefined}
                          title={item.label + (badge ? ` (${badge} pending extension requests)` : '')}
                          className={`cx-rail-link ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className={`flex-1 truncate ${collapsed ? 'md:hidden' : ''}`}>{item.label}</span>
                          {badge > 0 && <span aria-label={`${badge} pending extension requests`} className="cx-rail-badge">{badge}</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {!groups.length && <p className="px-3 py-6 text-center text-xs text-sidebar-foreground/60">No page matches “{query}”.</p>}

          {/* Student-facing pages */}
          <div className={`mt-3 border-t border-sidebar-border pt-3 ${collapsed ? 'md:hidden' : ''}`}>
            <button type="button" onClick={() => setShowStudentPages(v => !v)} aria-expanded={showStudentPages} className="cx-rail-group">
              <span>Student pages</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showStudentPages ? '' : '-rotate-90'}`} />
            </button>
            {showStudentPages && <div className="space-y-0.5">
              {studentPages.map(item => (
                <div key={item.path} className="flex items-center gap-1">
                  <a href={item.path} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.label} in a new tab`} className="cx-rail-link flex-1 text-[13px]">
                    <item.icon className="h-3.5 w-3.5 shrink-0" /><span className="flex-1 truncate">{item.label}</span><ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                  </a>
                  <button type="button" aria-label={`Copy ${item.label} link`} title="Copy link" className="cx-rail-icon inline-grid" onClick={() => copyLink(item.path, item.label)}><Copy className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>}
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 space-y-2 border-t border-sidebar-border p-3">
          <Link to="/admin" className={`cx-rail-back ${collapsed ? 'md:justify-center md:px-0' : ''}`} title="Back to the Job Portal admin">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className={collapsed ? 'md:hidden' : ''}>Job Portal admin</span>
          </Link>
          <div className={`flex items-center gap-2 px-1 ${collapsed ? 'md:flex-col' : ''}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold uppercase text-sidebar-accent-foreground">{(user?.email || 'A').charAt(0)}</div>
            <p className={`min-w-0 flex-1 truncate text-xs text-sidebar-foreground/80 ${collapsed ? 'md:hidden' : ''}`}>{user?.email}</p>
            <ThemeToggle className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        {/* Phone top bar */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur md:hidden">
          <button aria-label="Open menu" onClick={() => setMobileOpen(true)} className="-ml-2 rounded-lg p-2 hover:bg-muted"><Menu className="h-5 w-5" /></button>
          <div className="min-w-0">
            {currentGroup && <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{currentGroup.group}</p>}
            <p className="truncate text-sm font-semibold leading-tight">{current?.label || <><ExamBrandName /> Admin</>}</p>
          </div>
        </div>
        {/* Desktop breadcrumb */}
        {current && <div className="hidden items-center gap-2 px-8 pt-6 text-xs text-muted-foreground md:flex">
          <Terminal className="h-3.5 w-3.5" /><ExamBrandName /><span>/</span><span>{currentGroup.group}</span><span>/</span><span className="font-semibold text-foreground">{current.label}</span>
        </div>}
        {children}
      </main>
    </div>
  );
}

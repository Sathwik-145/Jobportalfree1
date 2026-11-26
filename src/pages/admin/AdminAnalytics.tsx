import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import SiteLoader from "@/components/SiteLoader";

const COLORS = ["hsl(220,70%,45%)", "hsl(174,60%,40%)", "hsl(38,92%,55%)", "hsl(0,84%,60%)", "hsl(152,60%,40%)"];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [appsByStatus, setAppsByStatus] = useState<{ name: string; value: number }[]>([]);
  const [appsByDay, setAppsByDay] = useState<{ date: string; count: number }[]>([]);
  const [topJobs, setTopJobs] = useState<{ name: string; apps: number }[]>([]);
  const [usersByMonth, setUsersByMonth] = useState<{ month: string; count: number }[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [appsRes, jobsRes, usersRes] = await Promise.all([
      supabase.from("applications").select("id, status, created_at, job_id"),
      supabase.from("jobs").select("id, title"),
      supabase.from("profiles").select("id, created_at"),
    ]);

    const apps = appsRes.data || [];
    const jobs = jobsRes.data || [];
    const users = usersRes.data || [];

    // Apps by status
    const statusMap: Record<string, number> = {};
    apps.forEach((a) => { statusMap[a.status] = (statusMap[a.status] || 0) + 1; });
    setAppsByStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

    // Apps by day (last 14 days)
    const dayMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dayMap[d.toISOString().slice(5, 10)] = 0;
    }
    apps.forEach((a) => {
      const key = a.created_at.slice(5, 10);
      if (key in dayMap) dayMap[key]++;
    });
    setAppsByDay(Object.entries(dayMap).map(([date, count]) => ({ date, count })));

    // Top jobs
    const jobCountMap: Record<string, number> = {};
    apps.forEach((a) => { jobCountMap[a.job_id] = (jobCountMap[a.job_id] || 0) + 1; });
    const topEntries = Object.entries(jobCountMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const jobLookup = Object.fromEntries(jobs.map((j) => [j.id, j.title || "Untitled"]));
    setTopJobs(topEntries.map(([id, apps]) => ({ name: jobLookup[id] || id.slice(0, 8), apps })));

    // Users by month
    const monthMap: Record<string, number> = {};
    users.forEach((u) => {
      const m = u.created_at.slice(0, 7);
      monthMap[m] = (monthMap[m] || 0) + 1;
    });
    setUsersByMonth(
      Object.entries(monthMap).sort().slice(-6).map(([month, count]) => ({ month: month.slice(5), count }))
    );

    setLoading(false);
  };

  if (loading) return <SiteLoader fullscreen={false} text="Loading analytics..." />;

  return (
    <div>
      <header className="mb-6 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-accent/30 p-6"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Hiring workspace</p><h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Analytics</h1><p className="mt-2 text-sm text-muted-foreground">A clear view of hiring activity and community growth.</p></header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Applications over time */}
        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <h3 className="font-semibold text-base mb-5 tracking-tight">Applications (Last 14 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={appsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,88%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(220,70%,45%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <h3 className="font-semibold text-base mb-5 tracking-tight">Application Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={appsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                  {appsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top jobs */}
        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <h3 className="font-semibold text-base mb-5 tracking-tight">Top Jobs by Applications</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topJobs} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Bar dataKey="apps" fill="hsl(174,60%,40%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User growth */}
        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <h3 className="font-semibold text-base mb-5 tracking-tight">User Growth (Monthly)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={usersByMonth}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(38,92%,55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;

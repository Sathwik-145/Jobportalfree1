import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Briefcase, BookmarkCheck, Heart, TrendingUp } from "lucide-react";

const UserDashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ applied: 0, saved: 0, shortlisted: 0, reviewed: 0 });
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchStats();
    const onChange = () => fetchStats();
    const onFocus = () => fetchStats();
    window.addEventListener("user-applications-changed", onChange);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("user-applications-changed", onChange);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (profile) {
      const fields = ["full_name", "phone", "college", "degree", "graduation_year", "skills", "bio", "location", "linkedin_url", "resume_url"];
      const filled = fields.filter(f => (profile as any)[f]).length;
      setCompletion(Math.round((filled / fields.length) * 100));
    }
  }, [profile]);

  const fetchStats = async () => {
    if (!user) return;
    const [appsRes, savedRes] = await Promise.all([
      supabase.from("applications").select("status").eq("user_id", user.id),
      supabase.from("saved_jobs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    const apps = appsRes.data || [];
    setStats({
      applied: apps.length,
      saved: savedRes.count || 0,
      shortlisted: apps.filter(a => a.status === "shortlisted").length,
      reviewed: apps.filter(a => a.status === "reviewed").length,
    });
  };

  return (
    <div className="space-y-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Profile Completion</p>
            <span className="text-sm font-bold text-primary">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2" />
          {completion < 100 && (
            <p className="text-xs text-muted-foreground mt-1">Complete your profile to stand out to recruiters!</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Briefcase className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{stats.applied}</p>
            <p className="text-xs text-muted-foreground">Applied</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Heart className="w-5 h-5 mx-auto mb-1 text-destructive" />
            <p className="text-xl font-bold">{stats.saved}</p>
            <p className="text-xs text-muted-foreground">Saved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <BookmarkCheck className="w-5 h-5 mx-auto mb-1 text-secondary" />
            <p className="text-xl font-bold">{stats.shortlisted}</p>
            <p className="text-xs text-muted-foreground">Shortlisted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-accent-foreground" />
            <p className="text-xl font-bold">{stats.reviewed}</p>
            <p className="text-xs text-muted-foreground">Reviewed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;

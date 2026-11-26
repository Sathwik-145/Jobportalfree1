import { startAdminSession } from "@/lib/adminSessions";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { Link, useNavigate } from '@/lib/router-compat';
import { supabase } from "@/lib/db-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Home, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";
import { notifyAdmin } from '@/lib/notifyAdmin';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    // Decide where to land: admins/subadmins go straight to the admin panel.
    let target = "/";
    const uid = data.user?.id;
    if (uid) {
      const { data: prof } = await supabase.from("profiles").select("email_verified").eq("user_id", uid).maybeSingle();
      if (prof && prof.email_verified === false) {
        await supabase.auth.signOut();
        await fetch("/api/public/send-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => {});
        toast({ title: "Email not verified", description: "We sent you a new verification link. Please check your inbox.", variant: "destructive" });
        setLoading(false);
        return;
      }
    }
    if (uid) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      const r = (roles || []).map((x) => x.role);
      if (r.includes("admin") || r.includes("subadmin")) { target = "/admin"; await startAdminSession(uid, data.user?.email || email).catch(() => {}); }
    }
    notifyAdmin('user_login');
    navigate(target);
    setLoading(false);
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to apply, track applications and get job alerts.">
        <div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-9 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/forgot-password" className="text-primary hover:underline font-medium">Forgot Password?</Link>
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">Sign Up</Link>
          </div>
          <Link to="/exam-login" className="mt-6 flex items-center justify-between rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm hover:border-primary">
            <span><span className="block font-semibold text-foreground">Taking a CodeXam exam?</span><span className="text-xs text-muted-foreground">Use the separate exam login with your exam ID.</span></span>
            <span className="font-semibold text-primary">Exam login →</span>
          </Link>
        </div>
      </AuthShell>
  );
};

export default Login;

import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { Link, useNavigate } from '@/lib/router-compat';
import { supabase } from "@/lib/db-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Phone, GraduationCap, Home, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";
import { notifyAdmin } from '@/lib/notifyAdmin';

const Register = () => {
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "", college: "", degree: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName, phone: form.phone, college: form.college, degree: form.degree }, emailRedirectTo: `${window.location.origin}/login` },
    });
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else if (data.user) {
      notifyAdmin('user_registered');
      const { data: prof } = await supabase.from("profiles").select("email_verified").eq("user_id", data.user.id).maybeSingle();
      if (prof && prof.email_verified === false) {
        await fetch("/api/public/send-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.email }) }).catch(() => {});
        await supabase.auth.signOut();
        toast({ title: "Verify your email", description: "We sent a verification link to your email. Click it, then log in." });
        navigate("/login");
        setLoading(false);
        return;
      }
      // Update profile with extra info
      await supabase.from("profiles").update({
        phone: form.phone || null,
        college: form.college || null,
        degree: form.degree || null,
        full_name: form.fullName,
      }).eq("user_id", data.user.id);
      toast({ title: "Welcome!", description: "Account created successfully" });
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <AuthShell title="Create your free account" subtitle="Takes a minute. No fees, ever.">
        <div>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="John Doe" className="pl-9" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="you@example.com" className="pl-9" value={form.email} onChange={(e) => update("email", e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input type={showPassword ? "text" : "password"} placeholder="Min 6 characters" className="pl-9 pr-10" value={form.password} onChange={(e) => update("password", e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="+1 234 567 890" className="pl-9" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>College</Label>
                <Input placeholder="MIT" value={form.college} onChange={(e) => update("college", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Degree</Label>
                <Input placeholder="B.Tech CS" value={form.degree} onChange={(e) => update("degree", e.target.value)} />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
          </div>
        </div>
      </AuthShell>
  );
};

export default Register;

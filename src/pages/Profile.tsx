import { useState, useEffect } from "react";
import { supabase } from "@/lib/db-client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import UserDashboard from "@/components/UserDashboard";
import { Save, Upload } from "lucide-react";

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", phone: "", college: "", degree: "",
    graduation_year: "", skills: "", bio: "", location: "",
    linkedin_url: "", github_url: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        college: profile.college || "",
        degree: profile.degree || "",
        graduation_year: profile.graduation_year?.toString() || "",
        skills: profile.skills?.join(", ") || "",
        bio: profile.bio || "",
        location: profile.location || "",
        linkedin_url: profile.linkedin_url || "",
        github_url: profile.github_url || "",
      });
    }
  }, [profile]);

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name || null,
      phone: form.phone || null,
      college: form.college || null,
      degree: form.degree || null,
      graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
      skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : null,
      bio: form.bio || null,
      location: form.location || null,
      linkedin_url: form.linkedin_url || null,
      github_url: form.github_url || null,
    }).eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Profile updated successfully" });
      await refreshProfile();
    }
    setSaving(false);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
    } else {
      const { data: urlData } = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      await supabase.from("profiles").update({ resume_url: urlData?.signedUrl || null }).eq("user_id", user.id);
      toast({ title: "Resume uploaded!", description: "Your resume has been saved." });
      await refreshProfile();
    }
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container py-6 px-4 md:py-8 max-w-2xl">
        <header className="relative mb-7 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/15 via-card to-accent/40 p-6 sm:p-8"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Career workspace</p><h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Your career, in focus</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">Keep your story up to date and make your next application stand out.</p></header>

        <UserDashboard />

        <Card className="mb-6 rounded-2xl border-border/60 shadow-sm">
          <CardHeader><CardTitle>Resume</CardTitle></CardHeader>
          <CardContent>
            {profile?.resume_url && (
              <p className="text-sm text-muted-foreground mb-3">
                Current: <a href={profile.resume_url} target="_blank" className="text-primary underline">View Resume</a>
              </p>
            )}
            <Label htmlFor="resume" className="cursor-pointer">
              <div className="border-2 border-dashed border-primary/25 bg-primary/5 rounded-2xl p-8 text-center hover:border-primary hover:bg-primary/10 transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to upload resume (PDF, DOC)"}</p>
              </div>
            </Label>
            <input id="resume" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>College</Label>
                <Input value={form.college} onChange={(e) => update("college", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Degree</Label>
                <Input value={form.degree} onChange={(e) => update("degree", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Graduation Year</Label>
                <Input type="number" value={form.graduation_year} onChange={(e) => update("graduation_year", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => update("location", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Skills (comma separated)</Label>
              <Input placeholder="React, Python, SQL..." value={form.skills} onChange={(e) => update("skills", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input value={form.linkedin_url} onChange={(e) => update("linkedin_url", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>GitHub URL</Label>
                <Input value={form.github_url} onChange={(e) => update("github_url", e.target.value)} />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto gap-1">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

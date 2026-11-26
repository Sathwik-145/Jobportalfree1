import { useState } from "react";
import { supabase } from "@/lib/db-client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from '@/lib/router-compat';
import { Link2, Send, Loader2, Sparkles } from "lucide-react";
import MarkdownEditor from "@/components/MarkdownEditor";
import { alertsAllowed, jobMatchesPrefs, splitList } from "@/lib/jobAlerts";
import { sendJobAlertsFor } from "@/lib/jobAlertClient";

const PostJob = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [form, setForm] = useState({
    source_url: "", title: "", company: "", description: "",
    location: "", job_type: "", experience_level: "",
    salary_range: "", skills_required: "", deadline: "",
    scraped_content: "", scheduled_publish_at: "",
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleExtract = async () => {
    if (!form.source_url.trim()) {
      toast({ title: "Enter a URL first", variant: "destructive" });
      return;
    }
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-job", {
        body: { url: form.source_url },
      });
      if (error || !data?.success) {
        toast({ title: "Extraction failed", description: data?.error || error?.message || "Could not extract job details", variant: "destructive" });
      } else {
        const d = data.data;
        setForm((prev) => ({
          ...prev,
          title: d.title || prev.title,
          company: d.company || prev.company,
          description: d.description || prev.description,
          location: d.location || prev.location,
          job_type: d.job_type || prev.job_type,
          experience_level: d.experience_level || prev.experience_level,
          salary_range: d.salary_range || prev.salary_range,
          skills_required: d.skills_required?.length ? d.skills_required.join(", ") : prev.skills_required,
          deadline: d.deadline || prev.deadline,
          scraped_content: d.scraped_content || prev.scraped_content,
        }));
        toast({ title: "Extracted!", description: "Job details filled from the URL. Review and post." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setExtracting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: created, error } = await supabase.from("jobs").insert({
      source_url: form.source_url || null,
      title: form.title || null,
      company: form.company || null,
      description: form.description || null,
      location: form.location || null,
      job_type: form.job_type || null,
      experience_level: form.experience_level || null,
      salary_range: form.salary_range || null,
      skills_required: form.skills_required ? form.skills_required.split(",").map((s) => s.trim()).filter(Boolean) : null,
      deadline: form.deadline || null,
      scraped_content: form.scraped_content || null,
      posted_by: user?.id,
      is_active: !form.scheduled_publish_at,
      scheduled_publish_at: form.scheduled_publish_at || null,
    }).select("id").single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Notify users with matching job preferences
      if (!form.scheduled_publish_at) {
        const { data: prefs } = await supabase.from("job_preferences").select("*").eq("is_active", true);
        if (prefs) {
          const job = { title: form.title, location: form.location, job_type: form.job_type, skills_required: splitList(form.skills_required || "") };
          const matchedUsers = prefs.filter((p: any) => alertsAllowed(p) && jobMatchesPrefs(p, job));
          if (matchedUsers.length > 0) {
            const notifs = matchedUsers.map(u => ({
              user_id: u.user_id,
              title: `🔔 New job matching your preferences: ${form.title}`,
              message: `${form.company || ""} — ${form.location || ""}`,
            }));
            await supabase.from("notifications").insert(notifs);
          }
        }
        if (created?.id) {
          const mail = await sendJobAlertsFor([created.id]);
          if (mail.error) toast({ title: "Job posted, but alert emails failed", description: mail.error, variant: "destructive" });
          else if (mail.sent) toast({ title: `Job alert emailed to ${mail.sent} ${mail.sent === 1 ? "person" : "people"}` });
        }
      }
      toast({ title: form.scheduled_publish_at ? "Job Scheduled!" : "Job Posted!" });
      navigate("/admin/manage-jobs");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="font-display text-xl md:text-2xl font-bold mb-4 md:mb-6">Post a New Job</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Job Details</CardTitle>
          <p className="text-sm text-muted-foreground">Paste a job link and click Extract to auto-fill. You can also fill everything manually.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Link2 className="w-4 h-4" /> Job Source URL</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="https://careers.google.com/..."
                  value={form.source_url}
                  onChange={(e) => update("source_url", e.target.value)}
                  className="flex-1"
                />
                <Button type="button" onClick={handleExtract} disabled={extracting} variant="secondary" className="gap-1 shrink-0 w-full sm:w-auto">
                  {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {extracting ? "Extracting..." : "Extract"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input placeholder="Software Engineer" value={form.title} onChange={(e) => update("title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input placeholder="Google" value={form.company} onChange={(e) => update("company", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <MarkdownEditor value={form.description} onChange={(v) => update("description", v)} placeholder="Job description with formatting..." rows={8} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input placeholder="Remote / New York" value={form.location} onChange={(e) => update("location", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Salary Range</Label>
                <Input placeholder="$80K - $120K" value={form.salary_range} onChange={(e) => update("salary_range", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Type</Label>
                <Select value={form.job_type} onValueChange={(v) => update("job_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select value={form.experience_level} onValueChange={(v) => update("experience_level", v)}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Skills Required (comma separated)</Label>
              <Input placeholder="React, Node.js, SQL" value={form.skills_required} onChange={(e) => update("skills_required", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Application Deadline</Label>
                <Input type="date" value={form.deadline} onChange={(e) => update("deadline", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Schedule Publish Date (optional)</Label>
                <Input type="datetime-local" value={form.scheduled_publish_at} onChange={(e) => update("scheduled_publish_at", e.target.value)} />
                <p className="text-xs text-muted-foreground">Leave empty to publish immediately</p>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="gap-1 w-full sm:w-auto">
              <Send className="w-4 h-4" /> {loading ? "Posting..." : form.scheduled_publish_at ? "Schedule Job" : "Post Job"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostJob;

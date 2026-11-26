import { useEffect, useState } from "react";
import { useParams, useNavigate } from '@/lib/router-compat';
import { supabase } from "@/lib/db-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MarkdownEditor from "@/components/MarkdownEditor";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import SiteLoader from "@/components/SiteLoader";

const EditJob = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    source_url: "", title: "", company: "", description: "",
    location: "", job_type: "", experience_level: "",
    salary_range: "", skills_required: "", deadline: "",
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    const fetchJob = async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", id!).single();
      if (error || !data) {
        toast({ title: "Error", description: "Job not found", variant: "destructive" });
        navigate("/admin/manage-jobs");
        return;
      }
      setForm({
        source_url: data.source_url || "",
        title: data.title || "",
        company: data.company || "",
        description: data.description || "",
        location: data.location || "",
        job_type: data.job_type || "",
        experience_level: data.experience_level || "",
        salary_range: data.salary_range || "",
        skills_required: data.skills_required?.join(", ") || "",
        deadline: data.deadline ? data.deadline.split("T")[0] : "",
      });
      setFetching(false);
    };
    fetchJob();
  }, [id, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("jobs").update({
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
    }).eq("id", id!);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated!", description: "Job has been updated." });
      navigate("/admin/manage-jobs");
    }
    setLoading(false);
  };

  if (fetching) {
    return <SiteLoader fullscreen={false} text="Loading job..." />;
  }

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate("/admin/manage-jobs")} className="mb-4 gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to Jobs
      </Button>
      <h2 className="font-display text-xl md:text-2xl font-bold mb-4 md:mb-6">Edit Job</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Job Source URL</Label>
              <Input placeholder="https://..." value={form.source_url} onChange={(e) => update("source_url", e.target.value)} />
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
            <div className="space-y-2">
              <Label>Application Deadline</Label>
              <Input type="date" value={form.deadline} onChange={(e) => update("deadline", e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="gap-1 w-full sm:w-auto">
              <Save className="w-4 h-4" /> {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditJob;

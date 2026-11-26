import { useState, useEffect } from "react";
import { supabase } from "@/lib/db-client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Bell, Mail, Save, ShieldAlert } from "lucide-react";
import LogoSpinner from "@/components/LogoSpinner";
import { splitList } from "@/lib/jobAlerts";
import { confirmAlertsSaved } from "@/lib/jobAlertClient";

const Chips = ({ value }: { value: string }) => {
  const items = splitList(value);
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((l, i) => <Badge key={i} variant="secondary" className="text-xs">{l}</Badge>)}
    </div>
  );
};

const JobAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [paused, setPaused] = useState(false);
  const [locations, setLocations] = useState("");
  const [jobTypes, setJobTypes] = useState("");
  const [skills, setSkills] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (user) fetchPrefs();
  }, [user]);

  const fetchPrefs = async () => {
    if (!user) return;
    const { data } = await supabase.from("job_preferences").select("*").eq("user_id", user.id).maybeSingle();
    if (data) {
      setLocations((data.preferred_locations || []).join(", "));
      setJobTypes((data.preferred_job_types || []).join(", "));
      setSkills((data.preferred_skills || []).join(", "));
      setIsActive(data.is_active);
      setPaused((data as any).admin_paused === true);
    }
    setLoaded(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const prefs = {
      user_id: user.id,
      preferred_locations: splitList(locations),
      preferred_job_types: splitList(jobTypes),
      preferred_skills: splitList(skills),
      is_active: isActive,
    };
    const { data: existing } = await supabase.from("job_preferences").select("id").eq("user_id", user.id).maybeSingle();
    const { error } = existing
      ? await supabase.from("job_preferences").update(prefs).eq("user_id", user.id)
      : await supabase.from("job_preferences").insert(prefs);
    if (error) {
      toast({ title: "Could not save your alerts", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }
    if (!isActive) {
      toast({ title: "Alerts turned off", description: "We won't email you about new jobs." });
    } else if (paused) {
      toast({ title: "Preferences saved", description: "Alert emails for your account are paused by the admin." });
    } else {
      const mail = await confirmAlertsSaved();
      if (mail.sent === true) toast({ title: "Alerts saved — check your inbox", description: `We emailed a confirmation to ${user.email}.` });
      else if (mail.reason === "paused_by_admin") { setPaused(true); toast({ title: "Preferences saved", description: "Alert emails for your account are paused by the admin." }); }
      else toast({ title: "Preferences saved", description: mail.error ? `The confirmation email could not be sent: ${mail.error}` : "You'll be emailed when matching jobs are posted." });
    }
    setSaving(false);
  };

  if (!loaded) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center py-24">
        <LogoSpinner size="lg" text="Loading your alerts…" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container py-6 px-4 md:py-8 max-w-2xl">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" /> Job Alerts
        </h1>
        <p className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" /> Matching jobs are emailed to <span className="font-semibold text-foreground">{user?.email}</span>
        </p>

        {paused && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <p>Alert emails for your account are paused by the admin. Your preferences are still saved. <a href="/contact" className="font-semibold text-primary underline-offset-2 hover:underline">Contact us</a> if this is a mistake.</p>
          </div>
        )}

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Alert Preferences
              <div className="flex items-center gap-2">
                <Label htmlFor="alerts-active" className="text-sm font-normal">Email me</Label>
                <Switch id="alerts-active" checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alert-locations">Preferred Locations (comma separated)</Label>
              <Input id="alert-locations" placeholder="Remote, Bangalore, Hyderabad..." value={locations} onChange={(e) => setLocations(e.target.value)} />
              <Chips value={locations} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-types">Preferred Job Types (comma separated)</Label>
              <Input id="alert-types" placeholder="full-time, internship, remote..." value={jobTypes} onChange={(e) => setJobTypes(e.target.value)} />
              <Chips value={jobTypes} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-skills">Preferred Skills (comma separated)</Label>
              <Input id="alert-skills" placeholder="React, Python, SQL..." value={skills} onChange={(e) => setSkills(e.target.value)} />
              <Chips value={skills} />
            </div>
            <p className="text-xs text-muted-foreground">Leave everything empty to hear about every new job. A job matches when any one of your locations, job types or skills fits.</p>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto gap-1">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default JobAlerts;

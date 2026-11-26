import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Award, Mail, Pencil, Plus, Trash2, RotateCcw, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { loadOverride, saveOverride, clearOverride } from "@/lib/inlineEdit";
import { useToast } from "@/hooks/use-toast";

interface Cert {
  id: string;
  provider: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  url: string;
  free: boolean;
}

const DEFAULT_CERTS: Cert[] = [
  { id: "c1", provider: "Coursera", title: "Google Data Analytics Professional Certificate", level: "Beginner", category: "Data", url: "https://www.coursera.org/professional-certificates/google-data-analytics", free: true },
  { id: "c2", provider: "Coursera", title: "Meta Front-End Developer", level: "Beginner", category: "Web Dev", url: "https://www.coursera.org/professional-certificates/meta-front-end-developer", free: true },
  { id: "c3", provider: "Coursera", title: "IBM Full Stack Software Developer", level: "Intermediate", category: "Web Dev", url: "https://www.coursera.org/professional-certificates/ibm-full-stack-cloud-developer", free: true },
  { id: "c4", provider: "AWS", title: "AWS Certified Cloud Practitioner", level: "Beginner", category: "Cloud", url: "https://aws.amazon.com/certification/certified-cloud-practitioner/", free: false },
  { id: "c5", provider: "AWS", title: "AWS Solutions Architect Associate", level: "Intermediate", category: "Cloud", url: "https://aws.amazon.com/certification/certified-solutions-architect-associate/", free: false },
  { id: "c6", provider: "Google Cloud", title: "Associate Cloud Engineer", level: "Intermediate", category: "Cloud", url: "https://cloud.google.com/learn/certification/cloud-engineer", free: false },
  { id: "c7", provider: "Microsoft", title: "Azure Fundamentals (AZ-900)", level: "Beginner", category: "Cloud", url: "https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/", free: false },
  { id: "c8", provider: "NPTEL", title: "Programming, Data Structures & Algorithms in Python", level: "Beginner", category: "CS Fundamentals", url: "https://nptel.ac.in/courses/106106182", free: true },
  { id: "c9", provider: "NPTEL", title: "Machine Learning by IIT Madras", level: "Intermediate", category: "AI/ML", url: "https://nptel.ac.in/courses/106106139", free: true },
  { id: "c10", provider: "Udemy", title: "The Complete 2024 Web Development Bootcamp", level: "Beginner", category: "Web Dev", url: "https://www.udemy.com/course/the-complete-web-development-bootcamp/", free: false },
  { id: "c11", provider: "Udemy", title: "Python for Data Science and Machine Learning", level: "Intermediate", category: "AI/ML", url: "https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/", free: false },
  { id: "c12", provider: "freeCodeCamp", title: "Responsive Web Design", level: "Beginner", category: "Web Dev", url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/", free: true },
  { id: "c13", provider: "freeCodeCamp", title: "JavaScript Algorithms and Data Structures", level: "Intermediate", category: "CS Fundamentals", url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", free: true },
  { id: "c14", provider: "DeepLearning.AI", title: "Machine Learning Specialization", level: "Intermediate", category: "AI/ML", url: "https://www.coursera.org/specializations/machine-learning-introduction", free: true },
  { id: "c15", provider: "Google", title: "Google Cybersecurity Professional Certificate", level: "Beginner", category: "Cybersecurity", url: "https://www.coursera.org/professional-certificates/google-cybersecurity", free: true },
  { id: "c16", provider: "HubSpot", title: "Inbound Marketing Certification", level: "Beginner", category: "Marketing", url: "https://academy.hubspot.com/courses/inbound-marketing", free: true },
];

const providerColors: Record<string, string> = {
  Coursera: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  AWS: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  "Google Cloud": "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  Microsoft: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  NPTEL: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
  Udemy: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  freeCodeCamp: "bg-green-500/10 text-green-600 border-green-500/30",
  "DeepLearning.AI": "bg-pink-500/10 text-pink-600 border-pink-500/30",
  Google: "bg-red-500/10 text-red-600 border-red-500/30",
  HubSpot: "bg-amber-500/10 text-amber-700 border-amber-500/30",
};

const OVERRIDE_KEY = "certifications_v1";

const emptyCert = (): Cert => ({
  id: crypto.randomUUID(),
  provider: "Coursera",
  title: "",
  level: "Beginner",
  category: "Web Dev",
  url: "",
  free: true,
});

const Certifications = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [certs, setCerts] = useState<Cert[]>(DEFAULT_CERTS);
  const [editing, setEditing] = useState<Cert | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    setCerts(loadOverride<Cert[]>(OVERRIDE_KEY, DEFAULT_CERTS));
  }, []);

  const persist = (next: Cert[]) => {
    setCerts(next);
    saveOverride(OVERRIDE_KEY, next);
  };

  const startEdit = (c: Cert) => { setEditing({ ...c }); setIsNew(false); };
  const startCreate = () => { setEditing(emptyCert()); setIsNew(true); };

  const saveEdit = () => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.url.trim()) {
      toast({ title: "Title and URL required", variant: "destructive" });
      return;
    }
    const next = isNew
      ? [editing, ...certs]
      : certs.map((c) => (c.id === editing.id ? editing : c));
    persist(next);
    toast({ title: isNew ? "Certification added" : "Certification updated" });
    setEditing(null);
  };

  const remove = (id: string) => {
    if (!confirm("Delete this certification?")) return;
    persist(certs.filter((c) => c.id !== id));
    toast({ title: "Removed" });
  };

  const resetAll = () => {
    if (!confirm("Reset all certifications to defaults?")) return;
    clearOverride(OVERRIDE_KEY);
    setCerts(DEFAULT_CERTS);
    toast({ title: "Reset to defaults" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl mx-auto py-10 px-4">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3 gap-1"><Award className="w-3.5 h-3.5" /> Career boosters</Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Top Certifications & Courses</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Hand-picked, industry-recognized programs from Coursera, NPTEL, AWS, Google Cloud, Microsoft, Udemy, freeCodeCamp and more.
            Click any card to start learning.
          </p>
        </div>

        {isAdmin && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-medium">Admin edit mode</span>
              <span className="text-muted-foreground hidden sm:inline">— hover any card to edit or delete</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={resetAll} className="gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
              <Button size="sm" onClick={startCreate} className="gap-1">
                <Plus className="w-3.5 h-3.5" /> Add certification
              </Button>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certs.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 6) * 0.08 }}
              className="relative group"
            >
              {isAdmin && (
                <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => startEdit(c)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => remove(c.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
              <a href={c.url} target="_blank" rel="noopener noreferrer">
                <Card className="hover-lift h-full border-border/60 hover:border-primary/40 cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`border ${providerColors[c.provider] || "bg-muted"}`}>{c.provider}</Badge>
                      {c.free && <Badge variant="outline" className="text-success border-success/40">Free</Badge>}
                    </div>
                    <h3 className="font-display font-semibold leading-snug mb-2">{c.title}</h3>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 rounded-full bg-muted">{c.category}</span>
                      <span className="px-2 py-0.5 rounded-full bg-muted">{c.level}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                      Start learning <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            </motion.div>
          ))}
        </div>

        <Card className="mt-10 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-display text-lg font-bold">Have a question or a course suggestion?</p>
                <p className="text-sm text-muted-foreground">Mail us — we reply within 24 hours.</p>
              </div>
            </div>
            <a href="mailto:support@jobportalfree.app">
              <Button className="gap-2"><Mail className="w-4 h-4" /> support@jobportalfree.app</Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Inline edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNew ? "Add certification" : "Edit certification"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Provider</Label>
                  <Input value={editing.provider} onChange={(e) => setEditing({ ...editing, provider: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Category</Label>
                  <Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Textarea rows={2} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">URL</Label>
                <Input value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} placeholder="https://…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Level</Label>
                  <Select value={editing.level} onValueChange={(v) => setEditing({ ...editing, level: v as Cert["level"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Free?</Label>
                  <Select value={editing.free ? "yes" : "no"} onValueChange={(v) => setEditing({ ...editing, free: v === "yes" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Free</SelectItem>
                      <SelectItem value="no">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Certifications;

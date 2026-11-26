import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/lib/router-compat";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/db-client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Download, Plus, Trash2, FileText, Lightbulb, RotateCcw } from "lucide-react";
import {
  buildDocument, completeness, emptyEducation, emptyExperience, emptyProject, emptyResume, normalizeResume,
  type ResumeData,
} from "@/lib/resumeModel";
import { TEMPLATES, templateById, type TemplateId } from "@/lib/resumeTemplates";
import { downloadResumePdf } from "@/lib/resumePdf";

const LOCAL_KEY = "resume-builder-v1";

const readLocal = (): { data: ResumeData; template: TemplateId } | null => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return { data: normalizeResume(p.data), template: templateById(p.template).id };
  } catch { return null; }
};

const Field = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}><Label className="text-xs">{label}</Label>{children}</div>
);

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
    <h2 className="font-display text-base font-semibold">{title}</h2>
    {hint && <p className="mb-3 text-xs text-muted-foreground">{hint}</p>}
    <div className={hint ? "" : "mt-3"}>{children}</div>
  </section>
);

function Preview({ data, template }: { data: ResumeData; template: TemplateId }) {
  const tpl = templateById(template);
  const doc = useMemo(() => buildDocument(data), [data]);
  const accent = `rgb(${tpl.accent.join(",")})`;
  const center = tpl.align === "center";
  return (
    <div className="aspect-[1/1.414] w-full overflow-hidden rounded-xl border bg-white p-[6%] text-neutral-800 shadow-md"
      style={{ fontFamily: tpl.font === "times" ? "Georgia, 'Times New Roman', serif" : "Inter, Arial, sans-serif", fontSize: "clamp(6px, 1.25vw, 11px)", lineHeight: 1.4 }}>
      <div style={{ textAlign: center ? "center" : "left" }}>
        <div style={{ color: accent, fontWeight: 700, fontSize: "2.1em" }}>{doc.name || "Your Name"}</div>
        {doc.title && <div style={{ color: "#555", fontSize: "1.15em" }}>{doc.title}</div>}
        {doc.contact.length > 0 && <div style={{ color: "#555" }}>{doc.contact.join("  |  ")}</div>}
      </div>
      {doc.sections.length === 0 && <p className="mt-6 text-center text-neutral-400">Fill in the form to see your resume here.</p>}
      {doc.sections.map((s) => (
        <div key={s.title} style={{ marginTop: "1.1em" }}>
          <div style={{ color: accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", borderBottom: tpl.ruleUnderSection ? `1px solid ${accent}` : undefined, paddingBottom: 2, marginBottom: 3 }}>{s.title}</div>
          {s.lines.map((l, i) => l.kind === "row" ? (
            <div key={i} style={{ marginTop: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontWeight: 700 }}>
                <span>{l.left}</span><span style={{ fontWeight: 400, color: "#666", whiteSpace: "nowrap" }}>{l.right}</span>
              </div>
              {l.sub && <div style={{ fontStyle: "italic", color: "#555" }}>{l.sub}</div>}
            </div>
          ) : (
            <div key={i} style={{ paddingLeft: l.kind === "bullet" ? "1.1em" : 0, textIndent: l.kind === "bullet" ? "-0.8em" : 0 }}>
              {l.kind === "bullet" ? "• " : ""}{l.text}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const ResumeBuilder = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ResumeData>(() => readLocal()?.data ?? emptyResume());
  const [template, setTemplate] = useState<TemplateId>(() => readLocal()?.template ?? "classic");
  const [ready, setReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const hadLocal = useRef(!!readLocal());

  // Load saved resume (cloud first for signed-in users), else prefill from the profile.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (user) {
        const { data: row } = await supabase.from("resumes" as any).select("data, template").eq("user_id", user.id).maybeSingle();
        if (cancelled) return;
        if (row) {
          setData(normalizeResume((row as any).data));
          setTemplate(templateById((row as any).template).id);
          setReady(true);
          return;
        }
      }
      if (!hadLocal.current && profile) {
        setData((d) => ({
          ...d,
          fullName: profile.full_name || "", email: profile.email || "", phone: profile.phone || "", location: profile.location || "",
          linkedin: profile.linkedin_url || "", github: profile.github_url || "", summary: profile.bio || "",
          skills: (profile.skills || []).join(", "),
          education: profile.college || profile.degree
            ? [{ school: profile.college || "", degree: profile.degree || "", year: profile.graduation_year ? String(profile.graduation_year) : "", grade: "" }]
            : d.education,
        }));
      }
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id, profile?.id]);

  // Autosave: browser always, cloud when signed in.
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => {
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify({ data, template })); } catch { /* storage unavailable */ }
      if (user) {
        supabase.from("resumes" as any).upsert({ user_id: user.id, data, template, updated_at: new Date().toISOString() } as any, { onConflict: "user_id" }).then(() => {});
      }
    }, 800);
    return () => clearTimeout(id);
  }, [data, template, ready, user?.id]);

  const set = <K extends keyof ResumeData>(k: K, v: ResumeData[K]) => setData((d) => ({ ...d, [k]: v }));
  const update = <K extends "education" | "experience" | "projects">(k: K, i: number, patch: Partial<ResumeData[K][number]>) =>
    setData((d) => ({ ...d, [k]: d[k].map((x, j) => (j === i ? { ...x, ...patch } : x)) }) as ResumeData);
  const remove = (k: "education" | "experience" | "projects", i: number) =>
    setData((d) => ({ ...d, [k]: d[k].filter((_, j) => j !== i) }) as ResumeData);

  const { score, tips } = useMemo(() => completeness(data), [data]);

  const download = async () => {
    if (!data.fullName.trim()) { toast({ title: "Add your name first", variant: "destructive" }); return; }
    setDownloading(true);
    try { await downloadResumePdf(data, template); toast({ title: "Resume downloaded" }); }
    catch (e) { toast({ title: "Could not create the PDF", description: e instanceof Error ? e.message : undefined, variant: "destructive" }); }
    finally { setDownloading(false); }
  };

  const reset = () => {
    if (!window.confirm("Clear everything and start over?")) return;
    setData(emptyResume());
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <header className="border-b bg-gradient-to-br from-primary/15 via-background to-accent/40">
        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-3 py-1 text-xs font-semibold text-primary"><FileText className="h-3.5 w-3.5" /> Free resume builder</p>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Build a recruiter-ready resume</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">Fill in the form, watch it update live, and download a clean one-click PDF. {user ? "Your progress is saved to your account." : <>Your progress is saved in this browser. <Link to="/login" className="text-primary underline">Sign in</Link> to keep it everywhere.</>}</p>
        </div>
      </header>

      <div className="container mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Section title="Template">
            <div className="grid gap-2 sm:grid-cols-3">
              {TEMPLATES.map((t) => (
                <button key={t.id} type="button" onClick={() => setTemplate(t.id)}
                  className={cn("rounded-xl border p-3 text-left transition-colors", template === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.blurb}</p>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Personal details">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name"><Input value={data.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" /></Field>
              <Field label="Headline (e.g. Frontend Developer)"><Input value={data.title} onChange={(e) => set("title", e.target.value)} /></Field>
              <Field label="Email"><Input type="email" value={data.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" /></Field>
              <Field label="Phone"><Input value={data.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" /></Field>
              <Field label="Location"><Input value={data.location} onChange={(e) => set("location", e.target.value)} /></Field>
              <Field label="LinkedIn"><Input value={data.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="linkedin.com/in/you" /></Field>
              <Field label="GitHub"><Input value={data.github} onChange={(e) => set("github", e.target.value)} placeholder="github.com/you" /></Field>
              <Field label="Website / portfolio"><Input value={data.website} onChange={(e) => set("website", e.target.value)} /></Field>
            </div>
          </Section>

          <Section title="Summary" hint="2-3 lines about who you are and what you are looking for.">
            <Textarea rows={3} value={data.summary} onChange={(e) => set("summary", e.target.value)} />
          </Section>

          <Section title="Education">
            <div className="space-y-4">
              {data.education.map((e, i) => (
                <div key={i} className="grid gap-3 rounded-xl border border-dashed p-3 sm:grid-cols-2">
                  <Field label="College / school"><Input value={e.school} onChange={(ev) => update("education", i, { school: ev.target.value })} /></Field>
                  <Field label="Degree"><Input value={e.degree} onChange={(ev) => update("education", i, { degree: ev.target.value })} /></Field>
                  <Field label="Year"><Input value={e.year} onChange={(ev) => update("education", i, { year: ev.target.value })} placeholder="2022 - 2026" /></Field>
                  <Field label="Grade / CGPA"><Input value={e.grade} onChange={(ev) => update("education", i, { grade: ev.target.value })} /></Field>
                  <Button type="button" variant="ghost" size="sm" className="justify-self-start text-destructive sm:col-span-2" onClick={() => remove("education", i)}><Trash2 className="mr-1 h-4 w-4" /> Remove</Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => set("education", [...data.education, emptyEducation()])}><Plus className="mr-1 h-4 w-4" /> Add education</Button>
            </div>
          </Section>

          <Section title="Experience & internships" hint="One achievement per line. Start with a verb and add numbers where you can.">
            <div className="space-y-4">
              {data.experience.map((e, i) => (
                <div key={i} className="grid gap-3 rounded-xl border border-dashed p-3 sm:grid-cols-2">
                  <Field label="Company"><Input value={e.company} onChange={(ev) => update("experience", i, { company: ev.target.value })} /></Field>
                  <Field label="Role"><Input value={e.role} onChange={(ev) => update("experience", i, { role: ev.target.value })} /></Field>
                  <Field label="Period" className="sm:col-span-2"><Input value={e.period} onChange={(ev) => update("experience", i, { period: ev.target.value })} placeholder="Jun 2025 - Aug 2025" /></Field>
                  <Field label="What you did" className="sm:col-span-2"><Textarea rows={3} value={e.details} onChange={(ev) => update("experience", i, { details: ev.target.value })} /></Field>
                  <Button type="button" variant="ghost" size="sm" className="justify-self-start text-destructive sm:col-span-2" onClick={() => remove("experience", i)}><Trash2 className="mr-1 h-4 w-4" /> Remove</Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => set("experience", [...data.experience, emptyExperience()])}><Plus className="mr-1 h-4 w-4" /> Add experience</Button>
            </div>
          </Section>

          <Section title="Projects">
            <div className="space-y-4">
              {data.projects.map((p, i) => (
                <div key={i} className="grid gap-3 rounded-xl border border-dashed p-3 sm:grid-cols-2">
                  <Field label="Project name"><Input value={p.name} onChange={(ev) => update("projects", i, { name: ev.target.value })} /></Field>
                  <Field label="Link"><Input value={p.link} onChange={(ev) => update("projects", i, { link: ev.target.value })} /></Field>
                  <Field label="Details (one point per line)" className="sm:col-span-2"><Textarea rows={3} value={p.details} onChange={(ev) => update("projects", i, { details: ev.target.value })} /></Field>
                  <Button type="button" variant="ghost" size="sm" className="justify-self-start text-destructive sm:col-span-2" onClick={() => remove("projects", i)}><Trash2 className="mr-1 h-4 w-4" /> Remove</Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => set("projects", [...data.projects, emptyProject()])}><Plus className="mr-1 h-4 w-4" /> Add project</Button>
            </div>
          </Section>

          <Section title="Skills" hint="Separate with commas. These also power your job matching if you add them to your profile.">
            <Textarea rows={2} value={data.skills} onChange={(e) => set("skills", e.target.value)} placeholder="React, TypeScript, SQL, Git" />
          </Section>

          <Section title="Certifications" hint="One per line.">
            <Textarea rows={3} value={data.certifications} onChange={(e) => set("certifications", e.target.value)} />
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold">Resume strength</span><span className="font-display font-bold">{score}%</span></div>
            <Progress value={score} className="h-2" />
            {tips.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {tips.slice(0, 3).map((t) => <li key={t} className="flex gap-1.5"><Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />{t}</li>)}
              </ul>
            )}
            <div className="mt-4 flex gap-2">
              <Button className="flex-1 gap-2" onClick={download} disabled={downloading}><Download className="h-4 w-4" />{downloading ? "Preparing…" : "Download PDF"}</Button>
              <Button variant="outline" size="icon" onClick={reset} aria-label="Start over"><RotateCcw className="h-4 w-4" /></Button>
            </div>
          </div>
          <Preview data={data} template={template} />
        </aside>
      </div>
      <Footer />
    </div>
  );
};

export default ResumeBuilder;

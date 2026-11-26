import { Link } from "@/lib/router-compat";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mic, Video, Sparkles, MessageSquareText, BarChart3, GraduationCap, Bell } from "lucide-react";

const PLANNED = [
  { icon: Video, title: "Real interview rooms", desc: "Practise on camera with timed, role-specific questions." },
  { icon: Mic, title: "Speak your answers", desc: "Answer out loud, just like the real thing." },
  { icon: MessageSquareText, title: "Instant AI feedback", desc: "Clear notes on content, structure and confidence." },
  { icon: BarChart3, title: "Track your progress", desc: "See how every attempt improves over time." },
];

const MockInterviews = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main className="container max-w-5xl px-4 py-8 md:py-14">
      <section className="surface-ink relative overflow-hidden p-8 md:p-14 text-center">
        <div className="grid-dots absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl">
          <span className="eyebrow mx-auto mb-5"><Sparkles className="h-3.5 w-3.5" /> Mock interviews · Coming soon</span>
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-accent text-accent-foreground shadow-glow mock-pulse">
            <Mic className="h-9 w-9" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl">We're building it accurately.</h1>
          <p className="mt-4 text-lg font-semibold text-accent">Stay tuned…</p>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed muted-on-ink md:text-base">
            Mock interviews are being carefully crafted so the practice feels like a real interview. Until then, sharpen up with our interview prep and free skill tests.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/interview-prep" className="btn-pill btn-pill-accent h-11 text-sm"><GraduationCap className="h-4 w-4" /> Interview prep</Link>
            <Link to="/job-alerts" className="btn-pill h-11 border border-ink-foreground/20 text-sm text-ink-foreground hover:bg-ink-foreground/10"><Bell className="h-4 w-4" /> Get job alerts</Link>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <p className="eyebrow mb-4">What's coming</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {PLANNED.map((f) => (
            <div key={f.title} className="surface flex items-start gap-4 p-5 opacity-90">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><f.icon className="h-5 w-5" /></span>
              <div>
                <h2 className="font-display font-bold">{f.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default MockInterviews;

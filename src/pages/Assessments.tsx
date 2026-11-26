import { supabase } from "@/lib/db-client";
import { useEffect, useState } from "react";
import { Link, useNavigate } from '@/lib/router-compat';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ClipboardCheck, Sparkles, Building2, Brain, Target, Award,
  GraduationCap, Mail, User, BookOpen, Trophy, ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { saveRegistration } from "@/lib/assessments";
import { ALLOCATION_KEY, DEFAULT_ALLOCATION, normalizeAllocation, parseSlotTime, upcomingBookingDates, type AllocationSettings } from "@/exam/lib/testAllocation";
import { Calendar as CalendarIcon, Clock, Send } from "lucide-react";


const COMPANIES = [
  "TCS", "Infosys", "Wipro", "Accenture", "Cognizant",
  "Capgemini", "HCL", "Tech Mahindra", "Deloitte", "IBM",
  "Amazon", "Microsoft", "Google", "Adobe", "Goldman Sachs",
];

const PERKS = [
  { icon: Brain, title: "Aptitude + Logic", desc: "Quant, reasoning, verbal — the real placement pattern." },
  { icon: Target, title: "Company-wise Mocks", desc: "Practice tests modelled on TCS NQT, Infosys, Wipro, more." },
  { icon: Award, title: "Detailed Score Report", desc: "Sectional scores + topic-level weak areas after every test." },
  { icon: BookOpen, title: "Curated Study Material", desc: "Notes, formulas, and previous-year question banks." },
];

const Assessments = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", college: "", branch: "", cgpa: "",
  });

  const update = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.college || !form.branch || !form.cgpa) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      saveRegistration({
        ...form,
        slot_date: new Date().toISOString().slice(0, 10),
        slot_time: "Immediate",
        resume_filename: null,
        resume_data_url: null,
      });
      toast({ title: "You're registered!", description: "Starting your assessment now…" });
      setDone(true);
      setTimeout(() => navigate("/quick-start", {
        state: { name: form.full_name, email: form.email, auto: true },
      }), 400);
    } catch (err) {
      toast({ title: "Registration failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />

        <div className="container relative py-12 md:py-20 px-4">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Free for all students
              </Badge>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Register for <span className="text-primary">placement assessments</span> & get familiar with company exams
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-xl">
                Practice the exact patterns used by top recruiters. No login required — register once,
                get assessment slots, score reports, and curated prep material straight to your inbox.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {COMPANIES.slice(0, 8).map((c) => (
                  <Badge key={c} variant="outline" className="bg-card/60 hover-lift">{c}</Badge>
                ))}
                <Badge variant="outline" className="bg-card/60">+ more</Badge>
              </div>
              <a href="#register">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/30 hover-glow">
                  Register now <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="grid grid-cols-2 gap-3"
            >
              {PERKS.map((p, i) => (
                <motion.div
                  key={p.title}
                  whileHover={{ y: -4 }}
                  className="glossy rounded-2xl p-4 hover-glow"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <p.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-display font-semibold text-sm mb-1">{p.title}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{p.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* REGISTER FORM */}
      <section id="register" className="container py-12 md:py-16 px-4">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-start">
          <Card className="border-border/60 shadow-xl hover-lift">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck className="w-5 h-5 text-primary" />
                <CardTitle className="font-display text-2xl">Register for Assessments</CardTitle>
              </div>
              <CardDescription>
                Takes under a minute. Resume is optional — you can add it later from your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {done ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="font-display font-semibold text-xl mb-2">You're in!</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Your slot is locked in. Launching your assessment now…
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={() => setDone(false)} variant="outline">Register another</Button>
                    <Link to="/quick-start">
                      <Button className="gap-1">Start Test Now <ArrowRight className="w-4 h-4" /></Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Full Name *" icon={<User className="w-4 h-4" />}>
                      <Input required value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Your full name" />
                    </Field>
                    <Field label="Email *" icon={<Mail className="w-4 h-4" />}>
                      <Input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" />
                    </Field>
                  </div>
                  <Field label="College / University *" icon={<Building2 className="w-4 h-4" />}>
                    <Input required value={form.college} onChange={(e) => update("college", e.target.value)} placeholder="e.g. IIT Bombay" />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Branch / Stream *" icon={<GraduationCap className="w-4 h-4" />}>
                      <Input required value={form.branch} onChange={(e) => update("branch", e.target.value)} placeholder="e.g. Computer Science" />
                    </Field>
                    <Field label="CGPA *" icon={<Award className="w-4 h-4" />}>
                      <Input required value={form.cgpa} onChange={(e) => update("cgpa", e.target.value)} placeholder="e.g. 8.7 / 10" />
                    </Field>
                  </div>



                  <Button type="submit" size="lg" disabled={submitting} className="w-full gap-2 shadow-lg shadow-primary/30 hover-glow">
                    {submitting ? "Registering..." : "Register & Start Test"}
                    {!submitting && <ArrowRight className="w-4 h-4" />}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Your test starts immediately after registration. Good luck!
                  </p>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="glossy hover-lift">
              <CardContent className="p-6">
                <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> What you get
                </h3>
                <ul className="space-y-2.5 text-sm">
                  {[
                    "Mock tests for 50+ top recruiters",
                    "Topic-wise practice for aptitude, coding, and verbal",
                    "Sectional timer + detailed score report",
                    "Weekly placement updates straight to your inbox",
                    "Free resume review for top scorers",
                  ].map((t) => (
                    <li key={t} className="flex gap-2">
                      <span className="text-primary mt-0.5">●</span>
                      <span className="text-muted-foreground">{t}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/60 hover-lift">
              <CardContent className="p-6">
                <h3 className="font-display font-semibold mb-3">Companies covered</h3>
                <div className="flex flex-wrap gap-1.5">
                  {COMPANIES.map((c) => (
                    <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SCHEDULE FOR LATER — Calendar booking */}
      <ScheduleBookingSection />

      <Footer />
    </div>
  );
};

const ScheduleBookingSection = () => {
  const { toast } = useToast();
  const [alloc, setAlloc] = useState<AllocationSettings>(DEFAULT_ALLOCATION);
  useEffect(() => {
    supabase.from("codexam_settings").select("value").eq("key", ALLOCATION_KEY).maybeSingle()
      .then(({ data }) => setAlloc(normalizeAllocation(data?.value)));
  }, []);
  const dates = upcomingBookingDates(alloc);
  const timeSlots = alloc.bookingSlots;
  const [bookForm, setBookForm] = useState({ full_name: "", email: "" });
  const [pickedDate, setPickedDate] = useState<string>("");
  const [pickedSlot, setPickedSlot] = useState<string>("");
  useEffect(() => {
    if (!dates.includes(pickedDate)) setPickedDate(dates[0] || "");
    if (!timeSlots.includes(pickedSlot)) setPickedSlot(timeSlots[0] || "");
  }, [dates.join(","), timeSlots.join(",")]);
  const [bookSubmitting, setBookSubmitting] = useState(false);
  const [bookDone, setBookDone] = useState(false);

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.full_name || !bookForm.email || !pickedDate || !pickedSlot) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setBookSubmitting(true);
    try {
      // Save to the shared registrations list so admins can approve it and allocate a test for the slot.
      const hm = parseSlotTime(pickedSlot);
      const [y, mo, d] = pickedDate.split("-").map(Number);
      const slotStart = hm ? new Date(y, mo - 1, d, hm[0], hm[1]).toISOString() : null;
      const registrationId = crypto.randomUUID();
      const { error } = await supabase.from("registrations").insert({
        id: registrationId,
        name: bookForm.full_name.trim(), email: bookForm.email.trim().toLowerCase(), phone: "",
        notes: `Booked for later: ${pickedDate} ${pickedSlot}`, status: "pending",
        answers: { kind: "booking", slot_date: pickedDate, slot_time: pickedSlot, slot_start: slotStart, login_url: `${window.location.origin}/exam-login`, tz_offset: -new Date().getTimezoneOffset() },
      } as any);
      if (error) throw error;
      fetch("/api/public/notify-admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "registration", eventId: registrationId }) }).catch(() => {});
      // Admin-enabled automatic approval: runs now, and again when the admin's delay ends (the scheduled check also covers closed tabs).
      if (alloc.bookingAutoApprove) {
        const ping = () => fetch("/api/public/auto-approve-bookings", { method: "POST", keepalive: true }).catch(() => {});
        ping();
        if (alloc.bookingAutoDelayMinutes > 0 && alloc.bookingAutoDelayMinutes <= 60) setTimeout(ping, alloc.bookingAutoDelayMinutes * 60_000 + 3000);
      }
      toast({
        title: "Booking received!",
        description: alloc.bookingAutoApprove
          ? `Your login details will be emailed to ${bookForm.email} ${alloc.bookingAutoDelayMinutes ? `within about ${alloc.bookingAutoDelayMinutes} minutes` : "in a moment"}.`
          : `Once approved, your login details will be emailed to ${bookForm.email} for ${pickedDate} at ${pickedSlot}.`,
      });
      setBookDone(true);
    } catch {
      toast({ title: "Booking failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setBookSubmitting(false);
    }
  };

  const fmtDate = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <section id="schedule" className="container py-12 md:py-16 px-4 border-t border-border/40">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <Badge variant="secondary" className="mb-3 gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> Prefer to schedule?</Badge>
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Book your assessment for later</h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Pick a date and time that suits you. We'll email your unique assessment link a few minutes before your slot.
        </p>
      </div>
      <Card className="max-w-3xl mx-auto border-border/60 shadow-xl hover-lift">
        <CardContent className="p-6 md:p-8">
          {bookDone ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-xl mb-2">Slot requested!</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {alloc.bookingAutoApprove ? "Your booking is confirmed for" : "The admin will review your booking for"} <strong>{fmtDate(pickedDate)}</strong> at <strong>{pickedSlot}</strong>.
              </p>
              <p className="text-sm text-muted-foreground mb-5">
                Your login details and test will be emailed to <strong>{bookForm.email}</strong> {alloc.bookingAutoApprove ? (alloc.bookingAutoDelayMinutes ? `within about ${alloc.bookingAutoDelayMinutes} minutes` : "in a moment") : "once approved"}.
              </p>
              <Button variant="outline" onClick={() => setBookDone(false)}>Book another slot</Button>
            </div>
          ) : !alloc.bookingEnabled || !dates.length || !timeSlots.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Slot booking is closed right now. Please register above or check back later.</p>
          ) : (
            <form onSubmit={submitBooking} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Full Name *" icon={<User className="w-4 h-4" />}>
                  <Input required value={bookForm.full_name} onChange={(e) => setBookForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" />
                </Field>
                <Field label="Email *" icon={<Mail className="w-4 h-4" />}>
                  <Input required type="email" value={bookForm.email} onChange={(e) => setBookForm((p) => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
                </Field>
              </div>

              <div>
                <Label className="text-sm flex items-center gap-1.5 mb-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" /> Pick your assessment date *
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {dates.map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setPickedDate(d)}
                      className={`px-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                        pickedDate === d
                          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30"
                          : "bg-card hover:bg-muted border-border"
                      }`}
                    >
                      {fmtDate(d)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm flex items-center gap-1.5 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" /> Pick a time slot *
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {timeSlots.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setPickedSlot(s)}
                      className={`px-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                        pickedSlot === s
                          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30"
                          : "bg-card hover:bg-muted border-border"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" size="lg" disabled={bookSubmitting} className="w-full gap-2 shadow-lg shadow-primary/30 hover-glow">
                <Send className="w-4 h-4" />
                {bookSubmitting ? "Booking..." : "Confirm Booking & Email Me the Link"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You'll receive your unique test link via email before your selected time.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
};


const Field = ({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm flex items-center gap-1.5">
      <span className="text-muted-foreground">{icon}</span> {label}
    </Label>
    {children}
  </div>
);

export default Assessments;

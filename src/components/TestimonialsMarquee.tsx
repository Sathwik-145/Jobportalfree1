import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const TESTIMONIALS = [
  { name: "Rahul Sharma", role: "Frontend Developer @ Wipro", text: "Got hired within 2 weeks. The job alerts were spot on for my skills." },
  { name: "Priya Mehta", role: "Data Analyst @ Infosys", text: "Tracking my applications in one place changed everything. Super clean UX." },
  { name: "Arjun Patel", role: "UI Designer @ Zomato", text: "The resume templates and interview prep gave me an edge I needed." },
  { name: "Sneha Reddy", role: "Backend Engineer @ Razorpay", text: "Crystal-clear listings, no spam. Best free portal I've used by a mile." },
  { name: "Vikram Iyer", role: "Product Manager @ Flipkart", text: "Loved the dashboard. Three interviews in the first week itself." },
  { name: "Ananya Singh", role: "DevOps @ Freshworks", text: "Daily alerts felt hand-curated. Got my dream remote role through this." },
  { name: "Rohan Das", role: "Data Scientist @ Swiggy", text: "Polished, fast, and free. Applied with one click and never looked back." },
  { name: "Ishita Kapoor", role: "UX Researcher @ Paytm", text: "Beautiful site. Tracking and saving jobs is genuinely fun here." },
];

function Card({ t }: { t: (typeof TESTIMONIALS)[number] }) {
  return (
    <div className="w-[320px] shrink-0 rounded-2xl bg-card/80 backdrop-blur-md border border-border/60 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/40 transition-all duration-300">
      <Quote className="w-5 h-5 text-primary/40 mb-2" />
      <p className="text-sm leading-relaxed text-foreground/90">"{t.text}"</p>
      <div className="flex gap-0.5 mt-3">
        {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />)}
      </div>
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/50">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm">
          {t.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{t.name}</p>
          <p className="text-xs text-muted-foreground truncate">{t.role}</p>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsMarquee() {
  const top = [...TESTIMONIALS, ...TESTIMONIALS];
  const bottom = [...TESTIMONIALS.slice().reverse(), ...TESTIMONIALS.slice().reverse()];
  return (
    <div className="space-y-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="overflow-hidden">
        <motion.div className="flex gap-4 w-max" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 60, ease: "linear", repeat: Infinity }}>
          {top.map((t, i) => <Card key={`a-${i}`} t={t} />)}
        </motion.div>
      </div>
      <div className="overflow-hidden">
        <motion.div className="flex gap-4 w-max" animate={{ x: ["-50%", "0%"] }} transition={{ duration: 70, ease: "linear", repeat: Infinity }}>
          {bottom.map((t, i) => <Card key={`b-${i}`} t={t} />)}
        </motion.div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from '@/lib/router-compat';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Trophy, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface MCQ {
  q: string;
  options: string[];
  answer: number;
  section: "Aptitude" | "Logical" | "Verbal";
}

const QUESTIONS: MCQ[] = [
  { section: "Aptitude", q: "If 3x + 7 = 22, what is x?", options: ["3", "5", "7", "15"], answer: 1 },
  { section: "Aptitude", q: "A train 120m long crosses a pole in 6s. Its speed (km/h)?", options: ["60", "72", "80", "90"], answer: 1 },
  { section: "Aptitude", q: "The average of 5, 10, 15, 20, 25 is?", options: ["10", "12", "15", "20"], answer: 2 },
  { section: "Logical", q: "Find the next term: 2, 6, 12, 20, 30, ?", options: ["38", "40", "42", "44"], answer: 2 },
  { section: "Logical", q: "If MONDAY is coded as NPOEBZ, FRIDAY is coded as?", options: ["GSJEBZ", "GSJDBZ", "GSJEBY", "GSIEBZ"], answer: 0 },
  { section: "Logical", q: "All roses are flowers. Some flowers fade quickly. Therefore:", options: ["All roses fade quickly", "Some roses may fade quickly", "No rose fades quickly", "All flowers are roses"], answer: 1 },
  { section: "Verbal", q: "Choose the synonym of 'Abundant':", options: ["Scarce", "Plentiful", "Rare", "Limited"], answer: 1 },
  { section: "Verbal", q: "Choose the antonym of 'Transparent':", options: ["Clear", "Opaque", "Visible", "Bright"], answer: 1 },
  { section: "Verbal", q: "Identify the error: 'He don't like coffee.'", options: ["He", "don't", "like", "coffee"], answer: 1 },
  { section: "Aptitude", q: "20% of 250 = ?", options: ["25", "40", "50", "60"], answer: 2 },
];

const TOTAL_SECONDS = 10 * 60;

const AssessmentTest = () => {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => QUESTIONS.map(() => null));
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(
    () => answers.reduce<number>((s, a, i) => (a === QUESTIONS[i].answer ? s + 1 : s), 0),
    [answers],
  );

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          setSubmitted(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [submitted]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const current = QUESTIONS[idx];

  const select = (i: number) => {
    setAnswers((prev) => prev.map((v, k) => (k === idx ? i : v)));
  };

  const submit = () => setSubmitted(true);

  if (submitted) {
    const pct = Math.round((score / QUESTIONS.length) * 100);
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-2xl mx-auto py-12 px-4">
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-success" />
              </div>
              <h1 className="font-display text-3xl font-bold mb-2">Test Completed!</h1>
              <p className="text-muted-foreground mb-6">Here's your score report.</p>
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-3xl font-bold">{score}/{QUESTIONS.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Correct</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-3xl font-bold">{pct}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Score</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-3xl font-bold">{pct >= 60 ? "Pass" : "Retry"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Result</p>
                </div>
              </div>
              <div className="flex justify-center gap-2">
                <Link to="/assessments"><Button variant="outline">Back to Assessments</Button></Link>
                <Link to="/jobs"><Button>Browse Jobs <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Badge variant="secondary" className="gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Question {idx + 1} of {QUESTIONS.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm font-mono px-3 py-1.5 rounded-md bg-muted">
            <Clock className="w-4 h-4 text-primary" /> {mm}:{ss}
          </div>
        </div>

        <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card>
            <CardHeader>
              <Badge className="self-start mb-2" variant="outline">{current.section}</Badge>
              <CardTitle className="text-lg leading-snug">{current.q}</CardTitle>
              <CardDescription>Select the best answer.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {current.options.map((opt, i) => {
                  const selected = answers[idx] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => select(i)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                        selected
                          ? "border-primary bg-primary/10 font-medium"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <span className="text-xs text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex items-center justify-between mt-5">
          <Button variant="outline" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>
            Previous
          </Button>
          <div className="text-xs text-muted-foreground">
            {answers.filter((a) => a !== null).length} answered
          </div>
          {idx === QUESTIONS.length - 1 ? (
            <Button onClick={submit}>Submit Test</Button>
          ) : (
            <Button onClick={() => setIdx((i) => Math.min(QUESTIONS.length - 1, i + 1))}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        <div className="mt-4 text-center">
          <button onClick={() => navigate("/assessments")} className="text-xs text-muted-foreground hover:text-foreground">
            Exit test
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AssessmentTest;

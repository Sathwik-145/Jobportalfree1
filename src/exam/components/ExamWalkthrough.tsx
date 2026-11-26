// @ts-nocheck
import "@/exam/exam-student.css";
import { useState } from 'react';
import { ListChecks, FileCode2, Send, Maximize, Clock, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

interface Step {
  icon: any; title: string; description: string;
}

interface Props {
  hasMCQs: boolean;
  hasCoding: boolean;
  isTimed: boolean;
  onClose: () => void;
}

export default function ExamWalkthrough({ hasMCQs, hasCoding, isTimed, onClose }: Props) {
  const steps: Step[] = [
    { icon: Sparkles, title: 'Welcome to your exam', description: 'Take a quick tour to get familiar with the interface before you start.' },
    ...(hasMCQs ? [{ icon: ListChecks, title: 'Multiple Choice Section', description: 'Answer one question at a time. Use Previous / Save & Next to navigate. Your answers are auto-saved.' }] : []),
    ...(hasCoding ? [{ icon: FileCode2, title: 'Coding Section', description: 'Pick any coding question, write your solution, run public test cases, then submit. You can switch between questions anytime.' }] : []),
    ...(isTimed ? [{ icon: Clock, title: 'Timer', description: 'A countdown is shown at the top. The exam auto-submits when time runs out.' }] : []),
    { icon: Maximize, title: 'Fullscreen Mode', description: 'You must stay in fullscreen. Exiting will warn you and you can re-enter.' },
    { icon: AlertTriangle, title: 'Tab Switching', description: 'Switching tabs counts toward your limit. Exceeding the limit terminates the exam.' },
    { icon: Send, title: 'Submit', description: 'When you\'re done, click "Submit Test" at the top right. You\'ll see a confirmation summary first.' },
  ];

  const [step, setStep] = useState(0);
  const cur = steps[step];
  const isLast = step === steps.length - 1;
  const Icon = cur.icon;

  return (
    <div className="exam-student fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-card border rounded-[1.5rem] shadow-2xl p-8 max-w-md w-full">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="font-display font-bold text-xl text-center mb-2">{cur.title}</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">{cur.description}</p>

        <div className="flex items-center justify-center gap-1.5 mb-5">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'}`} />
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 h-10 bg-muted rounded-lg font-medium text-sm hover:bg-muted/80">
            Skip Tour
          </button>
          {isLast ? (
            <button onClick={onClose}
              className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90">
              Start Exam
            </button>
          ) : (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-1">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">Step {step + 1} of {steps.length}</p>
      </div>
    </div>
  );
}

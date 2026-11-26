// @ts-nocheck
import "@/exam/exam-student.css";
import { AlertTriangle, Maximize, Send } from 'lucide-react';

interface Props {
  tabSwitchCount: number;
  maxTabSwitches: number;
  completedSummary?: { mcqAnswered: number; mcqTotal: number; codingDone: number; codingTotal: number };
  onResume: () => void;
  onSubmit: () => void;
}

export default function TabSwitchDialog({ tabSwitchCount, maxTabSwitches, completedSummary, onResume, onSubmit }: Props) {
  const remaining = Math.max(0, maxTabSwitches - tabSwitchCount);
  return (
    <div className="exam-student fixed inset-0 bg-foreground/60 backdrop-blur-sm z-[75] flex items-center justify-center p-4">
      <div className="bg-card border rounded-[1.5rem] shadow-2xl p-7 max-w-md w-full">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-accent" />
          </div>
        </div>
        <h2 className="font-display font-bold text-xl text-center mb-1">You left the exam window</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Tab switches: <span className="font-bold text-foreground">{tabSwitchCount}/{maxTabSwitches}</span>
          {remaining > 0 && <> · {remaining} remaining before termination</>}
        </p>

        {completedSummary && (
          <div className="bg-muted/40 rounded-lg p-4 mb-5 text-sm">
            <p className="font-semibold mb-2">Your progress so far:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>MCQs answered: <span className="font-bold">{completedSummary.mcqAnswered}/{completedSummary.mcqTotal}</span></div>
              <div>Coding done: <span className="font-bold">{completedSummary.codingDone}/{completedSummary.codingTotal}</span></div>
            </div>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground mb-4">
          Choose to re-enter fullscreen and continue, or submit your test now with what you've completed.
        </p>

        <div className="flex flex-col gap-2">
          <button onClick={onResume}
            className="h-11 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2">
            <Maximize className="w-4 h-4" /> Re-enter Fullscreen & Continue
          </button>
          <button onClick={onSubmit}
            className="h-11 bg-destructive text-destructive-foreground rounded-lg font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> Submit Test Now
          </button>
        </div>
      </div>
    </div>
  );
}

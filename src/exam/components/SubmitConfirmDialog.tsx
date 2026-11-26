import { createPortal } from 'react-dom';
import { useEffect, type ReactNode } from 'react';
import { AlertTriangle, Send } from 'lucide-react';

/**
 * Large, centred "Submit entire test?" confirmation. Rendered on <body> so page animations
 * or transformed parents can never push it off-centre.
 */
export default function SubmitConfirmDialog({ message, warnings = [], confirmLabel = 'Yes, submit', onCancel, onConfirm }: {
  message: ReactNode;
  warnings?: ReactNode[];
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="codexam-theme exam-student fixed inset-0 z-[70] grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="submit-test-title">
      <div className="exam-dialog w-full max-w-xl rounded-[2rem] border bg-card p-8 text-center shadow-2xl sm:p-12">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/15">
          <AlertTriangle className="h-11 w-11 text-accent" />
        </div>
        <h2 id="submit-test-title" className="font-display text-3xl font-bold sm:text-4xl">Submit entire test?</h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">{message}</p>
        {warnings.filter(Boolean).map((w, i) => (
          <p key={i} className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-base font-medium text-accent">⚠ {w}</p>
        ))}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
          <button type="button" onClick={onCancel} autoFocus
            className="h-14 flex-1 rounded-2xl bg-muted text-base font-semibold text-foreground transition-colors hover:bg-muted/80">Cancel</button>
          <button type="button" onClick={onConfirm}
            className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-destructive text-base font-semibold text-destructive-foreground transition-all hover:opacity-90 active:scale-[0.98]">
            <Send className="h-5 w-5" /> {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

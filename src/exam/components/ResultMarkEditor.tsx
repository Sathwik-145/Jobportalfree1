import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Save } from 'lucide-react';
import { validateCorrection } from '@/exam/lib/reportCorrections';
import { toast } from 'sonner';
export default function ResultMarkEditor({ marks, max, correct, onSave }: { marks: number; max: number; correct: boolean; onSave: (marks: number, correct: boolean) => Promise<void> }) {
  const [value, setValue] = useState(marks), [ok, setOk] = useState(correct), [busy, setBusy] = useState(false);
  useEffect(() => { setValue(marks); setOk(correct); }, [marks, correct]);
  return <div className="flex flex-wrap items-center gap-2 pt-3"><Input aria-label="Awarded marks" type="number" min={0} max={max} step="0.5" value={value} className="w-20" onChange={e => setValue(Number(e.target.value))} /><span className="text-xs text-muted-foreground">/ {max}</span><Button size="icon" variant={ok ? 'default' : 'outline'} title="Mark correct" aria-label="Mark correct" onClick={() => { setOk(true); setValue(max); }}><Check /></Button><Button size="icon" variant={!ok ? 'destructive' : 'outline'} title="Mark incorrect" aria-label="Mark incorrect" onClick={() => { setOk(false); setValue(0); }}><X /></Button><Button size="sm" disabled={busy} onClick={async () => { setBusy(true); try { validateCorrection(value, max); await onSave(value, ok); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save'); } finally { setBusy(false); } }}><Save className="w-4 h-4 mr-1" />Save marks</Button></div>;
}
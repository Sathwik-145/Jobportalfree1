import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchKey, saveKey } from "@/exam/lib/codexamSettings";
import { DEFAULT_RESULT_TEMPLATE, RESULT_VARS } from "@/exam/lib/mailTemplates";

/** Edits the saved result email ("result_template") used by manual, delayed and automatic result mails. */
export default function ResultTemplateEditor() {
  const [t, setT] = useState(DEFAULT_RESULT_TEMPLATE);
  useEffect(() => { fetchKey("result_template", DEFAULT_RESULT_TEMPLATE).then((v: any) => setT({ ...DEFAULT_RESULT_TEMPLATE, ...(v || {}) })); }, []);
  const save = async () => { try { await saveKey("result_template", t); toast.success("Result email saved"); } catch { toast.error("Could not save"); } };
  return (
    <div className="space-y-2 rounded-2xl border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2"><b className="text-sm">Result email (automatic and manual)</b>
        <Button size="sm" variant="ghost" onClick={() => setT(DEFAULT_RESULT_TEMPLATE)}>Restore default</Button></div>
      <Input value={t.subject} onChange={e => setT({ ...t, subject: e.target.value })} />
      <Textarea rows={10} value={t.body} onChange={e => setT({ ...t, body: e.target.value })} />
      <p className="text-xs text-muted-foreground">You can use: {RESULT_VARS}</p>
      <Button onClick={save}>Save result email</Button>
    </div>
  );
}

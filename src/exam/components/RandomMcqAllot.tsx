import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shuffle } from "lucide-react";
import { pickRandomTests } from "@/lib/randomAllot";
import { Switch } from "@/components/ui/switch";
import { fetchKey, saveKey } from "@/exam/lib/codexamSettings";

/** Give each selected student a different random MCQ-only test. Lives in Exam Settings → Schedules. */
export default function RandomMcqAllot() {
  const [on, setOn] = useState(false);
  useEffect(() => { fetchKey<boolean>("random_mcq_enabled", false).then((v) => setOn(!!v)); }, []);
  const toggle = async (v: boolean) => { setOn(v); try { await saveKey("random_mcq_enabled", v); } catch { toast.error("Could not save"); } };
  if (!on) return (
    <Card><CardContent className="p-5 flex items-center justify-between gap-3">
      <div><h2 className="font-semibold flex items-center gap-2"><Shuffle className="w-4 h-4 text-primary" /> Random MCQ allotment</h2><p className="text-sm text-muted-foreground">Turn on to give students different random MCQ tests.</p></div>
      <Switch checked={on} onCheckedChange={toggle} />
    </CardContent></Card>
  );
  return <RandomMcqAllotInner onOff={() => toggle(false)} />;
}

function RandomMcqAllotInner({ onOff }: { onOff: () => void }) {
  // ---- random allotment
  const [students, setStudents] = useState<{ id: string; name: string | null; email: string }[]>([]);
  const [mcqTests, setMcqTests] = useState<{ id: string; title: string | null }[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [count, setCount] = useState(1);
  const [search, setSearch] = useState("");


  useEffect(() => {
    supabase.from("students").select("id,name,email").order("created_at", { ascending: false }).then(({ data }) => setStudents(data || []));
    supabase.from("exams").select("id,title,question_ids,writing_ids,fib_ids,mcq_ids").order("created_at", { ascending: false }).then(({ data }) =>
      setMcqTests((data || []).filter((e: any) => (e.mcq_ids || []).length && !(e.question_ids || []).length && !(e.writing_ids || []).length && !(e.fib_ids || []).length)));
  }, []);

  const allot = async () => {
    if (!picked.size) return toast.error("Select at least one student");
    if (!mcqTests.length) return toast.error("No MCQ-only tests found");
    const plan = pickRandomTests([...picked], mcqTests.map(t => t.id), count);
    const { data: exams } = await supabase.from("exams").select("id,assigned_student_ids").in("id", mcqTests.map(t => t.id));
    const map = new Map((exams || []).map((e: any) => [e.id, new Set<string>(e.assigned_student_ids || [])]));
    for (const [sid, ids] of Object.entries(plan)) for (const id of ids) map.get(id)?.add(sid);
    const changed = new Set(Object.values(plan).flat());
    for (const id of changed) {
      const { error } = await supabase.from("exams").update({ assigned_student_ids: [...(map.get(id) || [])] } as any).eq("id", id);
      if (error) return toast.error(error.message);
    }
    toast.success(`Assigned ${count} random MCQ test(s) to ${picked.size} student(s)`);
    setPicked(new Set());
  };

  const shownStudents = students.filter(s => `${s.name} ${s.email}`.toLowerCase().includes(search.toLowerCase()));
  return (
      <Card><CardContent className="p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Shuffle className="w-4 h-4 text-primary" /> Random MCQ tests for selected students<span className="ml-auto"><Switch checked onCheckedChange={onOff} /></span></h2>
        <p className="text-sm text-muted-foreground">{mcqTests.length} MCQ-only tests available. Each selected student gets a different random pick.</p>
        <div className="flex flex-wrap gap-2 items-center">
          <Input className="max-w-xs" placeholder="Search students" value={search} onChange={e => setSearch(e.target.value)} />
          <span className="text-sm">Tests per student</span>
          <Input type="number" min={1} max={10} className="w-20" value={count} onChange={e => setCount(Math.max(1, Math.min(10, +e.target.value || 1)))} />
          <Button variant="outline" size="sm" onClick={() => setPicked(new Set(shownStudents.map(s => s.id)))}>Select all shown</Button>
          <Button variant="outline" size="sm" onClick={() => setPicked(new Set())}>Clear</Button>
        </div>
        <div className="max-h-64 overflow-auto rounded-xl border divide-y">
          {shownStudents.length === 0 && <p className="p-3 text-sm text-muted-foreground">No students yet.</p>}
          {shownStudents.map(s => (
            <label key={s.id} className="flex items-center gap-3 p-2 text-sm cursor-pointer hover:bg-muted/50">
              <input type="checkbox" checked={picked.has(s.id)} onChange={e => { const n = new Set(picked); e.target.checked ? n.add(s.id) : n.delete(s.id); setPicked(n); }} />
              <span className="font-medium">{s.name || "—"}</span><span className="text-muted-foreground">{s.email}</span>
            </label>
          ))}
        </div>
        <Button onClick={allot} className="gap-2"><Shuffle className="w-4 h-4" /> Assign random MCQ tests ({picked.size})</Button>
      </CardContent></Card>
  );
}

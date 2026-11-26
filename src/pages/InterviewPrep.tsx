import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImportantConcepts from "@/components/ImportantConcepts";
import { GraduationCap, Lightbulb, Pencil, Plus, Trash2, RotateCcw, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { loadOverride, saveOverride, clearOverride } from "@/lib/inlineEdit";
import { useToast } from "@/hooks/use-toast";

interface PrepItem {
  id: string;
  category: string;
  title: string;
  content: string;
  tips: string[] | null;
}

const defaultContent: PrepItem[] = [
  { id: "1", category: "General", title: "Tell me about yourself", content: "Structure your answer: Present → Past → Future. Start with your current role, mention relevant past experience, and connect to why you're excited about this opportunity.", tips: ["Keep it under 2 minutes", "Focus on professional life", "End with why you're here"] },
  { id: "2", category: "Technical", title: "Common coding interview patterns", content: "Focus on data structures (arrays, trees, graphs, hash maps), algorithms (sorting, searching, dynamic programming), and system design basics.", tips: ["Practice on LeetCode/HackerRank", "Think aloud during interviews", "Ask clarifying questions first"] },
  { id: "3", category: "Behavioral", title: "STAR Method for behavioral questions", content: "Situation: Set the context. Task: Describe your responsibility. Action: Explain what you did. Result: Share the outcome with metrics if possible.", tips: ["Prepare 5-6 STAR stories", "Use real examples", "Quantify results when possible"] },
  { id: "4", category: "HR", title: "Salary negotiation tips", content: "Research market rates, know your worth, and let the employer make the first offer. Always negotiate — most companies expect it.", tips: ["Use Glassdoor/Levels.fyi for research", "Consider total compensation", "Be confident but respectful"] },
];

const OVERRIDE_KEY = "interview_prep_v1";

const empty = (): PrepItem => ({ id: crypto.randomUUID(), category: "Technical", title: "", content: "", tips: [] });

const InterviewPrep = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<PrepItem[]>(defaultContent);
  const [dbItems, setDbItems] = useState<PrepItem[]>([]);
  const [editing, setEditing] = useState<PrepItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [tipsText, setTipsText] = useState("");

  useEffect(() => {
    setItems(loadOverride<PrepItem[]>(OVERRIDE_KEY, defaultContent));
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data } = await supabase
        .from("interview_prep")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (data && data.length > 0) setDbItems(data as PrepItem[]);
    } catch {}
  };

  const persist = (next: PrepItem[]) => { setItems(next); saveOverride(OVERRIDE_KEY, next); };

  const startEdit = (it: PrepItem) => {
    setEditing({ ...it });
    setTipsText((it.tips || []).join("\n"));
    setIsNew(false);
  };
  const startCreate = () => { setEditing(empty()); setTipsText(""); setIsNew(true); };

  const saveEdit = () => {
    if (!editing) return;
    if (!editing.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    const tips = tipsText.split("\n").map(t => t.trim()).filter(Boolean);
    const merged = { ...editing, tips: tips.length ? tips : null };
    const next = isNew ? [merged, ...items] : items.map(i => i.id === merged.id ? merged : i);
    persist(next);
    toast({ title: isNew ? "Question added" : "Question updated" });
    setEditing(null);
  };

  const remove = (id: string) => {
    if (!confirm("Delete this question?")) return;
    persist(items.filter(i => i.id !== id));
    toast({ title: "Removed" });
  };

  const resetAll = () => {
    if (!confirm("Reset all interview prep to defaults?")) return;
    clearOverride(OVERRIDE_KEY);
    setItems(defaultContent);
    toast({ title: "Reset to defaults" });
  };

  const allItems = [...dbItems, ...items];
  const categories = [...new Set(allItems.map(i => i.category))];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6 px-4 md:py-8 max-w-4xl">
        <div className="text-center mb-8">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 text-primary" />
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Interview Preparation</h1>
          <p className="text-muted-foreground">Tips, questions, and resources to ace your next interview</p>
        </div>

        {isAdmin && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-medium">Admin edit mode</span>
              <span className="text-muted-foreground hidden sm:inline">— add, edit or delete questions</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={resetAll} className="gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
              <Button size="sm" onClick={startCreate} className="gap-1">
                <Plus className="w-3.5 h-3.5" /> Add question
              </Button>
            </div>
          </div>
        )}

        {categories.map(cat => (
          <div key={cat} className="mb-6">
            <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge variant="secondary">{cat}</Badge>
            </h2>
            <Accordion type="multiple" className="space-y-2">
              {allItems.filter(i => i.category === cat).map(item => (
                <AccordionItem key={item.id} value={item.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left font-medium">
                    <span className="flex-1">{item.title}</span>
                    {isAdmin && items.some(i => i.id === item.id) && (
                      <span className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); startEdit(item); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); remove(item.id); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </span>
                    )}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-3 whitespace-pre-wrap">{item.content}</p>
                    {item.tips && item.tips.length > 0 && (
                      <div className="space-y-1">
                        <p className="font-medium text-sm flex items-center gap-1"><Lightbulb className="w-4 h-4 text-primary" /> Tips:</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          {item.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                        </ul>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}

        <ImportantConcepts />
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isNew ? "Add interview question" : "Edit interview question"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="Technical / Behavioral / HR / DSA / OOPS / SQL / Web / OS" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Title / Question</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Answer / Content</Label>
                <Textarea rows={5} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tips (one per line)</Label>
                <Textarea rows={3} value={tipsText} onChange={(e) => setTipsText(e.target.value)} placeholder="Keep it concise&#10;Quantify results&#10;Use STAR" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default InterviewPrep;

import { useState, useEffect } from "react";
import { supabase } from "@/lib/db-client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Star } from "lucide-react";

interface Props {
  applicationId: string;
}

const ApplicationNotes = ({ applicationId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) fetchNotes();
  }, [open]);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from("application_notes")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false });
    setNotes(data || []);
  };

  const handleSave = async () => {
    if (!user || (!note.trim() && !rating)) return;
    setSaving(true);
    const { error } = await supabase.from("application_notes").insert({
      application_id: applicationId,
      admin_id: user.id,
      note: note.trim() || null,
      rating: rating || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Note added!" });
      setNote("");
      setRating(0);
      fetchNotes();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Notes & Rating">
          <MessageSquare className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="mx-4 max-w-md">
        <DialogHeader>
          <DialogTitle>Notes & Rating</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setRating(s)} className="p-1">
                <Star className={`w-5 h-5 ${s <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              </button>
            ))}
            {rating > 0 && <span className="text-sm text-muted-foreground ml-2">{rating}/5</span>}
          </div>
          <Textarea placeholder="Add a note about this applicant..." value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          <Button onClick={handleSave} disabled={saving} size="sm" className="w-full">
            {saving ? "Saving..." : "Add Note"}
          </Button>
          {notes.length > 0 && (
            <div className="border-t pt-3 space-y-2 max-h-48 overflow-auto">
              {notes.map(n => (
                <div key={n.id} className="bg-muted/50 rounded p-2 text-sm">
                  {n.rating && (
                    <div className="flex gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= n.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                  )}
                  {n.note && <p className="text-muted-foreground">{n.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationNotes;

import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";

interface Headline {
  id: string;
  text: string;
  is_active: boolean;
  created_at: string;
}

const ManageHeadlines = () => {
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [editItem, setEditItem] = useState<Headline | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteItem, setDeleteItem] = useState<Headline | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchHeadlines(); }, []);

  const fetchHeadlines = async () => {
    const { data } = await supabase
      .from("headlines")
      .select("*")
      .order("created_at", { ascending: false });
    setHeadlines(data || []);
  };

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("headlines").insert({ text: newText.trim() });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Headline added" }); setNewText(""); setAddOpen(false); fetchHeadlines(); }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!editItem || !editText.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("headlines").update({ text: editText.trim() }).eq("id", editItem.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Updated" }); setEditItem(null); fetchHeadlines(); }
    setSaving(false);
  };

  const handleToggle = async (h: Headline) => {
    await supabase.from("headlines").update({ is_active: !h.is_active }).eq("id", h.id);
    fetchHeadlines();
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    await supabase.from("headlines").delete().eq("id", deleteItem.id);
    toast({ title: "Deleted" });
    setDeleteItem(null);
    fetchHeadlines();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="font-display text-xl md:text-2xl font-bold">Manage Headlines</h2>
        <Button size="sm" className="gap-1" onClick={() => setAddOpen(true)}>
          <PlusCircle className="w-4 h-4" /> Add
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Active headlines scroll below the navbar for all users.</p>

      <div className="space-y-3">
        {headlines.map((h) => (
          <Card key={h.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <Switch checked={h.is_active} onCheckedChange={() => handleToggle(h)} />
              <p className="flex-1 text-sm truncate">{h.text}</p>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(h); setEditText(h.text); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteItem(h)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {headlines.length === 0 && <p className="text-center text-muted-foreground py-8">No headlines yet.</p>}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="mx-4 max-w-lg">
          <DialogHeader><DialogTitle>Add Headline</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Headline Text</Label>
              <Input placeholder="e.g. 🔴 We are LIVE on YouTube!" value={newText} onChange={(e) => setNewText(e.target.value)} />
            </div>
            <Button onClick={handleAdd} disabled={saving || !newText.trim()} className="w-full">{saving ? "Adding..." : "Add Headline"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="mx-4 max-w-lg">
          <DialogHeader><DialogTitle>Edit Headline</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Headline Text</Label>
              <Input value={editText} onChange={(e) => setEditText(e.target.value)} />
            </div>
            <Button onClick={handleEdit} disabled={saving || !editText.trim()} className="w-full">{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent className="mx-4 max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Headline</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageHeadlines;

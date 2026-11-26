import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Pencil, Trash2, Youtube, Megaphone, Radio, ExternalLink } from "lucide-react";

interface Banner {
  id: string;
  icon_type: string;
  title: string;
  subtitle: string | null;
  link_url: string | null;
  is_active: boolean;
  created_at: string;
}

const iconOptions = [
  { value: "youtube", label: "YouTube", Icon: Youtube },
  { value: "megaphone", label: "Megaphone", Icon: Megaphone },
  { value: "radio", label: "Radio/Live", Icon: Radio },
  { value: "link", label: "Link", Icon: ExternalLink },
];

const ManagePromoBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Banner | null>(null);
  const [deleteItem, setDeleteItem] = useState<Banner | null>(null);
  const [form, setForm] = useState({ icon_type: "youtube", title: "", subtitle: "", link_url: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    const { data } = await supabase.from("promo_banners").select("*").order("created_at", { ascending: false });
    setBanners(data || []);
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ icon_type: "youtube", title: "", subtitle: "", link_url: "" });
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditItem(b);
    setForm({ icon_type: b.icon_type, title: b.title, subtitle: b.subtitle || "", link_url: b.link_url || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      icon_type: form.icon_type,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      link_url: form.link_url.trim() || null,
    };

    if (editItem) {
      const { error } = await supabase.from("promo_banners").update(payload).eq("id", editItem.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Updated" }); setDialogOpen(false); fetchBanners(); }
    } else {
      const { error } = await supabase.from("promo_banners").insert(payload);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Banner added" }); setDialogOpen(false); fetchBanners(); }
    }
    setSaving(false);
  };

  const handleToggle = async (b: Banner) => {
    await supabase.from("promo_banners").update({ is_active: !b.is_active }).eq("id", b.id);
    fetchBanners();
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    await supabase.from("promo_banners").delete().eq("id", deleteItem.id);
    toast({ title: "Deleted" });
    setDeleteItem(null);
    fetchBanners();
  };

  const getIcon = (type: string) => {
    const opt = iconOptions.find((o) => o.value === type);
    return opt ? <opt.Icon className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="font-display text-xl md:text-2xl font-bold">Promo Banners</h2>
        <Button size="sm" className="gap-1" onClick={openAdd}>
          <PlusCircle className="w-4 h-4" /> Add
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Active banners show above the hero section for all users.</p>

      <div className="space-y-3">
        {banners.map((b) => (
          <Card key={b.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <Switch checked={b.is_active} onCheckedChange={() => handleToggle(b)} />
              <span className="shrink-0">{getIcon(b.icon_type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{b.title}</p>
                {b.subtitle && <p className="text-xs text-muted-foreground truncate">{b.subtitle}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteItem(b)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {banners.length === 0 && <p className="text-center text-muted-foreground py-8">No promo banners yet.</p>}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="mx-4 max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? "Edit Banner" : "Add Banner"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={form.icon_type} onValueChange={(v) => setForm({ ...form, icon_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {iconOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      <span className="flex items-center gap-2"><o.Icon className="w-4 h-4" /> {o.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="e.g. jobportalfreeofficial" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Subtitle (optional)</Label>
              <Input placeholder="e.g. Subscribe to our channel" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Link URL (optional)</Label>
              <Input placeholder="https://youtube.com/..." value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
            </div>
            <Button onClick={handleSave} disabled={saving || !form.title.trim()} className="w-full">
              {saving ? "Saving..." : editItem ? "Save" : "Add Banner"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent className="mx-4 max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
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

export default ManagePromoBanners;

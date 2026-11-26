import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { Plus, Trash2, Pencil, Upload, X } from "lucide-react";

const emptyForm = { name: "", description: "", download_url: "", preview_url: "", category: "", source_url: "" };

const ManageTemplates = () => {
  const [templates, setTemplates] = useState<Tables<"resume_templates">[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase.from("resume_templates").select("*").order("created_at", { ascending: false });
    setTemplates(data || []);
  };

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("templates").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = await supabase.storage.from("templates").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      update("download_url", urlData?.signedUrl || "");
      toast({ title: "PDF uploaded!", description: "Download URL set automatically." });
    }
    setUploading(false);
  };

  const saveTemplate = async () => {
    if (!form.name || (!form.download_url && !form.source_url)) {
      toast({ title: "Error", description: "Name and at least a PDF or external link is required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const payload = {
      name: form.name,
      description: form.description || null,
      download_url: form.download_url || form.source_url || "",
      preview_url: form.preview_url || null,
      category: form.category || null,
      source_url: form.source_url || null,
    } as any;

    if (editingId) {
      const { error } = await supabase.from("resume_templates").update(payload).eq("id", editingId);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Updated!", description: "Template updated." });
        setEditingId(null);
        setForm(emptyForm);
        fetchTemplates();
      }
    } else {
      const { error } = await supabase.from("resume_templates").insert(payload);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Added!", description: "Template created." });
        setForm(emptyForm);
        fetchTemplates();
      }
    }
    setLoading(false);
  };

  const startEdit = (t: Tables<"resume_templates">) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      description: t.description || "",
      download_url: t.download_url,
      preview_url: t.preview_url || "",
      category: t.category || "",
      source_url: (t as any).source_url || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("resume_templates").update({ is_active: !current }).eq("id", id);
    setTemplates((p) => p.map((t) => t.id === id ? { ...t, is_active: !current } : t));
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from("resume_templates").delete().eq("id", id);
    setTemplates((p) => p.filter((t) => t.id !== id));
    toast({ title: "Deleted" });
  };

  return (
    <div>
      <h2 className="font-display text-xl md:text-2xl font-bold mb-4 md:mb-6">Resume Templates</h2>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{editingId ? "Edit Template" : "Add Template"}</CardTitle>
            {editingId && (
              <Button variant="ghost" size="sm" onClick={cancelEdit} className="gap-1">
                <X className="w-4 h-4" /> Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
            <div className="space-y-1"><Label>Category</Label><Input placeholder="e.g. Modern, Classic" value={form.category} onChange={(e) => update("category", e.target.value)} /></div>
          </div>
          <div className="space-y-1"><Label>Description</Label><Input value={form.description} onChange={(e) => update("description", e.target.value)} /></div>
          <div className="space-y-1">
            <Label>Upload PDF (optional)</Label>
            <div className="flex gap-2">
              <Input placeholder="PDF URL will appear here after upload" value={form.download_url} onChange={(e) => update("download_url", e.target.value)} className="flex-1" />
              <Label htmlFor="pdf-upload" className="cursor-pointer">
                <Button variant="outline" size="icon" className="shrink-0" asChild>
                  <span><Upload className="w-4 h-4" /></span>
                </Button>
              </Label>
              <input id="pdf-upload" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handlePdfUpload} />
            </div>
            {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
          </div>
          <div className="space-y-1">
            <Label>External Link (optional)</Label>
            <Input placeholder="https://example.com/template" value={form.source_url} onChange={(e) => update("source_url", e.target.value)} />
            <p className="text-xs text-muted-foreground">If provided, users will see a link button to visit this website</p>
          </div>
          <div className="space-y-1"><Label>Preview Image URL</Label><Input placeholder="https://..." value={form.preview_url} onChange={(e) => update("preview_url", e.target.value)} /></div>
          <Button onClick={saveTemplate} disabled={loading} className="gap-1 w-full sm:w-auto">
            {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {loading ? "Saving..." : editingId ? "Update Template" : "Add Template"}
          </Button>
        </CardContent>
      </Card>

      {templates.length > 0 && (
        <div className="space-y-3 md:space-y-0">
          <div className="md:hidden space-y-3">
            {templates.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.category || "No category"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={t.is_active} onCheckedChange={() => toggleActive(t.id, t.is_active)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(t)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTemplate(t.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="hidden md:block rounded-lg border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Active</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{t.name}</td>
                    <td className="p-3">{t.category || "—"}</td>
                    <td className="p-3"><Switch checked={t.is_active} onCheckedChange={() => toggleActive(t.id, t.is_active)} /></td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(t)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTemplate(t.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTemplates;

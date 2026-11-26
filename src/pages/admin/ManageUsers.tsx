import DateRangeFilter, { inRange } from "@/components/DateRangeFilter";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Pencil, Trash2, MessageSquare, Download } from "lucide-react";
import * as XLSX from "xlsx";

interface UserRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  college: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
}

const ManageUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState({ from: "", to: "" });
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", college: "", phone: "", location: "" });
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [msgUser, setMsgUser] = useState<UserRow | null>(null);
  const [msgForm, setMsgForm] = useState({ title: "", message: "" });
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, college, phone, location, created_at")
      .order("created_at", { ascending: false });
    setUsers(data || []);
  };

  const filtered = users.filter((u) => inRange(u.created_at, range)).filter((u) =>
    !search || [u.full_name, u.email, u.college].some((f) => f?.toLowerCase().includes(search.toLowerCase()))
  );

  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setEditForm({
      full_name: u.full_name || "",
      email: u.email || "",
      college: u.college || "",
      phone: u.phone || "",
      location: u.location || "",
    });
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editForm.full_name || null,
        email: editForm.email || null,
        college: editForm.college || null,
        phone: editForm.phone || null,
        location: editForm.location || null,
      })
      .eq("user_id", editUser.user_id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: "User details have been saved." });
      setEditUser(null);
      fetchUsers();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    const { error } = await supabase.from("profiles").delete().eq("user_id", deleteUser.user_id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "User profile has been removed." });
      setUsers((prev) => prev.filter((u) => u.user_id !== deleteUser.user_id));
    }
    setDeleteUser(null);
  };

  const openMessage = (u: UserRow) => {
    setMsgUser(u);
    setMsgForm({ title: "", message: "" });
  };

  const handleSendMessage = async () => {
    if (!msgUser || !msgForm.title.trim()) return;
    setSending(true);
    const { error } = await supabase.from("notifications").insert({
      user_id: msgUser.user_id,
      title: msgForm.title.trim(),
      message: msgForm.message.trim() || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sent", description: `Notification sent to ${msgUser.full_name || msgUser.email || "user"}.` });
      setMsgUser(null);
    }
    setSending(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-accent/30 p-6">
        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight">User Management</h2>
        <Button size="sm" className="gap-1" onClick={() => {
          const rows = users.map(u => ({
            Name: u.full_name || "",
            Email: u.email || "",
            College: u.college || "",
            Phone: u.phone || "",
            Location: u.location || "",
            Joined: new Date(u.created_at).toLocaleDateString(),
          }));
          const ws = XLSX.utils.json_to_sheet(rows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Users");
          XLSX.writeFile(wb, "users.xlsx");
        }}>
          <Download className="w-4 h-4" /> Export Excel
        </Button>
      </div>
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="mb-3"><DateRangeFilter value={range} onChange={setRange} /></div>
      <p className="text-sm text-muted-foreground mb-4">{filtered.length} users</p>

      {/* Mobile: card layout */}
      <div className="md:hidden space-y-3">
        {filtered.map((u) => (
          <Card key={u.user_id} className="rounded-2xl border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{u.full_name || "—"}</p>
                <p className="text-sm text-muted-foreground truncate">{u.email || "—"}</p>
                <p className="text-xs text-muted-foreground">{u.college || ""} • {new Date(u.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => openMessage(u)} title="Send Notification">
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteUser(u)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden md:block rounded-2xl border border-border/60 bg-card shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/60">
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Email</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">College</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Joined</th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.user_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium">{u.full_name || "—"}</td>
                <td className="p-3">{u.email || "—"}</td>
                <td className="p-3">{u.college || "—"}</td>
                <td className="p-3 text-sm text-muted-foreground">{new Date(u.created_at).toLocaleString()}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => openMessage(u)} title="Send Notification">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteUser(u)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="mx-4 max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label>Full Name</Label><Input value={editForm.full_name} onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-2"><Label>College</Label><Input value={editForm.college} onChange={(e) => setEditForm((p) => ({ ...p, college: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Location</Label><Input value={editForm.location} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))} /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={!!msgUser} onOpenChange={(open) => !open && setMsgUser(null)}>
        <DialogContent className="mx-4 max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Notification to {msgUser?.full_name || msgUser?.email || "User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input placeholder="Notification title" value={msgForm.title} onChange={(e) => setMsgForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea placeholder="Additional details..." rows={3} value={msgForm.message} onChange={(e) => setMsgForm((p) => ({ ...p, message: e.target.value }))} />
            </div>
            <Button onClick={handleSendMessage} disabled={sending || !msgForm.title.trim()} className="w-full">
              {sending ? "Sending..." : "Send Notification"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent className="mx-4 max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteUser?.full_name || deleteUser?.email || "this user"}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
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

export default ManageUsers;
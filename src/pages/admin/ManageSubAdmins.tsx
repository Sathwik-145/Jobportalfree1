import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Pencil, Trash2, Shield, Check, X, Clock } from "lucide-react";

interface SubAdmin {
  id: string;
  user_id: string;
  profiles: { full_name: string | null; email: string | null; phone: string | null; college: string | null } | null;
}

interface SubAdminRequest {
  id: string;
  user_id: string;
  purpose: string;
  reason: string;
  status: string;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null } | null;
}

const permissionLabels: Record<string, string> = {
  can_manage_jobs: "Manage Jobs",
  can_view_applications: "View Applications",
  can_manage_templates: "Manage Templates",
  can_manage_headlines: "Manage Headlines",
  can_manage_banners: "Manage Banners",
  can_view_messages: "View Messages",
  can_view_analytics: "View Analytics",
  can_view_users: "View Users",
};

const defaultPerms = {
  can_manage_jobs: false,
  can_view_applications: false,
  can_manage_templates: false,
  can_manage_headlines: false,
  can_manage_banners: false,
  can_view_messages: false,
  can_view_analytics: false,
  can_view_users: false,
};

const ManageSubAdmins = () => {
  const { user } = useAuth();
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [requests, setRequests] = useState<SubAdminRequest[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [editSA, setEditSA] = useState<SubAdmin | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone: "", college: "" });
  const [deleteSA, setDeleteSA] = useState<SubAdmin | null>(null);
  const [saving, setSaving] = useState(false);
  const [permDialog, setPermDialog] = useState<SubAdmin | null>(null);
  const [perms, setPerms] = useState(defaultPerms);
  const [newPerms, setNewPerms] = useState(defaultPerms);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubAdmins();
    fetchRequests();
  }, []);

  const fetchSubAdmins = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("id, user_id, profiles:user_id(full_name, email, phone, college)")
      .eq("role", "subadmin");
    setSubAdmins((data as any) || []);
  };

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("subadmin_requests")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data && data.length > 0) {
      const userIds = data.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      
      const enriched = data.map(r => ({
        ...r,
        profiles: profiles?.find(p => p.user_id === r.user_id) || null,
      }));
      setRequests(enriched);
    } else {
      setRequests([]);
    }
  };

  const addSubAdmin = async () => {
    if (!email) return;
    setLoading(true);
    const { data: profile } = await supabase.from("profiles").select("user_id, full_name, email, phone, college").eq("email", email).maybeSingle();
    if (!profile) {
      toast({ title: "Not found", description: "No user with that email.", variant: "destructive" });
      setLoading(false);
      return;
    }
    const { error } = await supabase.from("user_roles").insert({ user_id: profile.user_id, role: "subadmin" as any });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    // Insert permissions chosen in the form
    await supabase.from("subadmin_permissions").insert({ user_id: profile.user_id, ...newPerms });
    // Notify user
    await supabase.from("notifications").insert({
      user_id: profile.user_id,
      title: "🎉 You've been granted Sub-Admin access!",
      message: "An admin has given you sub-admin privileges. You can now access the admin panel.",
    });
    toast({ title: "Added!", description: `${email} is now a sub-admin with selected permissions.` });
    setEmail("");
    setNewPerms(defaultPerms);
    await fetchSubAdmins();
    setLoading(false);
  };

  const openPermissions = async (sa: SubAdmin) => {
    setPermDialog(sa);
    const { data } = await supabase
      .from("subadmin_permissions")
      .select("*")
      .eq("user_id", sa.user_id)
      .maybeSingle();
    if (data) {
      setPerms({
        can_manage_jobs: data.can_manage_jobs,
        can_view_applications: data.can_view_applications,
        can_manage_templates: data.can_manage_templates,
        can_manage_headlines: data.can_manage_headlines,
        can_manage_banners: data.can_manage_banners,
        can_view_messages: data.can_view_messages,
        can_view_analytics: data.can_view_analytics,
        can_view_users: data.can_view_users,
      });
    } else {
      setPerms(defaultPerms);
    }
  };

  const savePermissions = async () => {
    if (!permDialog) return;
    setSaving(true);
    const { data: existing } = await supabase
      .from("subadmin_permissions")
      .select("id")
      .eq("user_id", permDialog.user_id)
      .maybeSingle();
    
    if (existing) {
      await supabase.from("subadmin_permissions").update(perms).eq("user_id", permDialog.user_id);
    } else {
      await supabase.from("subadmin_permissions").insert({ user_id: permDialog.user_id, ...perms });
    }
    toast({ title: "Permissions updated!" });
    setPermDialog(null);
    setSaving(false);
  };

  const openEdit = (sa: SubAdmin) => {
    setEditSA(sa);
    setEditForm({
      full_name: sa.profiles?.full_name || "",
      email: sa.profiles?.email || "",
      phone: sa.profiles?.phone || "",
      college: sa.profiles?.college || "",
    });
  };

  const handleSave = async () => {
    if (!editSA) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name || null,
      email: editForm.email || null,
      phone: editForm.phone || null,
      college: editForm.college || null,
    }).eq("user_id", editSA.user_id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated" });
      setEditSA(null);
      fetchSubAdmins();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteSA) return;
    // Remove permissions
    await supabase.from("subadmin_permissions").delete().eq("user_id", deleteSA.user_id);
    // Remove role
    await supabase.from("user_roles").delete().eq("id", deleteSA.id);
    // Notify user
    await supabase.from("notifications").insert({
      user_id: deleteSA.user_id,
      title: "Sub-Admin access removed",
      message: "Your sub-admin privileges have been revoked by an admin.",
    });
    setSubAdmins((p) => p.filter((s) => s.id !== deleteSA.id));
    toast({ title: "Removed", description: "Sub-admin role has been removed and user notified." });
    setDeleteSA(null);
  };

  const handleRequest = async (req: SubAdminRequest, approve: boolean) => {
    if (approve) {
      // Add subadmin role
      const { error } = await supabase.from("user_roles").insert({ user_id: req.user_id, role: "subadmin" as any });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      await supabase.from("subadmin_permissions").insert({ user_id: req.user_id, ...defaultPerms });
      await supabase.from("notifications").insert({
        user_id: req.user_id,
        title: "🎉 Sub-Admin request approved!",
        message: "Your request for sub-admin access has been approved. You can now access the admin panel.",
      });
    } else {
      await supabase.from("notifications").insert({
        user_id: req.user_id,
        title: "Sub-Admin request declined",
        message: "Your request for sub-admin access has been declined.",
      });
    }
    await supabase.from("subadmin_requests").update({
      status: approve ? "approved" : "rejected",
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", req.id);
    toast({ title: approve ? "Approved!" : "Rejected" });
    fetchRequests();
    if (approve) fetchSubAdmins();
  };

  const pendingRequests = requests.filter(r => r.status === "pending");

  return (
    <div>
      <h2 className="font-display text-xl md:text-2xl font-bold mb-4 md:mb-6">Sub-Admin Management</h2>

      <Tabs defaultValue="subadmins">
        <TabsList className="mb-4">
          <TabsTrigger value="subadmins">Sub-Admins</TabsTrigger>
          <TabsTrigger value="requests" className="gap-1">
            Requests {pendingRequests.length > 0 && <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{pendingRequests.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subadmins">
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg">Add New Sub-Admin</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Permissions selection inline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold">Sidebar Permissions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      const allTrue = Object.values(newPerms).every(Boolean);
                      const val = !allTrue;
                      setNewPerms({
                        can_manage_jobs: val,
                        can_view_applications: val,
                        can_manage_templates: val,
                        can_manage_headlines: val,
                        can_manage_banners: val,
                        can_view_messages: val,
                        can_view_analytics: val,
                        can_view_users: val,
                      });
                    }}
                  >
                    {Object.values(newPerms).every(Boolean) ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                      <Label className="text-sm">{label}</Label>
                      <Switch
                        checked={(newPerms as any)[key]}
                        onCheckedChange={(v) => setNewPerms((p) => ({ ...p, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* Email and Add button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">User Email</Label>
                  <Input placeholder="Enter user's registered email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <Button onClick={addSubAdmin} disabled={loading} className="gap-1 w-full sm:w-auto self-end">
                  <UserPlus className="w-4 h-4" /> {loading ? "Adding..." : "Add as Sub-Admin"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {subAdmins.length === 0 ? (
            <p className="text-muted-foreground">No sub-admins yet.</p>
          ) : (
            <div className="space-y-3">
              {subAdmins.map((sa) => (
                <Card key={sa.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{sa.profiles?.full_name || "—"}</p>
                      <p className="text-sm text-muted-foreground truncate">{sa.profiles?.email || "—"}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Permissions" onClick={() => openPermissions(sa)}>
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(sa)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteSA(sa)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests">
          {requests.length === 0 ? (
            <p className="text-muted-foreground">No sub-admin requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{req.profiles?.full_name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{req.profiles?.email}</p>
                      </div>
                      <Badge variant={req.status === "pending" ? "secondary" : req.status === "approved" ? "default" : "destructive"}>
                        {req.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                        {req.status}
                      </Badge>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <p className="font-medium mb-1">Purpose: {req.purpose}</p>
                      <p className="text-muted-foreground">{req.reason}</p>
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-1" onClick={() => handleRequest(req, true)}>
                          <Check className="w-4 h-4" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleRequest(req, false)}>
                          <X className="w-4 h-4" /> Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Permissions Dialog */}
      <Dialog open={!!permDialog} onOpenChange={(open) => !open && setPermDialog(null)}>
        <DialogContent className="mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Permissions — {permDialog?.profiles?.full_name || permDialog?.profiles?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {Object.entries(permissionLabels).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label>{label}</Label>
                <Switch
                  checked={(perms as any)[key]}
                  onCheckedChange={(v) => setPerms((p) => ({ ...p, [key]: v }))}
                />
              </div>
            ))}
            <Button onClick={savePermissions} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Permissions"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editSA} onOpenChange={(open) => !open && setEditSA(null)}>
        <DialogContent className="mx-4 max-w-lg">
          <DialogHeader><DialogTitle>Edit Sub-Admin</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label>Full Name</Label><Input value={editForm.full_name} onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} /></div>
            <div className="space-y-2"><Label>College</Label><Input value={editForm.college} onChange={(e) => setEditForm((p) => ({ ...p, college: e.target.value }))} /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSA} onOpenChange={(open) => !open && setDeleteSA(null)}>
        <AlertDialogContent className="mx-4 max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Sub-Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteSA?.profiles?.full_name || deleteSA?.profiles?.email || "this sub-admin"}</strong>?
              This will revoke their access and they will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageSubAdmins;

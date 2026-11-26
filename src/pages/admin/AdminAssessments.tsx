// @ts-nocheck
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/db-client";
import { Link } from "@/lib/router-compat";
import ApproveRegistrationsDialog from "@/exam/components/ApproveRegistrationsDialog";
import { ClipboardList, Download, Trash2, Mail, CalendarClock, Check, RefreshCw, ExternalLink, Zap } from "lucide-react";

const isBooking = (r: any) => !!r.answers?.slot_start || /^Booked for later/i.test(r.notes || "");
const fmt = (iso?: string | null) => iso ? new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";

/** Slot bookings and quick starts from the public /assessments page, read from the shared registrations list. */
const AdminAssessments = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<"booking" | "quick" | "all">("booking");
  const [target, setTarget] = useState(null);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("registrations").select("*").is("link_id", null).order("created_at", { ascending: false }).limit(500);
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => {
    fetch("/api/public/auto-approve-bookings", { method: "POST" }).catch(() => {}).finally(refresh);
  }, []);

  const shown = rows.filter(r => kind === "all" || (kind === "booking" ? isBooking(r) : /^Quick-start/i.test(r.notes || "")));
  const pending = rows.filter(r => isBooking(r) && r.status === "pending").length;

  const handleExport = () => {
    const head = ["Name", "Email", "Type", "Slot", "Status", "Test", "Created"];
    const lines = shown.map(r => [r.name, r.email, isBooking(r) ? "Slot booking" : "Quick start", r.answers?.slot_start ? fmt(r.answers.slot_start) : "", r.status, r.answers?.assigned_exam_title || "", r.created_at]
      .map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `assessment-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removed");
    refresh();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" /> Assessment bookings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Slot bookings and quick starts from the public /assessments page. Approve to allocate a test and email the login.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={refresh} className="gap-2"><RefreshCw className="w-4 h-4" /> Refresh</Button>
          <Button variant="outline" onClick={handleExport} disabled={!shown.length} className="gap-2"><Download className="w-4 h-4" /> Export CSV</Button>
          <Button asChild className="gap-2"><Link to="/exam-admin/registrations"><ExternalLink className="w-4 h-4" /> Auto-approve & settings</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Slot bookings" value={rows.filter(isBooking).length} icon={CalendarClock} />
        <StatCard label="Waiting for approval" value={pending} icon={Check} />
        <StatCard label="Quick starts" value={rows.filter(r => /^Quick-start/i.test(r.notes || "")).length} icon={Zap} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {([["booking", "Slot bookings"], ["quick", "Quick starts"], ["all", "All"]] as const).map(([k, l]) => (
          <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)}>{l}</Button>
        ))}
      </div>

      {loading ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">Loading…</CardContent></Card>
      ) : shown.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>Nothing here yet. Share the <code className="text-primary">/assessments</code> page with students.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.map((r) => (
            <Card key={r.id} className="hover-lift">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-base">{r.name}</p>
                      <Badge variant={r.status === "approved" ? "default" : "secondary"} className="text-[10px] capitalize">{r.status}</Badge>
                      {r.answers?.approved_by === "auto-approval" && <Badge variant="outline" className="text-[10px]">Auto-approved</Badge>}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {r.email}</span>
                      {isBooking(r) && <span className="flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5" /> {r.answers?.slot_start ? fmt(r.answers.slot_start) : (r.notes || "").replace(/^Booked for later:\s*/i, "")}</span>}
                      {r.answers?.assigned_exam_title && <span>Test: <strong className="text-foreground">{r.answers.assigned_exam_title}</strong>{r.answers?.assigned_start ? ` · starts ${fmt(r.answers.assigned_start)}` : ""}</span>}
                      {!isBooking(r) && r.notes && <span>{r.notes}</span>}
                    </div>
                    {r.status === "pending" && r.answers?.auto_error && <p className="mt-1 text-xs text-destructive">Auto-approve failed: {r.answers.auto_error}</p>}
                  </div>
                  <div className="flex gap-2">
                    {isBooking(r) && (
                      <Button size="sm" variant={r.status === "pending" ? "default" : "outline"} className="gap-1"
                        onClick={() => setTarget({ ids: [r.id], label: r.name || r.email, bookedStart: r.answers?.slot_start || null })}>
                        <Check className="w-4 h-4" /> {r.status === "pending" ? "Approve" : "Re-send / new test"}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(r.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ApproveRegistrationsDialog target={target} onClose={() => setTarget(null)} onDone={() => refresh()} />
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) => (
  <Card className="hover-lift">
    <CardContent className="p-4 text-center">
      <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default AdminAssessments;

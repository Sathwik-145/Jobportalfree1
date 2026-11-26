import { useState, useRef } from "react";
import { supabase } from "@/lib/db-client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Check, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import { sendJobAlertsFor } from "@/lib/jobAlertClient";

interface JobRow {
  title?: string;
  company?: string;
  description?: string;
  location?: string;
  job_type?: string;
  experience_level?: string;
  salary_range?: string;
  skills_required?: string;
  source_url?: string;
  deadline?: string;
}

const BulkImportJobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<JobRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<JobRow>(ws);
      setRows(data);
      setImported(0);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    let count = 0;
    const newIds: string[] = [];
    for (const row of rows) {
      const { data: created, error } = await supabase.from("jobs").insert({
        title: row.title || null,
        company: row.company || null,
        description: row.description || null,
        location: row.location || null,
        job_type: row.job_type || null,
        experience_level: row.experience_level || null,
        salary_range: row.salary_range || null,
        skills_required: row.skills_required ? row.skills_required.split(",").map(s => s.trim()).filter(Boolean) : null,
        source_url: row.source_url || null,
        deadline: row.deadline || null,
        posted_by: user?.id,
        is_active: true,
      }).select("id").single();
      if (!error) { count++; if (created?.id) newIds.push(created.id); }
    }
    setImported(count);
    toast({ title: `${count} jobs imported!`, description: `${rows.length - count} failed.` });
    const mail = await sendJobAlertsFor(newIds);
    if (mail.error) toast({ title: "Alert emails failed", description: mail.error, variant: "destructive" });
    else if (mail.sent) toast({ title: `Job alerts emailed to ${mail.sent} ${mail.sent === 1 ? "person" : "people"}` });
    setImporting(false);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { title: "Software Engineer", company: "Google", description: "Build cool things", location: "Remote", job_type: "full-time", experience_level: "entry", salary_range: "$80K-$120K", skills_required: "React, Node.js", source_url: "https://example.com", deadline: "2026-12-31" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jobs");
    XLSX.writeFile(wb, "job_import_template.xlsx");
  };

  return (
    <div>
      <h2 className="font-display text-xl md:text-2xl font-bold mb-4 md:mb-6">Bulk Import Jobs</h2>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" /> Upload CSV/Excel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload an Excel/CSV file with columns: title, company, description, location, job_type, experience_level, salary_range, skills_required, source_url, deadline
          </p>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>Download Template</Button>
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click to upload .xlsx or .csv</p>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.csv,.xls" className="hidden" onChange={handleFile} />
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Preview ({rows.length} jobs)
              {imported > 0 && <Badge className="gap-1"><Check className="w-3 h-3" /> {imported} imported</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto rounded border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Title</th>
                    <th className="p-2 text-left">Company</th>
                    <th className="p-2 text-left">Location</th>
                    <th className="p-2 text-left">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{row.title || <span className="text-destructive"><AlertTriangle className="w-3 h-3 inline" /> Missing</span>}</td>
                      <td className="p-2">{row.company || "—"}</td>
                      <td className="p-2">{row.location || "—"}</td>
                      <td className="p-2">{row.job_type || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={handleImport} disabled={importing} className="mt-4 gap-1">
              {importing ? "Importing..." : `Import ${rows.length} Jobs`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkImportJobs;

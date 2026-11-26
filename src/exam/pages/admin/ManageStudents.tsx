// @ts-nocheck
import { useState, useRef } from 'react';
import AdminLayout from '@/exam/components/AdminLayout';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { Student } from '@/exam/types';
import { generateCredentials, generateId } from '@/exam/data/sampleData';
import { Plus, RotateCcw, Ban, CheckCircle2, Eye, EyeOff, Copy, X, Users, Upload, Download, FileSpreadsheet, Pencil, Link as LinkIcon, Play, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { setContact } from '@/exam/lib/codexamSettings';
import EditStudentDialog from '@/exam/components/EditStudentDialog';
import StudentTestsDialog from '@/exam/components/StudentTestsDialog';
import PersonalLoginSettings from '@/exam/components/PersonalLoginSettings';

export default function ManageStudents() {
  const { students, setStudents, questions } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMaxTabs, setNewMaxTabs] = useState(3);
  const [newEmail, setNewEmail] = useState('');
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [bulkCreds, setBulkCreds] = useState<{ name: string; email: string; password: string }[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [viewingTests, setViewingTests] = useState<Student | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddStudent = () => {
    if (!newName.trim()) return;
    const creds = generateCredentials(newName);
    const student: Student = {
      id: generateId(),
      name: newName,
      email: creds.email,
      password: creds.password,
      isBlocked: false,
      tabSwitchCount: 0,
      maxTabSwitches: newMaxTabs,
      examStatus: 'not_started',
      assignedQuestions: [],
      submissions: [],
    };
    setStudents(prev => [...prev, student]);
    setCreatedCreds(creds);
    if (newEmail.trim()) {
      setContact(student.id, newEmail).then(() => toast.success(`Personal email saved — credentials will be mailed to ${newEmail.trim()}`)).catch(() => toast.error('Could not save personal email'));
    }
    setNewName('');
    setNewEmail('');
  };

  const toggleBlock = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, isBlocked: !s.isBlocked } : s));
  };

  const resetAccess = (id: string) => {
    if (!confirm('Reset this student fully? Clears block, tab switches, exam status, and submissions.')) return;
    setStudents(prev => prev.map(s => s.id === id ? {
      ...s, isBlocked: false, examStatus: 'not_started', tabSwitchCount: 0, submissions: []
    } : s));
    toast.success('Student fully reset — can retake the exam');
  };

  // Allow restart after tab-switch lockout WITHOUT wiping submissions
  const allowRestart = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? {
      ...s, isBlocked: false, tabSwitchCount: 0,
      examStatus: s.examStatus === 'terminated' ? 'in_progress' as const : s.examStatus,
    } : s));
    toast.success('Student can resume the exam now');
  };

  const updateMaxTabs = (id: string, val: number) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, maxTabSwitches: val } : s));
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const copyLoginLink = (s: Student) => {
    const url = `${window.location.origin}/exam-login?email=${encodeURIComponent(s.email)}`;
    const msg = `Login to your assessment:\n${url}\n\nEmail: ${s.email}\nPassword: ${s.password}`;
    navigator.clipboard.writeText(msg);
    toast.success('Login link + credentials copied!');
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csv = 'Name,MaxTabSwitches\nJohn Doe,3\nJane Smith,5\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        toast.error('File must have a header row and at least one student');
        return;
      }

      const header = lines[0].toLowerCase();
      if (!header.includes('name')) {
        toast.error('CSV must have a "Name" column');
        return;
      }

      const newStudents: Student[] = [];
      const newCreds: { name: string; email: string; password: string }[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const name = cols[0];
        if (!name) continue;

        const maxTabs = parseInt(cols[1]) || 3;
        const creds = generateCredentials(name);

        // Check for duplicate email
        const existingEmail = students.find(s => s.email === creds.email);
        if (existingEmail) {
          // Add random suffix to make unique
          const rand = Math.random().toString(36).substring(2, 5);
          creds.email = creds.email.replace('@', `.${rand}@`);
        }

        const student: Student = {
          id: generateId(),
          name,
          email: creds.email,
          password: creds.password,
          isBlocked: false,
          tabSwitchCount: 0,
          maxTabSwitches: maxTabs,
          examStatus: 'not_started',
          assignedQuestions: [],
          submissions: [],
        };

        newStudents.push(student);
        newCreds.push({ name, email: creds.email, password: creds.password });
      }

      if (newStudents.length === 0) {
        toast.error('No valid students found in file');
        return;
      }

      setStudents(prev => [...prev, ...newStudents]);
      setBulkCreds(newCreds);
      setShowBulkModal(true);
      toast.success(`${newStudents.length} students added!`);
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download generated credentials as CSV
  const downloadCredentials = (creds: { name: string; email: string; password: string }[]) => {
    const csv = 'Name,Email,Password\n' + creds.map(c => `"${c.name}","${c.email}","${c.password}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_credentials_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Credentials downloaded!');
  };

  // Download ALL student credentials
  const downloadAllCredentials = () => {
    if (students.length === 0) {
      toast.error('No students to export');
      return;
    }
    const creds = students.map(s => ({ name: s.name, email: s.email, password: s.password }));
    downloadCredentials(creds);
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <Link2 className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Student exam login:</span>
          <code className="font-medium break-all">{window.location.origin}/exam-login</code>
          <button onClick={() => copyText(`${window.location.origin}/exam-login`)} className="ml-auto inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            <Copy className="w-3.5 h-3.5" /> Copy link
          </button>
        </div>
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 mb-6 rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Students</h1>
            <p className="text-muted-foreground text-sm">Manage student credentials and exam access</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Download template */}
            <button onClick={downloadTemplate}
              className="flex flex-wrap items-center gap-2 px-3 h-10 bg-muted text-foreground rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors"
              title="Download CSV template">
              <FileSpreadsheet className="w-4 h-4" /> Template
            </button>

            {/* Upload CSV */}
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()}
              className="flex flex-wrap items-center gap-2 px-3 h-10 bg-muted text-foreground rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors"
              title="Upload CSV to bulk add students">
              <Upload className="w-4 h-4" /> Bulk Upload
            </button>

            {/* Download all credentials */}
            {students.length > 0 && (
              <button onClick={downloadAllCredentials}
                className="flex flex-wrap items-center gap-2 px-3 h-10 bg-muted text-foreground rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors"
                title="Download all student credentials">
                <Download className="w-4 h-4" /> Export All
              </button>
            )}

            <button onClick={() => { setShowAdd(true); setCreatedCreds(null); }}
              className="flex flex-wrap items-center gap-2 px-4 h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all">
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>
        </div>

        {/* Bulk Upload Results Modal */}
        {showBulkModal && bulkCreds.length > 0 && (
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border rounded-2xl shadow-lg w-full max-w-lg p-6 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">{bulkCreds.length} Students Created!</h2>
                <button onClick={() => setShowBulkModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {bulkCreds.map((c, i) => (
                  <div key={i} className="bg-muted rounded-lg p-3 text-xs font-mono">
                    <div className="font-semibold text-sm font-sans mb-1">{c.name}</div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span>{c.email}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Password:</span><span>{c.password}</span></div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => downloadCredentials(bulkCreds)}
                  className="flex-1 flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all">
                  <Download className="w-4 h-4" /> Download Credentials CSV
                </button>
                <button onClick={() => setShowBulkModal(false)}
                  className="px-4 h-10 bg-muted text-foreground rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors">
                  Done
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">⚠ Download and share credentials securely. Passwords cannot be recovered later.</p>
            </div>
          </div>
        )}

        {/* Add Student Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border rounded-2xl shadow-lg w-full max-w-md p-6">
              {createdCreds ? (
                <>
                  <h2 className="font-semibold text-lg mb-4">Student Created!</h2>
                  <div className="bg-muted rounded-lg p-4 space-y-3 font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{createdCreds.email}</span>
                        <button onClick={() => copyText(createdCreds.email)}><Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Password:</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{createdCreds.password}</span>
                        <button onClick={() => copyText(createdCreds.password)}><Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" /></button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Share these credentials securely with the student.</p>
                  <button onClick={() => setShowAdd(false)}
                    className="w-full mt-4 h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90">
                    Done
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-lg">Add Student</h2>
                    <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Student Name</label>
                      <input value={newName} onChange={e => setNewName(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="e.g. Rahul Sharma" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Student's personal email <span className="text-muted-foreground font-normal">(optional)</span></label>
                      <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="e.g. rahul@gmail.com" />
                      <p className="text-xs text-muted-foreground mt-1">Credentials are mailed here instead of the generated login email.</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Max Tab Switches</label>
                      <input type="number" value={newMaxTabs} onChange={e => setNewMaxTabs(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" min={1} />
                    </div>
                    <button onClick={handleAddStudent} disabled={!newName.trim()}
                      className="w-full h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
                      Generate Credentials
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Students Table */}
        <PersonalLoginSettings students={students} />
        {students.length > 0 ? (
          <div className="bg-card border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="block w-full text-sm sm:table">
                <thead className="hidden sm:table-header-group ">
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Password</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tab Switches</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="block space-y-3 bg-muted/30 p-3 sm:table-row-group sm:space-y-0 sm:bg-transparent sm:p-0">
                  {students.map(s => (
                    <tr key={s.id} className="block rounded-2xl border bg-card p-3 shadow-sm sm:table-row sm:rounded-none sm:border-0 sm:border-b sm:p-0 sm:shadow-none last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="block min-w-0 break-words py-2 sm:table-cell sm:px-5 sm:py-4 font-medium"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">Name</span>
                        <button onClick={() => setViewingTests(s)} className="hover:text-primary hover:underline text-left">
                          {s.name}
                        </button>
                      </td>
                      <td className="block min-w-0 break-words py-2 sm:table-cell sm:px-5 sm:py-4 text-muted-foreground font-mono text-xs"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">Email</span>{s.email}</td>
                      <td className="block min-w-0 break-words py-2 sm:table-cell sm:px-5 sm:py-4"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">Password</span>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="font-mono text-xs">{showPasswords[s.id] ? s.password : '••••••'}</span>
                          <button onClick={() => setShowPasswords(p => ({ ...p, [s.id]: !p[s.id] }))}>
                            {showPasswords[s.id] ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                          </button>
                        </div>
                      </td>
                      <td className="block min-w-0 break-words py-2 sm:table-cell sm:px-5 sm:py-4"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">Status</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.examStatus === 'completed' ? 'bg-primary/10 text-primary' :
                          s.examStatus === 'terminated' ? 'bg-destructive/10 text-destructive' :
                          s.examStatus === 'in_progress' ? 'bg-warning/10 text-warning' :
                          'bg-muted text-muted-foreground'
                        }`}>{s.examStatus === 'completed' ? 'submitted' : s.examStatus.replace('_', ' ')}</span>
                      </td>
                      <td className="block min-w-0 break-words py-2 sm:table-cell sm:px-5 sm:py-4"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">Tab switches</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs tabular-nums ${s.tabSwitchCount >= s.maxTabSwitches ? 'text-destructive font-semibold' : ''}`}>
                            {s.tabSwitchCount}/{s.maxTabSwitches}
                          </span>
                          <input type="number" value={s.maxTabSwitches} onChange={e => updateMaxTabs(s.id, Number(e.target.value))}
                            className="w-14 h-7 px-2 text-xs rounded border bg-background" min={1} />
                        </div>
                      </td>
                      <td className="block min-w-0 break-words py-2 sm:table-cell sm:px-5 sm:py-4"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">Actions</span>
                        <div className="flex flex-wrap items-center gap-1">
                          <button onClick={() => copyLoginLink(s)} title="Copy login link + credentials to share"
                            className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors">
                            <LinkIcon className="w-3.5 h-3.5 text-primary" />
                          </button>
                          <button onClick={() => setEditing(s)} title="Edit details"
                            className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                            <Pencil className="w-3.5 h-3.5 text-foreground" />
                          </button>
                          <button onClick={() => resetAccess(s.id)} title="Full reset — clear submissions + let them retake"
                            className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors">
                            <RotateCcw className="w-3.5 h-3.5 text-primary" />
                          </button>
                          <button onClick={() => allowRestart(s.id)} title="Allow restart after tab-switch lockout (keep submissions)"
                            className="p-1.5 hover:bg-warning/10 rounded-lg transition-colors">
                            <Play className="w-3.5 h-3.5 text-warning" />
                          </button>
                          <button onClick={() => toggleBlock(s.id)} title={s.isBlocked ? 'Unblock' : 'Block'}
                            className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors">
                            {s.isBlocked ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Ban className="w-3.5 h-3.5 text-destructive" />}
                          </button>
                          <button onClick={() => deleteStudent(s.id)} title="Delete"
                            className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors">
                            <X className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No students yet. Add your first one or upload a CSV.</p>
          </div>
        )}

        {editing && (
          <EditStudentDialog
            student={editing}
            onClose={() => setEditing(null)}
            onSave={async (updates) => {
              setStudents(prev => prev.map(s => s.id === editing.id ? { ...s, ...updates } : s));
            }}
          />
        )}
        {viewingTests && (
          <StudentTestsDialog student={viewingTests} onClose={() => setViewingTests(null)} />
        )}
      </div>
    </AdminLayout>
  );
}
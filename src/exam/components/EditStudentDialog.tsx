// @ts-nocheck
import { useState } from 'react';
import { Student } from '@/exam/types';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  student: Student;
  onSave: (updates: Partial<Student>) => Promise<void> | void;
  onClose: () => void;
}

export default function EditStudentDialog({ student, onSave, onClose }: Props) {
  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  const [password, setPassword] = useState(student.password);
  const [maxTabs, setMaxTabs] = useState(student.maxTabSwitches);
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('All fields are required'); return;
    }
    setBusy(true);
    try {
      await onSave({ name: name.trim(), email: email.trim(), password: password.trim(), maxTabSwitches: maxTabs });
      toast.success('Student updated');
      onClose();
    } catch (e: any) { toast.error(e.message || 'Update failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Edit Student</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Max Tab Switches</label>
            <input type="number" value={maxTabs} onChange={e => setMaxTabs(Number(e.target.value))} min={1}
              className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} disabled={busy}
              className="flex-1 h-10 bg-muted rounded-lg font-medium text-sm hover:bg-muted/80">Cancel</button>
            <button onClick={handleSave} disabled={busy}
              className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50">
              {busy ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

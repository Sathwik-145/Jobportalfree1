// @ts-nocheck
import ExamBrandName from '@/components/ExamBrandName';
import { Link } from '@/lib/router-compat';
import AdminLayout from '@/exam/components/AdminLayout';
import { useAuth } from '@/exam/contexts/ExamAuthContext';
import { FileCode2, Users, AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react';

export default function AdminDashboard() {
  const { questions, students, exams } = useAuth();
  
  const activeExams = students.filter(s => s.examStatus === 'in_progress').length;
  const terminated = students.filter(s => s.examStatus === 'terminated').length;
  const activeTests = exams.filter(e => e.status === 'active').length;

  const stats = [
    { label: 'Total Questions', value: questions.length, icon: FileCode2, color: 'text-primary' },
    { label: 'Total Students', value: students.length, icon: Users, color: 'text-foreground' },
    { label: 'Active Tests', value: activeTests, icon: ClipboardList, color: 'text-primary' },
    { label: 'Active Exams', value: activeExams, icon: CheckCircle2, color: 'text-primary' },
    { label: 'Terminated', value: terminated, icon: AlertTriangle, color: 'text-destructive' },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <header className="portal-banner mb-8 rounded-2xl bg-primary bg-gradient-to-br from-primary via-primary to-primary/75 p-6 sm:p-8 text-primary-foreground shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground/75"><ExamBrandName /> · Admin workspace</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Welcome back, Admin</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-primary-foreground/80">Your assessment command center. Manage tests, support students, and keep every exam on track.</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-medium"><CheckCircle2 className="h-4 w-4" /> {activeTests} active tests · {activeExams} exams in progress</span>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {stats.map(stat => (
            <div key={stat.label} className="bg-card border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <span className="rounded-xl bg-accent p-2.5 text-accent-foreground"><stat.icon className="w-5 h-5" /></span>
              </div>
              <p className="text-3xl font-bold tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>

        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Quick actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[{ title: 'Manage tests', detail: 'Create and schedule assessments', to: 'tests', icon: ClipboardList }, { title: 'Manage students', detail: 'Credentials and exam access', to: 'students', icon: Users }, { title: 'Student reports', detail: 'Review and share results', to: 'reports', icon: FileCode2 }, { title: 'Live proctoring', detail: 'Monitor exam sessions', to: 'proctoring', icon: CheckCircle2 }].map(action => (
              <Link key={action.to} to={`/exam-admin/${action.to}`} className="group flex min-w-0 items-center gap-3 rounded-2xl border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:bg-accent/30">
                <span className="rounded-xl bg-accent p-3 text-accent-foreground"><action.icon className="h-5 w-5" /></span>
                <div className="min-w-0"><p className="text-sm font-semibold group-hover:text-primary">{action.title}</p><p className="mt-1 text-xs text-muted-foreground">{action.detail}</p></div>
              </Link>
            ))}
          </div>
        </section>
        {students.length > 0 && (
          <div className="bg-card border rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold mb-4">Recent Students</h2>
            <div className="space-y-3">
              {students.slice(0, 5).map(student => (
                <div key={student.id} className="flex flex-wrap items-center justify-between gap-3 py-3 border-b last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground break-all">{student.email}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    student.examStatus === 'completed' ? 'bg-primary/10 text-primary' :
                    student.examStatus === 'terminated' ? 'bg-destructive/10 text-destructive' :
                    student.examStatus === 'in_progress' ? 'bg-warning/10 text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {student.examStatus.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

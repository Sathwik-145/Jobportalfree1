import { useEffect, useState } from 'react';
import { Eye, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { fetchKey, saveKey } from '@/exam/lib/codexamSettings';
import { buildReportPdf } from '@/exam/lib/resultReport';
import { REPORT_LAYOUTS, REPORT_LAYOUT_KEY, validReportLayout, type ReportLayout } from '@/exam/lib/reportLayouts';
import { toast } from 'sonner';
export default function ReportLayoutPicker() {
  const [selected, setSelected] = useState<ReportLayout>('classic');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => { fetchKey(REPORT_LAYOUT_KEY, 'classic').then(v => setSelected(validReportLayout(v))); }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const view = async (layout: ReportLayout) => {
    setLoading(true);
    try {
      const doc = await buildReportPdf({ layout, student: { name: 'Sample Student', tabSwitchCount: 0 } as any, exam: { title: 'Sample Assessment' } as any, mcqs: [{ id: 'preview', question: 'Which protocol secures web traffic?', options: ['HTTP', 'HTTPS', 'FTP', 'SMTP'], correctIndex: 1, marks: 10 } as any], mcqSubs: [{ mcqId: 'preview', selectedIndex: 1, isCorrect: true, marksAwarded: 10 } as any] });
      setPreview(URL.createObjectURL(doc.output('blob')));
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not preview PDF'); }
    setLoading(false);
  };
  const choose = async (id: ReportLayout) => { try { await saveKey(REPORT_LAYOUT_KEY, id); setSelected(id); toast.success('PDF layout saved for downloads and report emails'); } catch { toast.error('Could not save PDF layout'); } };
  return <section className="border-b border-border pb-5 mb-5"><h2 className="font-semibold mb-3">Report PDF layout</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{REPORT_LAYOUTS.map(x => <article key={x.id} className="rounded-lg border border-border bg-card p-4"><div className="mb-3 h-2 rounded-full" style={{ background: `linear-gradient(90deg, rgb(${x.colors.dark.join(",")}), rgb(${x.colors.accent.join(",")}), rgb(${x.colors.light.join(",")}))` }} /><h3 className="font-medium">{x.name}</h3><p className="text-xs text-muted-foreground min-h-10 mt-1">{x.description}</p><div className="flex flex-wrap gap-2 mt-3"><Button size="sm" variant="outline" disabled={loading} onClick={() => view(x.id)}><Eye className="h-4 w-4" />Preview</Button><Button size="sm" variant={selected === x.id ? 'default' : 'outline'} onClick={() => choose(x.id)}>{selected === x.id && <Check className="h-4 w-4" />}{selected === x.id ? 'Selected' : 'Use layout'}</Button></div></article>)}</div><Dialog open={!!preview} onOpenChange={open => { if (!open) setPreview(''); }}><DialogContent className="max-w-4xl"><DialogTitle>Report PDF preview</DialogTitle><iframe title="Report PDF preview" src={preview} className="w-full h-[65vh] border rounded-md" /></DialogContent></Dialog></section>;
}
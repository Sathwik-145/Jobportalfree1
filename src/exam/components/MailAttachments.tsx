import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateMailAttachments, type MailAttachment } from '@/exam/lib/mailAttachments';

export default function MailAttachments({ value, onChange }: { value: MailAttachment[]; onChange: (items: MailAttachment[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const add = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true); setError('');
    try {
      const next = [...value];
      for (const file of Array.from(files)) {
        if (file.size > 1024 * 1024) throw new Error('Each image must be 1 MB or smaller');
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
          reader.onerror = () => reject(new Error('Could not read image'));
          reader.readAsDataURL(file);
        });
        next.push({ name: file.name, type: file.type as MailAttachment['type'], data });
      }
      onChange(validateMailAttachments(next));
    } catch (e) { setError(e instanceof Error ? e.message : 'Choose up to 3 JPG, PNG, GIF or WebP images'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  return <div className="space-y-2">
    <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" aria-label="Email image attachments" className="hidden" onChange={e => void add(e.target.files)} />
    <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()} disabled={busy || value.length >= 3}><ImagePlus className="h-4 w-4" />{busy ? 'Adding images…' : 'Attach images'}</Button>
    <span className="ml-2 text-xs text-muted-foreground">Up to 3 images · 1 MB each</span>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-3">{value.map((item, i) => <div key={`${item.name}-${i}`} className="flex items-center gap-2 border rounded-lg p-2 max-w-full">
      <img src={`data:${item.type};base64,${item.data}`} alt={item.name} className="w-12 h-12 object-cover rounded" />
      <span className="text-xs break-all">{item.name}</span>
      <Button type="button" size="icon" variant="ghost" aria-label={`Remove ${item.name}`} onClick={() => onChange(value.filter((_, n) => n !== i))}><X className="w-4 h-4" /></Button>
    </div>)}</div>
  </div>;
}
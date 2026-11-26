import { useState } from 'react';
import { Copy, ImagePlus, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MAIL_IMAGES, resolveMailImageUrl } from '@/exam/lib/mailImages';

export default function MailImagePicker({ onInsert }: { onInsert: (url: string, alt: string) => void }) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [failed, setFailed] = useState(false);
  const url = resolveMailImageUrl(address);
  const insert = (src: string, alt: string) => { onInsert(src, alt); setOpen(false); };
  const copy = async (src: string) => {
    try { await navigator.clipboard.writeText(src); toast.success('Picture address copied'); }
    catch { toast.error('Could not copy — select the address below the picture.'); }
  };
  return <>
    <Button type="button" variant="outline" size="sm" title="Choose an email picture" aria-label="Insert picture" onClick={() => setOpen(true)}><ImageIcon /> Picture</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[85dvh] overflow-y-auto w-[calc(100%-2rem)]">
        <DialogHeader><DialogTitle>Email pictures</DialogTitle><DialogDescription>Logo, welcome, assessment, interview, congratulations and reminder.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MAIL_IMAGES.map(image => <div key={image.id} className="min-w-0 rounded-lg border overflow-hidden">
            <img src={image.url} alt={image.name} loading="lazy" width={600} height={360} className="w-full h-32 object-contain bg-muted" />
            <div className="p-3 space-y-2">
              <p className="text-sm font-medium">{image.name}</p>
              <input readOnly aria-label={`${image.name} address`} value={image.url} onFocus={e => e.target.select()} className="w-full min-w-0 rounded-md border bg-background p-1.5 text-xs text-muted-foreground" />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => insert(image.url, image.name)} aria-label={`Insert ${image.name}`}><ImagePlus /> Insert</Button>
                <Button type="button" size="icon" variant="outline" title={`Copy ${image.name} address`} aria-label={`Copy ${image.name} address`} onClick={() => void copy(image.url)}><Copy /></Button>
              </div>
            </div>
          </div>)}
        </div>
        <div className="space-y-2 border-t pt-4">
          <Label htmlFor="mail-picture-address">Other picture address</Label>
          <Input id="mail-picture-address" placeholder="https://example.com/picture.jpg" value={address} onChange={e => { setAddress(e.target.value); setFailed(false); }} />
          {address && !url && <p role="alert" className="text-sm text-destructive">Use a public HTTPS picture address.</p>}
          {url && !failed && <img key={url} src={url} alt="Custom email picture" className="max-h-40 max-w-full object-contain" onError={() => setFailed(true)} />}
          {failed && <p role="alert" className="text-sm text-destructive">This address did not load a picture. Use a direct image link, not a webpage or private file.</p>}
          <Button type="button" size="sm" disabled={!url || failed} onClick={() => { if (url) insert(url, 'Picture'); }}><ImagePlus /> Insert custom picture</Button>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
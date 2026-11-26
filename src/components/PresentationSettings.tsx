import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { defaultBranding, defaultContacts, safeLink, savePresentation, usePresentation } from '@/lib/portalPresentation';
import { toast } from 'sonner';

export default function PresentationSettings({ exam = false }: { exam?: boolean }) {
  const key = exam ? 'exam_branding' : 'job_branding';
  const stored = usePresentation(key, defaultBranding(exam));
  const contacts = usePresentation('public_contacts', defaultContacts);
  const [branding, setBranding] = useState(stored);
  const [contact, setContact] = useState(contacts);
  const [busy, setBusy] = useState(false);
  useEffect(() => setBranding(stored), [stored]);
  useEffect(() => setContact(contacts), [contacts]);
  const save = async () => {
    if (!branding.title.trim()) { toast.error('Enter a browser tab title'); return; }
    if (branding.icon && !/^(https?:\/\/|data:image\/|\/)/i.test(branding.icon)) { toast.error('Choose an image or enter an HTTPS image URL'); return; }
    if (!exam && contact.links.some(l => !l.name.trim() || !safeLink(l.url))) { toast.error('Each link needs a name and a valid HTTP, email or phone URL'); return; }
    setBusy(true);
    try { await savePresentation(key, branding); if (!exam) await savePresentation('public_contacts', contact); toast.success('Branding and contact settings saved'); }
    catch { toast.error('Could not save settings. Please try again.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-5 rounded-2xl border bg-card p-5 text-card-foreground">
    <h3 className="text-lg font-semibold">Branding{!exam && ' & contact links'}</h3>
    {exam && <label className="block space-y-2"><span>Exam portal name</span><Input maxLength={60} value={branding.name || 'CodeXam'} onChange={e => setBranding({ ...branding, name: e.target.value })} /><Button type="button" variant="outline" size="sm" onClick={() => setBranding({ ...branding, name: 'CodeXam', title: defaultBranding(true).title })}>Restore default name</Button></label>}
    <label className="block space-y-2"><span>Browser tab title</span><Input value={branding.title} onChange={e => setBranding({ ...branding, title: e.target.value })} /></label>
    <label className="block space-y-2"><span>Tab icon image URL</span><Input value={branding.icon} onChange={e => setBranding({ ...branding, icon: e.target.value })} /></label>
    <label className="block space-y-2"><span>Upload tab icon (up to 256 KB)</span><Input type="file" accept="image/*" onChange={e => {
      const file = e.target.files?.[0]; if (!file) return;
      if (!file.type.startsWith('image/') || file.size > 256 * 1024) { toast.error('Choose an image smaller than 256 KB'); return; }
      const reader = new FileReader(); reader.onload = () => setBranding(b => ({ ...b, icon: String(reader.result) })); reader.readAsDataURL(file);
    }} /></label>
    <div className="flex items-center gap-2 rounded-lg border bg-muted p-3" aria-label="Browser tab preview">{branding.icon && <img src={branding.icon} alt="Tab icon preview" className="h-5 w-5 object-contain" />}<span className="truncate">{branding.title || 'Tab title preview'}</span></div>
    <Button variant="outline" onClick={() => setBranding(defaultBranding(exam))}>Reset branding to defaults</Button>
    {!exam && <div className="space-y-4 border-t pt-4">
      <h4 className="font-semibold">Public contact details</h4>
      <label className="block space-y-2"><span>Contact email</span><Input type="email" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} /></label>
      <label className="block space-y-2"><span>Phone numbers (one per line)</span><textarea className="w-full rounded-md border bg-background p-2 text-foreground" value={contact.phones.join('\n')} onChange={e => setContact({ ...contact, phones: e.target.value.split('\n') })} /></label>
      {contact.links.map((link, index) => <div key={index} className="space-y-2 rounded-lg border p-3">
        {(['name', 'handle', 'url'] as const).map(field => <label key={field} className="block space-y-1"><span>{field === 'name' ? 'Display name' : field === 'handle' ? 'Handle / description' : 'URL'}</span><Input value={link[field]} onChange={e => setContact({ ...contact, links: contact.links.map((l, i) => i === index ? { ...l, [field]: e.target.value } : l) })} /></label>)}
        <Button variant="outline" onClick={() => setContact({ ...contact, links: contact.links.filter((_, i) => i !== index) })}>Remove link</Button>
      </div>)}
      <Button variant="outline" onClick={() => setContact({ ...contact, links: [...contact.links, { name: '', handle: '', url: '' }] })}>Add link</Button>
    </div>}
    <div><Button disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save branding' + (!exam ? ' & contacts' : '')}</Button></div>
  </section>;
}

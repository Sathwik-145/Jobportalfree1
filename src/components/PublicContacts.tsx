import { defaultContacts, safeLink, usePresentation } from '@/lib/portalPresentation';
export default function PublicContacts() {
  const contacts = usePresentation('public_contacts', defaultContacts);
  return <div className="space-y-3 text-sm">
    {contacts.links.map((link, i) => <a key={i} href={safeLink(link.url)} target="_blank" rel="noopener noreferrer" className="block rounded-lg bg-primary/5 p-2 text-foreground hover:bg-primary/10"><span className="font-medium">{link.name}</span>{link.handle && <span className="block text-xs text-muted-foreground">{link.handle}</span>}</a>)}
    {contacts.email && <a className="block break-all text-muted-foreground hover:text-foreground" href={`mailto:${contacts.email}`}>{contacts.email}</a>}
    {contacts.phones.filter(p => p.trim()).map((phone, i) => <a key={i} className="block text-muted-foreground hover:text-foreground" href={`tel:${phone.replace(/[^+\d]/g, '')}`}>{phone}</a>)}
  </div>;
}

import { z } from 'zod';

const address = z.string().email().max(254);
export type OutgoingMail = {
  from?: string; to: string; subject: string; text: string; html: string;
  attachments?: { filename: string; content: string; contentType?: string }[];
};

/** One provider for every mail path. No Gmail fallback or automatic replay of rejected mail. */
export function createBrevoTransport(senderEmail: string, senderName: string) {
  const key = process.env['BREVO_API_KEY'];
  if (!key) throw new Error('Brevo is not configured. Add BREVO_API_KEY to the server environment.');
  const sender = { email: address.parse(senderEmail), name: senderName.replace(/[<>\r\n]/g, '').slice(0, 60) };
  return {
    async sendMail(mail: OutgoingMail) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': key, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          sender, to: [{ email: address.parse(mail.to) }],
          subject: z.string().min(1).max(500).parse(mail.subject.replace(/[\r\n]/g, ' ')),
          textContent: mail.text, htmlContent: mail.html,
          ...(mail.attachments?.length ? { attachment: mail.attachments.map(a => ({ name: a.filename, content: a.content })) } : {}),
        }),
      });
      if (!response.ok) {
        const raw = await response.text();
        let detail = 'Brevo could not accept this email.';
        try { const value = JSON.parse(raw); if (typeof value.message === 'string') detail = value.message; } catch {}
        // Do not replay quota, complaint, suppression or authentication failures.
        throw new Error(`Brevo [${response.status}]: ${detail}`);
      }
      return await response.json() as { messageId: string };
    },
    close() {},
  };
}
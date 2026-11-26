import { z } from 'zod';

export const mailAttachmentSchema = z.object({
  name: z.string().min(1).max(120).regex(/^[^\r\n/\\]+$/),
  type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']),
  data: z.string().min(4).max(5600000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
});
export const mailAttachmentsSchema = z.array(mailAttachmentSchema).max(4).default([]);
export type MailAttachment = z.infer<typeof mailAttachmentSchema>;

export function validateMailAttachments(value: unknown): MailAttachment[] {
  const attachments = mailAttachmentsSchema.parse(value ?? []);
  for (const item of attachments) {
    const bytes = atob(item.data);
    if (item.type === 'application/pdf') {
      if (bytes.length > 4 * 1024 * 1024) throw new Error('Each PDF must be 4 MB or smaller');
      if (!bytes.startsWith('%PDF')) throw new Error('The PDF contents are not valid');
      continue;
    }
    if (bytes.length > 1024 * 1024) throw new Error('Each image must be 1 MB or smaller');
    const valid = item.type === 'image/png' ? bytes.startsWith('\x89PNG\r\n\x1a\n')
      : item.type === 'image/jpeg' ? bytes.startsWith('\xff\xd8\xff')
      : item.type === 'image/gif' ? /^GIF8[79]a/.test(bytes)
      : bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP';
    if (!valid) throw new Error('The image contents do not match its file type');
  }
  return attachments;
}
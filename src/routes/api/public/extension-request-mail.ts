import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { serverDb, getSetting, sendGenericMails } from '@/lib/credential-mailer.server';

const schema = z.object({ studentId: z.string().min(1).max(128), examId: z.string().min(1).max(128), at: z.string().datetime().max(40) }).strict();
const rowSchema = z.object({ sid: z.string().max(128), eid: z.string().max(128), at: z.string().datetime(), name: z.string().max(200), exam: z.string().max(300), reason: z.string().max(300), status: z.literal('pending') });
// In-flight lock complements the durable, unique per-request claim across server instances.
const inFlight = new Set<string>();
export const Route = createFileRoute('/api/public/extension-request-mail')({
  server: { handlers: { POST: async ({ request }) => {
    let input: z.infer<typeof schema>;
    try {
      const text = await request.text();
      if (text.length > 2048) return Response.json({ error: 'Payload too large' }, { status: 413 });
      input = schema.parse(JSON.parse(text));
    } catch { return Response.json({ error: 'Invalid request' }, { status: 400 }); }
    const age = Date.now() - Date.parse(input.at);
    if (age < 0 || age > 5 * 60 * 1000) return Response.json({ error: 'Request must be created within the last 5 minutes' }, { status: 400 });
    const key = `extension_mail:${input.studentId}:${input.examId}:${input.at}`;
    if (inFlight.has(key)) return Response.json({ error: 'Notification already claimed' }, { status: 429 });
    inFlight.add(key);
    try {
      const db = serverDb();
      const settings = await getSetting(db, 'extension_requests', { enabled: true });
      if (!settings.enabled) return Response.json({ error: 'Extension requests disabled' }, { status: 403 });
      const { data, error } = await db.from('codexam_settings').select('value').eq('key', 'slot_extension_requests').maybeSingle();
      if (error) throw error;
      const rows = Array.isArray(data?.value) ? data.value : [];
      const parsed = rowSchema.safeParse(rows.find((r: any) => r.sid === input.studentId && r.eid === input.examId && r.at === input.at));
      if (!parsed.success) return Response.json({ error: 'Pending request not found' }, { status: 404 });
      const { error: claimError } = await db.from('codexam_settings').insert({ key, value: { claimedAt: new Date().toISOString() }, updated_at: new Date().toISOString() });
      if (claimError) {
        if (claimError.code === '23505') return Response.json({ error: 'Notification already claimed' }, { status: 429 });
        throw claimError;
      }
      const general = await getSetting(db, 'general', { supportEmail: '' });
      const mailer = await getSetting(db, 'mailer', { senderName: 'CodeXam' });
      const emails = new Set(['jobportalfreeofficial@gmail.com']);
      const support = z.string().trim().email().max(254).safeParse(general.supportEmail);
      if (support.success) emails.add(support.data.toLowerCase());
      const row = parsed.data;
      const result = await sendGenericMails({ db, recipients: [...emails].map(email => ({ email })), senderName: mailer.senderName || 'CodeXam', subject: 'CodeXam: new extension request', body: `A student requested an exam extension.\n\nStudent: ${row.name}\nExam: ${row.exam}\nReason: ${row.reason || 'Not provided'}\nSubmitted: ${row.at}\n\nReview in CodeXam Admin → Notifications (/exam-admin/notifications).`, source: 'extension-request' });
      if (result.failed.length) return Response.json({ error: 'Email delivery incomplete' }, { status: 502 });
      return Response.json({ sent: result.sent });
    } catch (error) {
      console.error('Extension request notification failed', error);
      return Response.json({ error: 'Could not send notification' }, { status: 500 });
    } finally { inFlight.delete(key); }
  } } },
});

import { createClient } from '@supabase/supabase-js';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { serverDb, getSetting, putSetting, sendGenericMails } from '@/lib/credential-mailer.server';
import { SYSTEM_TEMPLATES_KEY, resolveTemplate } from '@/lib/system-mail-templates';
import { ADMIN_EVENTS as EVENTS, adminEventEnabled } from '@/lib/admin-events';
import { databaseUrl, databaseKey } from "@/lib/database-target";

// Tells the admin (jobportalfreeofficial@gmail.com + support email) when a visitor does something.
// One mail per event + person per hour (durable claim row) so it cannot be used to spam the inbox.
const clean = (v: unknown, n = 200) => String(v ?? '').replace(/[\[\]<>]/g, '').slice(0, n).trim();
const schema = z.object({
  event: z.enum(Object.keys(EVENTS) as [keyof typeof EVENTS, ...(keyof typeof EVENTS)[]]),
  name: z.string().max(200).optional(), email: z.string().max(254).optional(),
  studentId: z.string().max(128).optional(), examId: z.string().max(128).optional(),
  eventId: z.string().max(128).optional(),
  detail: z.string().max(500).optional(),
});

export const Route = createFileRoute('/api/public/notify-admin')({
  server: { handlers: { POST: async ({ request }) => {
    let input: z.infer<typeof schema>;
    try { const t = await request.text(); if (t.length > 4000) throw 0; input = schema.parse(JSON.parse(t)); }
    catch { return Response.json({ error: 'Invalid request' }, { status: 400 }); }
    try {
      const db = serverDb();
      const prefs = await getSetting<Record<string, boolean>>(db, 'admin_notify', {});
      let name = '', email = '', extra = '', eventKey = '';
      const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
      const auth = token ? await db.auth.getUser(token) : null;
      const account = auth?.data.user;
      if (input.event === 'admin_login') {
        if (!account) return Response.json({ error: 'Sign in required' }, { status: 401 });
        // Check the role as the signed-in user (role rows are private to their owner).
        const asUser = createClient(databaseUrl(), databaseKey(), { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
        const [isAdmin, isSub] = await Promise.all([
          asUser.rpc('has_role', { _user_id: account.id, _role: 'admin' }),
          asUser.rpc('has_role', { _user_id: account.id, _role: 'subadmin' }),
        ]);
        if (isAdmin.data !== true && isSub.data !== true) return Response.json({ error: 'Not an admin' }, { status: 403 });
        name = clean(account.user_metadata?.full_name); email = account.email || '';
        eventKey = `${account.id}:${clean(input.eventId, 64) || Date.now()}`;
        extra = `Device: ${clean(input.detail, 120)}`;
      } else if (['user_registered', 'user_login', 'job_application', 'user_message'].includes(input.event)) {
        if (!account) return Response.json({ error: 'Sign in required' }, { status: 401 });
        name = clean(account.user_metadata?.full_name); email = account.email || '';
        eventKey = input.event === 'user_login' ? `${account.id}:${new Date().toISOString().slice(0, 10)}` : account.id;
        if (input.event === 'job_application' || input.event === 'user_message') {
          if (!input.eventId) return Response.json({ error: 'Saved event required' }, { status: 400 });
          const table = input.event === 'job_application' ? 'applications' : 'contact_messages';
          const owner = input.event === 'job_application' ? 'user_id' : 'sender_id';
          const { data: row } = await db.from(table).select('*').eq('id', input.eventId).eq(owner, account.id).maybeSingle();
          if (!row) return Response.json({ error: 'Saved event not found' }, { status: 404 });
          extra = input.event === 'user_message' ? `Subject: ${clean(row.subject)}` : `Job reference: ${clean(row.job_id)}`;
          eventKey = input.eventId;
        }
      } else if (['registration', 'link_registration', 'quick_signup'].includes(input.event)) {
        if (!input.eventId) return Response.json({ error: 'Saved registration required' }, { status: 400 });
        const column = input.event === 'link_registration' ? 'client_id' : 'id';
        const { data: row } = await db.from('registrations').select('id,name,email,notes,created_at').eq(column, input.eventId).maybeSingle();
        if (!row) return Response.json({ error: 'Saved registration not found' }, { status: 404 });
        name = clean(row.name); email = clean(row.email, 254); extra = clean(row.notes, 500); eventKey = String(row.id);
      } else if (input.event === 'reevaluation') {
        const { data: row } = await db.from('reevaluation_requests').select('*').eq('id', input.eventId || '').maybeSingle();
        if (!row) return Response.json({ error: 'Saved request not found' }, { status: 404 });
        name = clean(row.student_name); extra = `Reason: ${clean(row.reason, 500)}`; eventKey = String(row.id);
      }
      if (input.event === 'exam_started') {
        const { data: st } = await db.from('students').select('name,email').eq('id', input.studentId || '').maybeSingle();
        if (!st) return Response.json({ error: 'Unknown student' }, { status: 404 });
        const { data: ex } = await db.from('exams').select('title').eq('id', input.examId || '').maybeSingle();
        if (!ex) return Response.json({ error: 'Unknown test' }, { status: 404 });
        name = st.name; email = st.email;
        // One start alert per student, test and day.
        eventKey = `${input.studentId}:${input.examId}:${new Date().toISOString().slice(0, 10)}`;
        extra = `Test: ${ex.title || input.examId} · Started: ${new Date().toUTCString()}`;
      }
      if (input.event === 'test_submitted') {
        const { data: st } = await db.from('students').select('name,email').eq('id', input.studentId || '').maybeSingle();
        if (!st) return Response.json({ error: 'Unknown student' }, { status: 404 });
        name = st.name; email = st.email;
        const { data: ex } = await db.from('exams').select('title').eq('id', input.examId || '').maybeSingle();
        if (!ex) return Response.json({ error: 'Unknown test' }, { status: 404 });
        const submissions = await Promise.all(['mcq_submissions', 'writing_submissions', 'fib_submissions'].map(table => db.from(table).select('id').eq('student_id', input.studentId || '').eq('exam_id', input.examId || '').limit(1)));
        const { data: examQuestions } = await db.from('exams').select('question_ids').eq('id', input.examId || '').maybeSingle();
        const coding = examQuestions?.question_ids?.length ? await db.from('submissions').select('id').eq('student_id', input.studentId || '').in('question_id', examQuestions.question_ids).limit(1) : { data: [] };
        if (!submissions.some(r => r.data?.length) && !coding.data?.length) return Response.json({ error: 'No saved submission' }, { status: 409 });
        await putSetting(db, `exam_completed:${input.studentId}:${input.examId}`, { studentId: input.studentId, examId: input.examId, at: new Date().toISOString() });
        eventKey = `${input.studentId}:${input.examId}`;
        extra = `Test: ${ex?.title || input.examId}`;
      }
      if (!eventKey) return Response.json({ error: 'Saved event required' }, { status: 400 });
      if (!adminEventEnabled(prefs, input.event)) return Response.json({ sent: 0, reason: 'off' });
      const key = `admin_notify:${input.event}:${eventKey}`;
      const { error: claim } = await db.from('codexam_settings').insert({ key, value: { at: new Date().toISOString() }, updated_at: new Date().toISOString() });
      if (claim) return Response.json({ sent: 0, reason: 'already notified' });
      const ev = EVENTS[input.event];
      const general = await getSetting<any>(db, 'general', {});
      const mailer = await getSetting<any>(db, 'mailer', {});
      const brand = (await getSetting<any>(db, 'exam_branding', {}))?.name || 'CodeXam';
      const emails = new Set(['jobportalfreeofficial@gmail.com']);
      const sup = z.string().email().safeParse(general?.supportEmail);
      if (sup.success) emails.add(sup.data.toLowerCase());
      // Extra recipients chosen by the admin: for every alert, or only for this alert.
      const routes = await getSetting<{ all?: string[]; events?: Record<string, string[]> }>(db, 'admin_notify_recipients', {});
      for (const e of [...(routes?.all || []), ...(routes?.events?.[input.event] || [])]) {
        const ok = z.string().email().safeParse(e); if (ok.success) emails.add(ok.data.toLowerCase());
      }
      const origin = new URL(request.url).origin;
      const tpl = resolveTemplate(await getSetting<any>(db, SYSTEM_TEMPLATES_KEY, {}), 'admin_alert');
      const details = [extra, input.detail ? clean(input.detail, 500) : ''].filter(Boolean).join(' · ') || '—';
      const vars = { brand, who: name || email || 'Someone', action: ev.title, name: name || '—', email: email || '—', details, time: new Date().toUTCString(), link: `${origin}${ev.where}` };
      const r = await sendGenericMails({ db, recipients: [...emails].map((e) => ({ email: e })), senderName: mailer?.senderName || brand, subject: tpl.subject, body: tpl.body, vars, source: `notify-${input.event}` });
      if (!r.sent) await db.from('codexam_settings').delete().eq('key', key);
      return Response.json({ sent: r.sent });
    } catch (e) {
      console.error('notify-admin failed', e);
      return Response.json({ sent: 0, error: 'Could not notify' });
    }
  } } },
});

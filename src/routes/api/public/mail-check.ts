import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { mailAdminDb } from '@/lib/mail-auth.server';
import { createBrevoTransport } from '@/lib/brevo-mail.server';
import { getSetting } from '@/lib/credential-mailer.server';
import { databaseUrl, databaseKey, databaseServiceKey } from '@/lib/database-target';

/** Admin-only email diagnostics: which settings the server can see (never their values),
 *  whether Brevo accepts the key and sender, and an optional real test email. */
export const Route = createFileRoute('/api/public/mail-check')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const db = await mailAdminDb(request);
        if (!db) return Response.json({ error: 'Admin sign-in required' }, { status: 403 });
        let body: any = {};
        try { body = await request.json(); } catch {}
        const has = (k: string) => !!(process.env[k] && String(process.env[k]).trim());
        const mailer = await getSetting<any>(db, 'mailer', {});
        const sender = (process.env['BREVO_SENDER_EMAIL'] || mailer.senderEmail || 'jobportalfreeofficial@gmail.com').trim();
        const config = {
          BREVO_API_KEY: has('BREVO_API_KEY'),
          BREVO_SENDER_EMAIL: has('BREVO_SENDER_EMAIL'),
          SERVER_KEY: !!databaseServiceKey(),
          CRON_SECRET: has('CRON_SECRET'),
          SUPABASE_URL: !!databaseUrl(),
          SUPABASE_PUBLISHABLE_KEY: !!databaseKey(),
        };
        const problems: string[] = [];
        let account: string | null = null;
        let senderStatus: 'active' | 'inactive' | 'missing' | 'unknown' = 'unknown';
        if (!config.BREVO_API_KEY) problems.push('BREVO_API_KEY is not set on this server. Add it, then redeploy.');
        else {
          const key = String(process.env['BREVO_API_KEY']).trim();
          const headers = { 'api-key': key, Accept: 'application/json' };
          const acc = await fetch('https://api.brevo.com/v3/account', { headers });
          if (!acc.ok) {
            const t = await acc.text();
            let msg = t; try { msg = JSON.parse(t).message || t; } catch {}
            problems.push(`Brevo refused the key [${acc.status}]: ${msg}`);
            if (/ip/i.test(msg)) problems.push('Brevo blocks unknown IP addresses. In Brevo → Settings → Security → Authorised IPs, turn off IP blocking (Cloudflare Workers use changing IPs).');
          } else {
            const a = await acc.json().catch(() => ({}));
            account = a?.email || 'connected';
            const credits = (a?.plan || []).find((p: any) => p?.creditsType === 'sendLimit' || p?.type === 'free');
            if (credits && Number(credits.credits) <= 0) problems.push('Your Brevo plan has no sending credits left today.');
            const sr = await fetch('https://api.brevo.com/v3/senders', { headers });
            if (sr.ok) {
              const s = await sr.json().catch(() => ({}));
              const match = (s?.senders || []).find((x: any) => String(x.email).toLowerCase() === sender.toLowerCase());
              senderStatus = !match ? 'missing' : match.active ? 'active' : 'inactive';
              if (senderStatus === 'missing') problems.push(`${sender} is not added as a sender in Brevo (Brevo → Senders, domains & IPs → Senders).`);
              if (senderStatus === 'inactive') problems.push(`${sender} is added in Brevo but not verified yet. Click the confirmation link Brevo emailed to it.`);
            }
          }
        }

        let test: { ok: boolean; error?: string } | null = null;
        const to = z.string().email().max(254).safeParse(String(body?.to || '').trim());
        if (body?.to && !to.success) test = { ok: false, error: 'That test address is not a valid email.' };
        else if (to.success && config.BREVO_API_KEY) {
          try {
            await createBrevoTransport(sender, 'JobPortalFree').sendMail({
              to: to.data, subject: 'Test email from your portal',
              text: 'This is a test email. If you can read it, sending works.',
              html: '<p>This is a test email. If you can read it, sending works.</p>',
            });
            test = { ok: true };
          } catch (e: any) { test = { ok: false, error: String(e?.message || e) }; }
        }
        return Response.json({ config, sender, senderStatus, account, problems, test });
      },
    },
  },
});

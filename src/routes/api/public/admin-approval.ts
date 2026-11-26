import { createFileRoute } from '@tanstack/react-router';

const noStore = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
function approvalPage(token: string, message?: string) {
  const valid = /^[0-9a-f-]{72}$/i.test(token);
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin sign-in approval | JobPortalFree</title></head><body><main><h1>Admin sign-in approval</h1><p>${message || 'Approve only if you recognise the admin sign-in. Opening this page does not approve it.'}</p>${!message && valid ? `<form method="post"><input type="hidden" name="token" value="${token}"><button name="decision" value="approved">Approve sign-in</button> <button name="decision" value="denied">Deny sign-in</button></form>` : ''}</main></body></html>`;
  return new Response(html, { headers: { ...noStore, 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" } });
}
export const Route = createFileRoute('/api/public/admin-approval')({
  server: { handlers: {
    GET: async ({ request }) => {
      const url = new URL(request.url);
      if (url.searchParams.has('token')) return approvalPage(url.searchParams.get('token') || '');
      try { const { readApproval } = await import('@/lib/admin-approval.server'); return Response.json(await readApproval(request), { headers: noStore }); }
      catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Could not check approval' }, { status: 403, headers: noStore }); }
    },
    POST: async ({ request }) => {
      try {
        if (request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
          const form = await request.formData();
          const token = String(form.get('token') || '');
          const decision = form.get('decision');
          if (decision !== 'approved' && decision !== 'denied') throw new Error('Invalid decision');
          const { decideApproval } = await import('@/lib/admin-approval.server');
          await decideApproval(token, decision);
          return approvalPage('', decision === 'approved' ? 'Sign-in approved. Return to the original sign-in tab.' : 'Sign-in denied. Admin access remains blocked.');
        }
        const input = await request.json() as { action?: string; enabled?: boolean; id?: string; decision?: string };
        const helpers = await import('@/lib/admin-approval.server');
        if (input.action === 'settings' && typeof input.enabled === 'boolean') return Response.json(await helpers.saveApprovalSettings(request, input.enabled), { headers: noStore });
        if (input.action === 'list') return Response.json(await helpers.listPending(request), { headers: noStore });
        if (input.action === 'decide' && (input.decision === 'approved' || input.decision === 'denied')) return Response.json(await helpers.decideById(request, String(input.id || ''), input.decision), { headers: noStore });
        if (input.action !== 'request') throw new Error('Invalid request');
        return Response.json(await helpers.requestApproval(request), { headers: noStore });
      } catch (error) {
        return Response.json({ error: error instanceof Error ? error.message : 'Could not process approval' }, { status: 400, headers: noStore });
      }
    },
  } },
});
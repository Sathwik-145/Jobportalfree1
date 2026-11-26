import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const input = z.object({
  candidateIds: z.array(z.string().min(1).max(200)).min(1).max(25),
  password: z.string().min(1).max(200),
});

/**
 * Checks an exam password on the server. The browser only sends the student IDs whose
 * login email matched; passwords never leave the database and are never returned.
 */
export const checkStudentPassword = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }) => {
    const { readPasswords } = await import('./credentialStore');
    // serverDb() follows the active database and uses its server key or the website server header.
    const db: any = (await import('@/lib/credential-mailer.server')).serverDb();
    let passwords: Record<string, string>;
    try { passwords = await readPasswords(db, data.candidateIds); }
    catch { throw new Error('Could not check the password right now'); }
    const pw = data.password.trim();
    const match = Object.entries(passwords).find(([, p]) => String(p ?? '').trim() === pw);
    return { studentId: match?.[0] ?? null };
  });

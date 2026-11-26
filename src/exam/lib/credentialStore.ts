/**
 * Reads and writes student exam passwords.
 * Passwords belong in the staff-only student_credentials table. Databases that have not run
 * database/upgrade-existing-database.sql yet only have the old students.password column, so
 * every call falls back to it when the table is missing instead of failing.
 */
type Db = { from: (table: string) => any };

export function isMissingCredentialTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  if (!e) return false;
  if (e.code === "PGRST205" || e.code === "42P01") return true;
  return /student_credentials/i.test(e.message || "") && /(schema cache|does not exist)/i.test(e.message || "");
}

/** studentId → password. Pass ids to limit the lookup; omit to read all (staff only). */
export async function readPasswords(db: Db, ids?: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (ids && !ids.length) return out;
  let q = db.from("student_credentials").select("student_id,password");
  if (ids) q = q.in("student_id", ids);
  const { data, error } = await q;
  if (!error) {
    for (const r of data || []) out[r.student_id] = r.password || "";
    return out;
  }
  if (!isMissingCredentialTable(error)) return out;
  let legacy = db.from("students").select("id,password");
  if (ids) legacy = legacy.in("id", ids);
  const { data: rows } = await legacy;
  for (const r of rows || []) out[r.id] = r.password || "";
  return out;
}

/** Saves one password. Returns an error message, or null when saved. */
export async function writePassword(db: Db, studentId: string, password: string): Promise<string | null> {
  const pw = (password || "").trim();
  if (!pw) return null;
  const { error } = await db.from("student_credentials").upsert({ student_id: studentId, password: pw, updated_at: new Date().toISOString() });
  if (!error) return null;
  if (isMissingCredentialTable(error)) {
    const { error: legacyErr } = await db.from("students").update({ password: pw }).eq("id", studentId);
    return legacyErr ? legacyErr.message : null;
  }
  // Students may only create their first password (RLS); try insert-only before giving up.
  const { error: firstError } = await db.from("student_credentials").upsert({ student_id: studentId, password: pw }, { ignoreDuplicates: true });
  return firstError ? firstError.message : null;
}

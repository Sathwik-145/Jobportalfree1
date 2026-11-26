import { describe, it, expect } from "vitest";
import { isMissingCredentialTable, readPasswords, writePassword } from "@/exam/lib/credentialStore";

function fakeDb(hasTable: boolean) {
  const calls: string[] = [];
  const legacy: Record<string, string> = { s1: "old-pass" };
  const missing = { code: "PGRST205", message: "Could not find the table 'public.student_credentials' in the schema cache" };
  const db = {
    from(table: string) {
      const q: any = {
        select: () => q, in: () => q, eq: (_c: string, id: string) => { q.id = id; return q; },
        upsert: () => { calls.push(`upsert:${table}`); return Promise.resolve({ error: hasTable ? null : missing }); },
        update: (v: any) => { q.patch = v; return q; },
        then: (res: any) => {
          if (table === "student_credentials") return res(hasTable ? { data: [{ student_id: "s1", password: "new-pass" }], error: null } : { data: null, error: missing });
          if (q.patch) { legacy[q.id] = q.patch.password; calls.push(`update:students`); return res({ error: null }); }
          return res({ data: Object.entries(legacy).map(([id, password]) => ({ id, password })), error: null });
        },
      };
      return q;
    },
  };
  return { db, calls, legacy };
}

describe("student password storage", () => {
  it("recognises the missing-table error from the database", () => {
    expect(isMissingCredentialTable({ code: "PGRST205" })).toBe(true);
    expect(isMissingCredentialTable({ message: "permission denied" })).toBe(false);
  });
  it("saves into the old students column when the new table is missing", async () => {
    const { db, calls, legacy } = fakeDb(false);
    expect(await writePassword(db, "s2", "abc123")).toBeNull();
    expect(calls).toContain("update:students");
    expect(legacy.s2).toBe("abc123");
  });
  it("reads from the old students column when the new table is missing", async () => {
    const { db } = fakeDb(false);
    expect((await readPasswords(db, ["s1"])).s1).toBe("old-pass");
  });
  it("uses the private table when it exists", async () => {
    const { db, calls } = fakeDb(true);
    expect((await readPasswords(db, ["s1"])).s1).toBe("new-pass");
    expect(await writePassword(db, "s1", "x")).toBeNull();
    expect(calls).toEqual(["upsert:student_credentials"]);
  });
});

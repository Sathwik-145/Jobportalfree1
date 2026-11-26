/** Give each student `count` distinct random tests from the pool (fewer if the pool is smaller). */
export function pickRandomTests(studentIds: string[], testIds: string[], count: number, rand: () => number = Math.random): Record<string, string[]> {
  const n = Math.max(0, Math.min(count, testIds.length));
  const out: Record<string, string[]> = {};
  for (const sid of studentIds) {
    const pool = [...testIds];
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    out[sid] = pool.slice(0, n);
  }
  return out;
}

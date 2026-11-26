export function resultDueAt(now: number, cfg: { delayMinutes?: number; frequency?: string; time?: string; tzOffsetMinutes?: number }) {
  if (cfg.frequency !== 'daily') return now + Math.max(0, Math.min(10080, Number(cfg.delayMinutes) || 0)) * 60000;
  const offset = Number(cfg.tzOffsetMinutes ?? 330) * 60000;
  const local = new Date(now + offset);
  const [h, m] = (/^\d{2}:\d{2}$/.test(cfg.time || '') ? cfg.time : '18:17')?.split(':').map(Number) || [18, 17];
  let due = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), h, m) - offset;
  if (due <= now) due += 86400000;
  return due;
}
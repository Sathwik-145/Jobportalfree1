// Shared by browser and server: result-email timing used for a sign-up path until the admin saves their own choice.
export type SourceMode = 'default' | 'now' | 'later' | 'manual';
export interface SourceResultCfg { mode: SourceMode; enabled: boolean; delayMinutes: number; attachPdf: boolean; includeQA: boolean; target: 'personal' }

export const BLANK_SOURCE_CFG: SourceResultCfg = { mode: 'default', enabled: false, delayMinutes: 0, attachPdf: true, includeQA: true, target: 'personal' };

/** Quick-start students get their result email right after submitting unless the admin picks something else. */
export const SOURCE_RESULT_DEFAULTS: Record<string, SourceResultCfg> = {
  quick: { ...BLANK_SOURCE_CFG, mode: 'now', enabled: true },
};

export function sourceResultCfg(saved: Record<string, Partial<SourceResultCfg>> | null | undefined, source: string): SourceResultCfg {
  const s = saved?.[source];
  if (s && typeof s === 'object') return { ...BLANK_SOURCE_CFG, ...s } as SourceResultCfg;
  return SOURCE_RESULT_DEFAULTS[source] || BLANK_SOURCE_CFG;
}

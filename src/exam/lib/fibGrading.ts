// Shared by browser and server: forgiving fill-in-the-blank matching.
export const normFib = (s: unknown, caseSensitive = false) => {
  let t = String(s ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').replace(/^[\s"'`.,;:!?()]+|[\s"'`.,;:!?()]+$/g, '');
  if (!caseSensitive) t = t.toLowerCase();
  return t;
};
export const blankCount = (sentence: string) => Math.max(1, (String(sentence || '').match(/_{3,}/g) || []).length);

/** Accepted alternatives for each blank. One blank → every stored answer is an alternative. */
export function acceptedPerBlank(sentence: string, answers: string[]): string[][] {
  const list = (answers || []).map(String);
  const n = blankCount(sentence);
  if (n === 1) return [list.flatMap((a) => a.split(/\s*[|/]\s*/)).filter(Boolean)];
  return Array.from({ length: n }, (_, i) => (list[i] || '').split(/\s*[|/]\s*/).filter(Boolean));
}

export function fibIsCorrect(f: { sentence: string; answers: string[]; caseSensitive?: boolean }, given: string[]) {
  const acc = acceptedPerBlank(f.sentence, f.answers);
  if (!acc.length || acc.some((a) => !a.length)) return false;
  return acc.every((alts, i) => {
    const g = normFib(given?.[i], !!f.caseSensitive);
    return !!g && alts.some((a) => normFib(a, !!f.caseSensitive) === g);
  });
}

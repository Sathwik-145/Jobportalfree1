import { describe, it, expect } from 'vitest';
import { pickRandomTests } from '@/lib/randomAllot';

describe('random MCQ allotment', () => {
  it('gives each student the requested number of distinct tests', () => {
    const plan = pickRandomTests(['s1', 's2'], ['a', 'b', 'c', 'd'], 3);
    for (const ids of Object.values(plan)) { expect(ids).toHaveLength(3); expect(new Set(ids).size).toBe(3); }
  });
  it('never assigns more tests than exist', () => {
    expect(pickRandomTests(['s1'], ['a', 'b'], 5).s1).toHaveLength(2);
  });
});

import { describe, expect, it } from 'vitest';
import { clampJobCount, cleanFoundJobs, extractJsonArray, linkLooksLive } from '@/lib/jobFinder';

describe('job finder', () => {
  it('keeps the requested amount between 4 and 30', () => {
    expect(clampJobCount(2)).toBe(4);
    expect(clampJobCount(12)).toBe(12);
    expect(clampJobCount(45)).toBe(30);
  });
  it('drops postings without a real link and ones already listed', () => {
    const jobs = cleanFoundJobs([
      { title: 'Dev', company: 'A', source_url: 'https://a.com/job/1' },
      { title: 'Dev', company: 'B', source_url: 'not a link' },
      { title: 'Dev', company: 'C', source_url: 'https://c.com/j' },
      { title: 'Dev', company: 'A', source_url: 'https://a.com/job/1#apply' },
    ], ['https://c.com/j']);
    expect(jobs.map((j) => j.company)).toEqual(['A']);
  });
  it('reads a JSON list wrapped in text', () => {
    expect(extractJsonArray('Here:\n```json\n[{"a":1}]\n```')).toEqual([{ a: 1 }]);
  });
  it('treats missing pages as dead links', () => {
    expect(linkLooksLive(404)).toBe(false);
    expect(linkLooksLive(200)).toBe(true);
  });
});

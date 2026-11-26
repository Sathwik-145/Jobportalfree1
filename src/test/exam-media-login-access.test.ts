import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestMedia, grantedStreams, stopAll, onMediaStopped } from '@/exam/lib/mediaSession';
import { credentialEmail, matchesLogin, personalLoginEnabled, uniquePersonalAddress } from '@/exam/lib/loginIdentity';
import { grantInstantAccess } from '@/exam/lib/instantAccess';
import { examAvailability } from '@/exam/lib/examAvailability';

describe('Exam media shutdown', () => {
  beforeEach(() => stopAll());
  it('stops camera, microphone and screen tracks immediately and clears shared streams', async () => {
    const tracks = [0, 1, 2].map(() => ({ readyState: 'live', stop: vi.fn() }));
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
      getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => tracks.slice(0, 2) }),
      getDisplayMedia: vi.fn().mockResolvedValue({ getTracks: () => [tracks[2]], getVideoTracks: () => [{ getSettings: () => ({ displaySurface: 'monitor' }) }] }),
    } });
    await requestMedia({ camera: true, microphone: true, screen: true });
    const recordingStop = vi.fn(); const dispose = onMediaStopped(recordingStop);
    stopAll(); dispose();
    for (const track of tracks) expect(track.stop).toHaveBeenCalledOnce();
    expect(recordingStop).toHaveBeenCalledOnce();
    expect(grantedStreams()).toEqual({ camMic: null, screen: null });
  });
});
describe('Personal-email rules', () => {
  it('allows everyone independently from email display', () => expect(personalLoginEnabled({ everyone: true, students: {} }, 'a')).toBe(true));
  it('lets an individual be disabled when everyone is enabled', () => expect(personalLoginEnabled({ everyone: true, students: { a: false } }, 'a')).toBe(false));
  it('lets an individual be enabled when everyone is disabled', () => expect(personalLoginEnabled({ everyone: false, students: { a: true } }, 'a')).toBe(true));
  it('keeps generated credentials when display is off', () => expect(credentialEmail('a@student.codexam.com', 'a@example.com', false)).toBe('a@student.codexam.com'));
  it('displays personal credentials when on', () => expect(credentialEmail('a@student.codexam.com', 'A@example.com', true)).toBe('a@example.com'));
  it('accepts personal sign-in without changing generated sign-in', () => { expect(matchesLogin('a@student.codexam.com', 'a@example.com', 'A@example.com')).toBe(true); expect(matchesLogin('a@student.codexam.com', 'a@example.com', 'a@student.codexam.com')).toBe(true); });
  it('rejects personal addresses shared by students', () => expect(uniquePersonalAddress('a', 'a@student.codexam.com', 'a@example.com', { a: 'a@example.com', b: 'a@example.com' }, [])).toBeUndefined());
});
describe('Instant-access rules', () => {
  const now = '2026-11-03T06:00:00Z';
  it('reopens an expired test only for the selected student for the given buffer', () => {
    const next = grantInstantAccess({ b: { exam: { start: '2026-11-02T06:00:00Z', buffer: 10 } } }, ['a'], 'exam', 30, now);
    expect(next.a.exam).toEqual({ start: now, buffer: 30 });
    expect(examAvailability({ id: 'exam', status: 'ended' }, Date.parse(now) + 29 * 60000, next.a.exam).state).toBe('open');
    expect(examAvailability({ id: 'exam', status: 'ended' }, Date.parse(now) + 31 * 60000, next.a.exam).state).toBe('closed');
    expect(next.b.exam.start).toBe('2026-11-02T06:00:00Z');
  });
  it('grants the same start buffer to all chosen students', () => expect(grantInstantAccess({}, ['a', 'b'], 'exam', 30, now)).toEqual({ a: { exam: { start: now, buffer: 30 } }, b: { exam: { start: now, buffer: 30 } } }));
});
/** Media streams granted on the permissions page, kept in memory so the exam reuses them without asking again. */
export type MediaNeeds = { camera: boolean; microphone: boolean; screen: boolean };

let camMic: MediaStream | null = null;
let screen: MediaStream | null = null;
const shutdownListeners = new Set<() => void>();
export function onMediaStopped(listener: () => void) {
  shutdownListeners.add(listener);
  return () => { shutdownListeners.delete(listener); };
}

const live = (s: MediaStream | null) => !!s && s.getTracks().length > 0 && s.getTracks().every(t => t.readyState === 'live');

export function grantedStreams() { return { camMic, screen }; }

export function hasGranted(cfg: MediaNeeds) {
  if ((cfg.camera || cfg.microphone) && !live(camMic)) return false;
  if (cfg.camera && !camMic?.getVideoTracks().length) return false;
  if (cfg.microphone && !camMic?.getAudioTracks().length) return false;
  if (cfg.screen && !live(screen)) return false;
  return true;
}

export function stopAll() {
  const active = [camMic, screen];
  camMic = null; screen = null;
  shutdownListeners.forEach(listener => listener());
  active.forEach(s => s?.getTracks().forEach(t => t.stop()));
}

/** Must be called from a click. Throws a student-friendly message on refusal. */
export async function requestMedia(cfg: MediaNeeds) {
  try {
    if ((cfg.camera || cfg.microphone) && !live(camMic)) {
      camMic = await navigator.mediaDevices.getUserMedia({ video: cfg.camera, audio: cfg.microphone });
    }
    if (cfg.screen && !live(screen)) {
      const s: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: { displaySurface: 'monitor' } });
      const surface = (s.getVideoTracks()[0]?.getSettings() as any)?.displaySurface;
      if (surface && surface !== 'monitor') {
        s.getTracks().forEach(t => t.stop());
        throw new Error('Please share your entire screen, not a window or tab.');
      }
      screen = s;
    }
  } catch (e: any) {
    if (e?.message?.startsWith('Please share')) throw e;
    throw new Error('Permission was not given. Please allow access to continue.');
  }
}

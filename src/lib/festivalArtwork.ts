import { useEffect, useState } from "react";

export const ARTWORK_DURATIONS = [
  { value: 5, label: "5 seconds" },
  { value: 15, label: "15 seconds" },
  { value: 30, label: "30 seconds" },
  { value: 60, label: "1 minute" },
  { value: 300, label: "5 minutes" },
  { value: "permanent", label: "Throughout the festival" },
] as const;
export type ArtworkDuration = typeof ARTWORK_DURATIONS[number]["value"];
export function validArtworkDuration(value: unknown): ArtworkDuration {
  return ARTWORK_DURATIONS.some(option => option.value === value) ? value as ArtworkDuration : 5;
}
export function artworkDuration(settings: { artworkDuration?: ArtworkDuration; custom?: Record<string, { artworkDuration?: ArtworkDuration }> }, id?: string): ArtworkDuration {
  return validArtworkDuration((id ? settings.custom?.[id]?.artworkDuration : undefined) ?? settings.artworkDuration);
}

/** Timed artwork resumes its remaining visit time; permanent artwork never gets a timer. */
export function useFestivalArtwork(id: string | undefined, enabled: boolean, duration: ArtworkDuration, period: string) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    if (!id || !enabled) return;
    if (duration === "permanent") { setVisible(true); return; }
    const key = `fest-artwork:${id}:${period}:${duration}`;
    let started = Date.now();
    try {
      const saved = sessionStorage.getItem(key);
      const parsed = saved === null ? NaN : Number(saved);
      if (Number.isFinite(parsed)) started = parsed;
      else sessionStorage.setItem(key, String(started));
    } catch { /* Artwork still works when browser storage is unavailable. */ }
    const remaining = duration * 1000 - (Date.now() - started);
    if (remaining <= 0) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), remaining);
    return () => window.clearTimeout(timer);
  }, [id, enabled, duration, period]);
  return enabled && !!id && visible;
}
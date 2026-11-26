// Tiny localStorage-backed override store so admins can directly edit
// content shown on public pages (Certifications, etc.) without a backend
// round-trip. Keyed per "surface".

export const loadOverride = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(`inline_edit::${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const saveOverride = <T,>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(`inline_edit::${key}`, JSON.stringify(value));
};

export const clearOverride = (key: string): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`inline_edit::${key}`);
};

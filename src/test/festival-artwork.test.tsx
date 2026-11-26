import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { artworkDuration, useFestivalArtwork } from "@/lib/festivalArtwork";

describe("festival artwork timing", () => {
  beforeEach(() => { vi.useFakeTimers(); sessionStorage.clear(); });
  afterEach(() => { cleanup(); vi.useRealTimers(); });
  it("keeps the legacy five-second default", () => expect(artworkDuration({})).toBe(5));
  it("uses one minute when chosen by the admin", () => {
    const { result } = renderHook(() => useFestivalArtwork("diwali", true, 60, "2026"));
    act(() => vi.advanceTimersByTime(59999)); expect(result.current).toBe(true);
    act(() => vi.advanceTimersByTime(1)); expect(result.current).toBe(false);
  });
  it("uses five minutes when chosen by the admin", () => {
    const { result } = renderHook(() => useFestivalArtwork("diwali", true, 300, "2026"));
    act(() => vi.advanceTimersByTime(299999)); expect(result.current).toBe(true);
    act(() => vi.advanceTimersByTime(1)); expect(result.current).toBe(false);
  });
  it("permanent display stays until the festival ends", () => {
    const { result, rerender } = renderHook(({ id }) => useFestivalArtwork(id, true, "permanent", "2026"), { initialProps: { id: "diwali" as string | undefined } });
    act(() => vi.advanceTimersByTime(86400000)); expect(result.current).toBe(true);
    rerender({ id: undefined }); expect(result.current).toBe(false);
  });
  it("hides artwork immediately when switched off", () => {
    const { result, rerender } = renderHook(({ enabled }) => useFestivalArtwork("diwali", enabled, "permanent", "2026"), { initialProps: { enabled: true } });
    rerender({ enabled: false }); expect(result.current).toBe(false);
  });
  it("per-festival timing overrides the default", () => expect(artworkDuration({ artworkDuration: 60, custom: { diwali: { artworkDuration: "permanent" } } }, "diwali")).toBe("permanent"));
  it("resumes remaining time after navigating back", () => {
    const first = renderHook(() => useFestivalArtwork("diwali", true, 60, "2026"));
    act(() => vi.advanceTimersByTime(30000)); first.unmount();
    const next = renderHook(() => useFestivalArtwork("diwali", true, 60, "2026"));
    expect(next.result.current).toBe(true);
    act(() => vi.advanceTimersByTime(30000)); expect(next.result.current).toBe(false);
  });
});
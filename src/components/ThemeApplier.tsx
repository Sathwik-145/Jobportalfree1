import { useEffect } from "react";
import { applyTheme, readTheme, loadSharedTheme } from "@/lib/themeSettings";

/**
 * Applies the admin-chosen brand theme (colors) to :root on mount and
 * whenever it changes. Mount once at the App root.
 */
const ThemeApplier = () => {
  useEffect(() => {
    applyTheme(readTheme());
    loadSharedTheme().catch(() => {});
  }, []);
  return null;
};

export default ThemeApplier;
